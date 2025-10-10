# agent.py (Hosted Agentverse) - Enhanced with tactical-command-interface integration
import os, json, time, hashlib, requests
from typing import Dict, Any, Optional
# Pseudocode imports for Agentverse SDK:
# from agentverse import storage, logs

MODELS = ["gpt-4o-mini", "claude-3.7-sonnet"]
ALLOWLIST = {"gammatria.example", "localhost"}

POLICY = {
    "policy_id": "default",
    "models": MODELS,
    "max_input_tokens": 8000,
    "max_output_tokens": 1500,
    "cost_ceiling_usd": 1.00
}

EXECUTOR_URL = os.getenv("SYMBI_EXECUTOR_URL", "http://localhost:3002/api/exec")
TACTICAL_BRIDGE_URL = os.getenv("TACTICAL_BRIDGE_URL", "http://localhost:3002/api/tactical-bridge")

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
    host = (urlparse(url).hostname or "").lower()
    if host not in ALLOWLIST:
        raise PermissionError(f"Blocked host: {host}")
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    return r.text[:500_000]

def tactical_rag_query(query: str, top_k: int = 6) -> Optional[Dict[str, Any]]:
    """Query tactical-command-interface via the bridge API."""
    try:
        response = requests.post(TACTICAL_BRIDGE_URL, json={
            "action": "rag_query",
            "query": query,
            "top_k": top_k,
        }, timeout=30)
        
        if response.ok:
            return response.json()
        else:
            print(f"Tactical RAG query failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error querying tactical interface: {e}")
        return None

def verify_tactical_receipt(receipt_query: str, receipt_stub: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Verify trust receipt via tactical-command-interface."""
    try:
        response = requests.post(TACTICAL_BRIDGE_URL, json={
            "action": "verify_receipt",
            "receipt_query": receipt_query,
            "receipt_stub": receipt_stub,
        }, timeout=30)
        
        if response.ok:
            return response.json()
        else:
            print(f"Receipt verification failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error verifying receipt: {e}")
        return None

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
    # Enhanced intent routing with tactical-command-interface integration
    lower = input_text.lower()
    index = "gammatria"
    model = MODELS[0]
    enforce_policy(model, in_tokens=min(len(input_text)//4, 2000), out_tokens=800)

    # Try tactical RAG query first
    tactical_result = tactical_rag_query(input_text)
    
    # RAG stub: in Hosted we only retrieve (ingestion happens elsewhere)
    tool = "rag.query"
    args = {"q": input_text, "index": index, "top_k": 6}

    intent = {
        "task_id": f"tsk_{int(time.time())}",
        "tool": tool,
        "args": args,
        "policy_id": POLICY["policy_id"],
        "model": model,
        "tactical_result": tactical_result  # Include tactical results
    }

    # Prepare a human-facing summary (raw_out) for hashing (not the full answer)
    raw_out = f"Planned {tool} on index={index}"
    if tactical_result:
        raw_out += f" with tactical integration ({len(tactical_result.get('results', []))} docs)"
    
    receipt_stub = build_receipt_stub(model, [tool], raw_in=input_text, raw_out=raw_out)
    
    # Verify receipt with tactical interface
    receipt_verification = verify_tactical_receipt(input_text, receipt_stub)

    return {
        "intent": intent,
        "receipt_stub": receipt_stub,
        "receipt_verification": receipt_verification,
        "tactical_integration": {
            "rag_result": tactical_result,
            "bridge_url": TACTICAL_BRIDGE_URL
        },
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
