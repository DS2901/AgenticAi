# 🤖 Agentic AI Studio

An autonomous, full-stack AI Agent powered by **Pydantic AI**, **NVIDIA Nemotron 120B** (via OpenRouter), and real-time execution tools. Features a modern dark-mode Web Studio interface, multi-turn memory, and browser-native voice interaction (Speech-to-Text & Text-to-Speech).

---

## ✨ Features

- **🧠 Agentic Architecture**: Built on [Pydantic AI](https://github.com/pydantic/pydantic-ai) with autonomous function calling and execution inspection.
- **🛠️ Real-Time Live Tools**:
  - `get_weather(city)`: Real-time global weather, temperature, humidity, and wind telemetry via Open-Meteo.
  - `calculate(a, b, operation)`: Deterministic CPU-level mathematical calculations (add, subtract, multiply, divide, power, modulo).
  - `get_distance(city1, city2)`: Haversine geographical aerial distance calculator between any two cities in the world.
- **🎙️ Voice Interaction**:
  - **Speech-to-Text**: Real-time microphone dictation using Web Speech Recognition.
  - **Text-to-Speech**: Natural voice audio playback with automated emoji & symbol filtering.
- **🎨 Modern Web UI**:
  - ChatGPT-style dark mode interface with glassmorphism and animated status indicators.
  - Collapsible **Model Reasoning (Thinking)** accordion showing Chain-of-Thought.
  - Visual **Tool Invocation Banners** displaying arguments and returned outputs.
  - Multi-turn conversation memory per session.
- **💻 CLI Mode**: Terminal interactive loop still preserved for lightweight terminal usage.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/DS2901/AgenticAi.git
cd AgenticAi
```

### 2. Set up virtual environment
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
Create a `.env` file in the root directory:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 5. Run the Application

#### Option A: Web Studio (Recommended)
```bash
python server.py
```
Open **`http://127.0.0.1:8000`** in your browser.

#### Option B: Terminal CLI Mode
```bash
python main.py
```

---

## 📁 Project Structure

```
agentic-ai/
├── agent_core.py       # Core Pydantic AI agent, model configuration & tools
├── server.py           # FastAPI backend server with session memory & static routes
├── main.py             # Interactive CLI entry point
├── requirements.txt    # Project dependencies
├── .env.example        # Environment variables template
├── .gitignore          # Git exclusion rules
└── static/             # Modern Web Studio frontend
    ├── index.html      # Responsive semantic HTML5 interface
    ├── style.css       # Obsidian dark-mode design system & animations
    ├── app.js          # Chat client logic, Markdown, voice STT & TTS
    └── favicon.svg     # Vector brand icon
```

---

## 📄 License
MIT License
