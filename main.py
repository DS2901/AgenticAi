"""
Interactive CLI entry point for the Agentic AI project.
Run this script to chat with the agent in your terminal,
or run server.py to launch the modern Web UI.
"""
from agent_core import agent

if __name__ == "__main__":
    print("=" * 60)
    print("🤖 Agentic AI Assistant (CLI Mode)")
    print("Type your message or 'exit' to quit.")
    print("Tip: Run 'python server.py' to launch the Modern Web UI!")
    print("=" * 60)

    while True:
        user_input = input("\nYou: ").strip()

        if not user_input:
            continue

        if user_input.lower() in ("exit", "quit", "q"):
            print("Goodbye! Have a great day.")
            break

        result = agent.run_sync(user_input)
        print("\nAgent:", result.output)