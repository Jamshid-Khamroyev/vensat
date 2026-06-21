import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: process.env.QDRANT_URL || 'https://89a5cd3a-8e54-4c74-8644-7151139d04eb.sa-east-1-0.aws.cloud.qdrant.io',
  apiKey: process.env.QDRANT_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6MGZmMTQyNGQtNGNmMi00ZGNlLWEzNDItZTY5YWNjOTg1NDcyIn0.58fM0RyzhCngoax2yYHUv5a59FtaqcIPY7EJs4MWxxI',
  checkCompatibility: false
});

const COLLECTION_NAME = 'pdf_documents';

export async function setupCollection(): Promise<void> {
  try {
    await client.getCollection(COLLECTION_NAME);

    console.log('Collection already exists');
  } catch (error) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 2048,
        distance: 'Cosine'
      }
    });

    console.log('Collection created');
  }
}

export async function saveToQdrant(chunks: { id: string; text: string }[], embeddings: number[][]): Promise<void> {
  const points = chunks.map((chunk, index) => {
    const emb: any = embeddings[index];
    const vector: number[] = Array.isArray(emb[0]) ? emb[0] : emb;

    return {
      id: index + 1,
      vector: vector as number[],
      payload: {
        text: chunk.text,
        chunkIndex: index,
        timestamp: new Date().toISOString()
      }
    };
  });

  await client.upsert(COLLECTION_NAME, { wait: true, points: points as any });
  console.log(`${points.length} embeddings saved`);
}

export async function searchInQdrant(queryEmbedding: number[], limit: number = 5): Promise<any[]> {
  try {
    const results = await client.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
      score_threshold: 0.3
    });
    return results;
  } catch (error: any) {
    console.error('Search error:', error.message);
    return [];
  }
}