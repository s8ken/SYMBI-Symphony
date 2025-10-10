import { NextRequest, NextResponse } from 'next/server';
import weaviate from 'weaviate-ts-client';
import OpenAI from 'openai';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import crypto from 'crypto';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const weaviateClient = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST || '8fc2400a-786b-46ea-953a-ff4818358657.weaviate.network',
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
});

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { intent, receipt_stub } = await request.json();

    // Execute the tool
    let result: any = {};
    if (intent.tool === 'rag.query') {
      const { q, index, top_k = 6 } = intent.args;

      // Embed the query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: q,
      });
      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Query Weaviate with tactical-command-interface compatible schema
      const queryResponse = await weaviateClient.graphql
        .get()
        .withClassName('VaultDoc')  // Updated to match tactical-command-interface schema
        .withFields('path title chunk_index content doc_id source tags metadata updated_at _additional { distance }')
        .withNearVector({
          vector: queryEmbedding,
          distance: 0.7, // Adjust threshold as needed
        })
        .withWhere({
          path: ['source'],
          operator: 'Equal' as const,
          valueString: 'SYMBI-Vault',
        })
        .withLimit(top_k)
        .do();

      const results = queryResponse.data.Get.VaultDocs || [];

      result = {
        tool: 'rag.query',
        results: results.map((item: any) => ({
          path: item.path,
          title: item.title,
          chunk_index: item.chunk_index,
          content: item.content,
          metadata: item.metadata,
          similarity: 1 - item._additional.distance,
          updated_at: item.updated_at,
        })),
      };
    } else {
      throw new Error(`Unknown tool: ${intent.tool}`);
    }

    // Build the full output
    const raw_out = JSON.stringify(result);
    const output_hash = sha256(raw_out);

    // Update receipt_stub
    const fullReceipt = {
      ...receipt_stub,
      output_hash,
      status: 'SIGNED',
    };

    // Sign the receipt
    const receiptJson = JSON.stringify(fullReceipt);
    const privateKeyHex = process.env.ED25519_PRIV_HEX!;
    const privateKey = Buffer.from(privateKeyHex, 'hex');
    const signature = nacl.sign.detached(Buffer.from(receiptJson), privateKey);
    const signatureB58 = bs58.encode(signature);

    const signedReceipt = {
      ...fullReceipt,
      signature: signatureB58,
    };

    return NextResponse.json({
      result,
      receipt: signedReceipt,
    });
  } catch (error) {
    console.error('Executor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
