import { NextRequest, NextResponse } from 'next/server';
import weaviate from 'weaviate-ts-client';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST || '8fc2400a-786b-46ea-953a-ff4818358657.weaviate.network',
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
});

export async function POST(request: NextRequest) {
  try {
    const { q, index, top_k = 6, source_filter } = await request.json();

    // Embed the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: q,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Build query with tactical-command-interface compatible VaultDoc schema
    let query = client.graphql
      .get()
      .withClassName('VaultDoc')  // Updated to match tactical-command-interface schema
      .withFields('path title chunk_index content doc_id source tags metadata updated_at _additional { distance }')
      .withNearVector({
        vector: queryEmbedding,
        distance: 0.7,
      })
      .withLimit(top_k);

    // Add filters if provided
    const whereConditions: any[] = [];
    
    if (index) {
      whereConditions.push({
        path: ['path'],
        operator: 'Like' as const,
        valueString: `*${index}*`,
      });
    }

    if (source_filter) {
      whereConditions.push({
        path: ['source'],
        operator: 'Equal' as const,
        valueString: source_filter,
      });
    }

    // Apply where conditions
    if (whereConditions.length > 0) {
      if (whereConditions.length === 1) {
        query = query.withWhere(whereConditions[0]);
      } else {
        query = query.withWhere({
          operator: 'And' as const,
          operands: whereConditions,
        });
      }
    }

    const result = await query.do();

    const results = result.data.Get.VaultDoc.map((doc: any) => ({
      path: doc.path,
      title: doc.title,
      chunk_index: doc.chunk_index,
      content: doc.content,
      doc_id: doc.doc_id,
      source: doc.source,
      tags: doc.tags,
      metadata: doc.metadata,
      similarity: 1 - doc._additional.distance,
      updated_at: doc.updated_at,
    }));

    return NextResponse.json({ 
      results,
      query_info: {
        query: q,
        embedding_model: 'text-embedding-3-small',
        total_results: results.length,
        source_system: 'AgentVerse-symbi-executor'
      }
    });
  } catch (error) {
    console.error('RAG query error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
