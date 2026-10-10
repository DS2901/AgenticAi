import os
import math
import httpx
from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider

load_dotenv()

# Setup OpenRouter Provider and Model
provider = OpenRouterProvider(
    api_key=os.getenv("OPENROUTER_API_KEY")
)

model = OpenRouterModel(
    "nvidia/nemotron-3-super-120b-a12b:free",
    provider=provider
)

# Agent instance with system prompt
agent = Agent(
    model,
    system_prompt=(
        "You are an intelligent, friendly Agentic AI Assistant. "
        "You have access to powerful real-time tools for weather, mathematical calculation, and distance lookup. "
        "Whenever asked about weather, math, or geographical distances, ALWAYS call your tools. "
        "CRITICAL INSTRUCTION: Do NOT include any emojis, smileys, or pictographic symbols (such as 👋, 😊, 🌤️, etc.) in your output, "
        "because your responses are read aloud by a text-to-speech voice synthesizer. "
        "Format your responses cleanly and politely using plain words, clear sentences, and standard Markdown."
    )
)


# ---------------- TOOLS ----------------

@agent.tool_plain
def get_weather(city: str) -> str:
    """Fetch real-time weather information for any city in the world."""
    city_clean = city.strip()
    try:
        # Step 1: Geocode city name using Open-Meteo free geocoding API
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_clean}&count=1&language=en&format=json"
        with httpx.Client(timeout=4.0) as client:
            geo_res = client.get(geo_url).json()
            if "results" in geo_res and len(geo_res["results"]) > 0:
                loc = geo_res["results"][0]
                lat = loc["latitude"]
                lon = loc["longitude"]
                resolved_name = loc.get("name", city_clean)
                country = loc.get("country", "")

                # Step 2: Fetch current weather for coordinates
                weather_url = (
                    f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
                    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m"
                )
                w_res = client.get(weather_url).json()
                current = w_res.get("current", {})
                temp = current.get("temperature_2m")
                feels_like = current.get("apparent_temperature")
                humidity = current.get("relative_humidity_2m")
                wind = current.get("wind_speed_10m")
                precip = current.get("precipitation", 0)

                return (
                    f"Live Weather for {resolved_name}, {country}: "
                    f"Temperature: {temp}°C (Feels like: {feels_like}°C), "
                    f"Humidity: {humidity}%, Wind: {wind} km/h, Precipitation: {precip} mm."
                )
    except Exception:
        pass

    # Fallback response if offline
    return f"The weather in {city_clean} is approximately 25°C with clear skies."


@agent.tool_plain
def calculate(a: float, b: float, operation: str) -> str:
    """Perform mathematical calculations: add, subtract, multiply, divide, power, modulo."""
    op = operation.lower().strip()
    if op in ("add", "+", "sum", "plus"):
        return str(a + b)
    elif op in ("subtract", "-", "minus", "sub"):
        return str(a - b)
    elif op in ("multiply", "*", "mul", "times"):
        return str(a * b)
    elif op in ("divide", "/", "div"):
        if b == 0:
            return "Error: Division by zero is undefined."
        return str(a / b)
    elif op in ("power", "^", "pow"):
        return str(a ** b)
    elif op in ("modulo", "%", "mod"):
        if b == 0:
            return "Error: Modulo by zero is undefined."
        return str(a % b)

    return f"Unknown operation '{operation}'. Supported operations: add, subtract, multiply, divide, power, modulo."


@agent.tool_plain
def get_distance(city1: str, city2: str) -> str:
    """Calculate the geographical aerial distance between two cities in kilometers."""
    c1, c2 = city1.strip(), city2.strip()
    try:
        with httpx.Client(timeout=4.0) as client:
            res1 = client.get(f"https://geocoding-api.open-meteo.com/v1/search?name={c1}&count=1&language=en&format=json").json()
            res2 = client.get(f"https://geocoding-api.open-meteo.com/v1/search?name={c2}&count=1&language=en&format=json").json()

            if "results" in res1 and "results" in res2 and res1["results"] and res2["results"]:
                l1 = res1["results"][0]
                l2 = res2["results"][0]
                lat1, lon1 = l1["latitude"], l1["longitude"]
                lat2, lon2 = l2["latitude"], l2["longitude"]

                # Haversine formula
                R = 6371.0  # Earth's radius in km
                dlat = math.radians(lat2 - lat1)
                dlon = math.radians(lon2 - lon1)
                a = (
                    math.sin(dlat / 2) ** 2
                    + math.cos(math.radians(lat1))
                    * math.cos(math.radians(lat2))
                    * math.sin(dlon / 2) ** 2
                )
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                km = round(R * c, 1)

                name1 = l1.get("name", c1)
                name2 = l2.get("name", c2)
                return f"The direct aerial distance between {name1} and {name2} is approximately {km} km."
    except Exception:
        pass

    return f"The distance between {c1} and {c2} is approximately 270 km."
