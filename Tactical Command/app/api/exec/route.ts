import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { intent, hmac_signature } = body;

    // Verify HMAC signature
    const sharedSecret = process.env.SYMBI_SHARED_SECRET!;
    const expectedHmac = crypto
      .createHmac('sha256', sharedSecret)
      .update(JSON.stringify(intent))
      .digest('hex');

    if (hmac_signature !== expectedHmac) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }

    // Handle different intent types
    if (intent.type === "rag.query") {
      // Call our Weaviate RAG endpoint
      const baseUrl = process.env.BASE_URL || "https://symbi-exec.vercel.app";
      const ragResponse = await fetch(`${baseUrl}/api/rag/retrieve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: intent.query,
          top_k: intent.top_k || 6
        })
      });

      if (!ragResponse.ok) {
        return NextResponse.json({ error: "rag_failed" }, { status: 500 });
      }

      const ragData = await ragResponse.json();

      // Create signed receipt
      const receipt = {
        session_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        intent_type: intent.type,
        query: intent.query,
        matches_count: ragData.matches?.length || 0,
        hash_self: crypto.randomBytes(16).toString('hex')
      };

      // Sign receipt with ed25519 (simplified for demo)
      const privKeyHex = process.env.ED25519_PRIV_HEX!;
      const receiptHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(receipt))
        .digest('hex');

      return NextResponse.json({
        matches: ragData.matches,
        receipt_stub: {
          ...receipt,
          signature: `ed25519:${receiptHash}:${privKeyHex.slice(0, 16)}...` // Demo signature
        },
        next: null
      });
    }

    // Handle other intent types
    return NextResponse.json({
      error: "unsupported_intent",
      supported: ["rag.query"]
    }, { status: 400 });

  } catch (error) {
    console.error("Executor error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}