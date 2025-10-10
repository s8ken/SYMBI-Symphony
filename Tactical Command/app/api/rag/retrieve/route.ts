import { NextResponse } from "next/server";
import OpenAI from "openai";
import weaviate from "weaviate-ts-client";

export async function POST(req: Request) {
  const { q, top_k = 6 } = await req.json();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // 1) Embed the query
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: q
  });
  const vec = emb.data[0].embedding as number[];

  // 2) Query Weaviate (GraphQL)
  const client = weaviate.client({
    scheme: "https",
    host: process.env.WEAVIATE_HOST!.replace(/^https?:\/\//, ""),
    apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
  });

  const gql = await client.graphql
    .get()
    .withClassName("VaultDoc") // <-- singular
    .withNearVector({ vector: vec }) // no threshold; just top-k
    .withLimit(top_k)
    .withFields(`
      path
      title
      chunk_index
      content
      updated_at
      metadata
      _additional { id distance }
    `)
    .do();

  const hits = (gql?.data?.Get?.VaultDoc ?? []).map((it: any) => ({
    id: it._additional?.id,
    path: it.path,
    title: it.title,
    chunk_index: it.chunk_index,
    content: it.content,
    updated_at: it.updated_at,
    metadata: it.metadata, // stringified JSON per our schema
    distance: it._additional?.distance,
    similarity: typeof it._additional?.distance === "number"
      ? 1 - it._additional.distance
      : null
  }));

  return NextResponse.json({ matches: hits });
}