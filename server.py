import uuid
import json
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

from agent_core import agent

app = FastAPI(title="Agentic AI Studio", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for multi-turn session conversations
sessions: Dict[str, list] = {}


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ResetRequest(BaseModel):
    session_id: str


@app.get("/api/info")
async def get_info():
    """Returns agent metadata and available tools."""
    tools_info = [
        {
            "name": "get_weather",
            "icon": "🌤️",
            "description": "Live real-time weather & temperature for any global city",
            "params": "city: str"
        },
        {
            "name": "calculate",
            "icon": "🧮",
            "description": "High-precision math calculations (add, subtract, multiply, divide, power, modulo)",
            "params": "a: float, b: float, operation: str"
        },
        {
            "name": "get_distance",
            "icon": "📍",
            "description": "Geographical aerial distance calculation between two cities in kilometers",
            "params": "city1: str, city2: str"
        }
    ]

    return {
        "status": "online",
        "agent_name": "Agentic AI Studio",
        "model": "nvidia/nemotron-3-super-120b-a12b:free",
        "provider": "OpenRouter",
        "tools": tools_info
    }


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Processes user input through the Pydantic AI agent."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Get or create session
    session_id = request.session_id or str(uuid.uuid4())
    history = sessions.get(session_id, [])

    try:
        # Run agent with session history asynchronously
        result = await agent.run(request.message, message_history=history)

        # Update session history
        sessions[session_id] = result.all_messages()

        # Parse tool calls, results, and thinking process
        tools_called = []
        thinking_chunks = []

        # We inspect messages to extract tool executions
        for m in result.all_messages():
            for p in getattr(m, "parts", []):
                p_type = type(p).__name__

                if p_type == "ToolCallPart":
                    parsed_args = p.args
                    if isinstance(parsed_args, str):
                        try:
                            parsed_args = json.loads(parsed_args)
                        except Exception:
                            pass
                    tools_called.append({
                        "tool": p.tool_name,
                        "args": parsed_args
                    })
                elif p_type == "ToolReturnPart":
                    if tools_called and "result" not in tools_called[-1]:
                        tools_called[-1]["result"] = str(p.content)
                elif p_type == "ThinkingPart":
                    if p.content and p.content.strip():
                        thinking_chunks.append(p.content.strip())

        # If thinking chunks are captured, join them
        thinking = "\n\n".join(thinking_chunks) if thinking_chunks else None

        return {
            "reply": result.output,
            "session_id": session_id,
            "tools": tools_called,
            "thinking": thinking
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")


@app.post("/api/reset")
async def reset_session(request: ResetRequest):
    """Resets memory history for the specified session."""
    if request.session_id in sessions:
        sessions[request.session_id] = []
    return {"status": "success", "message": "Conversation history reset."}


# Mount static assets for the Modern Web UI
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    print("🚀 Starting Agentic AI Web Studio on http://localhost:8000 ...")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
