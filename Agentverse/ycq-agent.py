# agent.py (Hosted Agentverse)
import os, json, time, hashlib
from typing import Dict, Any
# Pseudocode imports for Agentverse SDK:
# from agentverse import storage, logs

MODELS = ["gpt-4o-mini", "claude-3.7-sonnet"]
ALLOWLIST = {"ycq.example", "www.ycq.example"}

POLICY = {
    "policy_id": "default",
    "models": MODELS,
    "max_input_tokens": 8000,
    "max_output_tokens": 1500,
    "cost_ceiling_usd": 1.00
}

EXECUTOR_URL = os.getenv("SYMBI_EXECUTOR_URL", "https://your-domain/api/exec")

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()

def estimate_cost_usd(model: str, in_tokens: int, out_tokens: int) -> float:
    # naive estimate; replace with your pricing table
    return (in_tokens + out_tokens) * 0.000002

def enforce_policy(model: str, in_tokens: int, out_tokens: int):
    if model not in POLICY["models"]:
        raise ValueError("Model not allowed")
    if in_tokens > POLICY["max_input_tokens"]:
        raise ValueError("Input too large")
    if out_tokens > POLICY["max_output_tokens"]:
        raise ValueError("Output too large")
    if estimate_cost_usd(model, in_tokens, out_tokens) > POLICY["cost_ceiling_usd"]:
        raise ValueError("Cost ceiling exceeded")

def web_fetch(url: str) -> str:
    from urllib.parse import urlparse
    import requests
    host = (urlparse(url).hostname or "").lower()
    if host not in ALLOWLIST:
        raise PermissionError(f"Blocked host: {host}")
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    return r.text[:500_000]

def build_receipt_stub(model: str, tool_ids: list, raw_in: str, raw_out: str) -> Dict[str, Any]:
    return {
        "endpoint": "chat_completions",   # or "responses" if you use that path
        "model": model,
        "tool_ids": tool_ids,
        "sdk_version": "unknown",
        "policy_id": POLICY["policy_id"],
        "input_hash": sha256(raw_in),
        "output_hash": sha256(raw_out),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "status": "UNSIGNED"
    }

def handle_query(input_text: str) -> Dict[str, Any]:
    # naive intent routing for demo
    lower = input_text.lower()
    index = "ycq"
    model = MODELS[0]
    enforce_policy(model, in_tokens=min(len(input_text)//4, 2000), out_tokens=800)

    # RAG stub: in Hosted we only retrieve (ingestion happens elsewhere)
    tool = "rag.query"
    args = {"q": input_text, "index": index, "top_k": 6}

    intent = {
        "task_id": f"tsk_{int(time.time())}",
        "tool": tool,
        "args": args,
        "policy_id": POLICY["policy_id"],
        "model": model
    }

    # Prepare a human-facing summary (raw_out) for hashing (not the full answer)
    raw_out = f"Planned {tool} on index={index}"
    receipt_stub = build_receipt_stub(model, [tool], raw_in=input_text, raw_out=raw_out)

    return {
        "intent": intent,
        "receipt_stub": receipt_stub,
        "next": f"POST {EXECUTOR_URL} with JSON+HMAC"
    }

# Agentverse entrypoint: reads input and prints JSON
def main():
    # payload = agentverse.get_input()
    payload = json.loads(os.environ.get("SYMBI_INPUT", '{"text":"hello"}'))
    out = handle_query(payload.get("text",""))
    print(json.dumps(out))

if __name__ == "__main__":
    main()
