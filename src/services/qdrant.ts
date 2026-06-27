import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: process.env.QDRANT_URL || 'https://89a5cd3a-8e54-4c74-8644-7151139d04eb.sa-east-1-0.aws.cloud.qdrant.io',
  apiKey: process.env.QDRANT_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6MGZmMTQyNGQtNGNmMi00ZGNlLWEzNDItZTY5YWNjOTg1NDcyIn0.58fM0RyzhCngoax2yYHUv5a59FtaqcIPY7EJs4MWxxI',
  checkCompatibility: false
});

export const COLLECTION_NAME = {
  PDF: 'pdf_documents',
  RULES: 'dsat_rules',
};


export async function setupCollection(collection_name: typeof COLLECTION_NAME[keyof typeof COLLECTION_NAME]): Promise<void> {
  try {
    await client.getCollection(collection_name);

    console.log('Collection already exists');
  } catch (error) {
    await client.createCollection(collection_name, {
      vectors: {
        size: 2048,
        distance: 'Cosine'
      }
    });

    console.log('Collection created');
  }
}

export async function saveToQdrant(chunks: { id: string; text: string }[], embeddings: number[][], collection_name: typeof COLLECTION_NAME[keyof typeof COLLECTION_NAME]): Promise<void> {
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

  await client.upsert(collection_name, { wait: true, points: points as any });
  console.log(`${points.length} embeddings saved`);
}

export async function searchInQdrant(collection_name: typeof COLLECTION_NAME[keyof typeof COLLECTION_NAME], query?: number[]): Promise<any[]> {
  try {
    const total = await client.count(collection_name);

    const randomOffset = Math.floor(
      Math.random() * Math.max(1, total.count - 100)
    );

    let result: any;
    if(query){
      result = await client.search(collection_name, {
        vector: query,
        limit: 3,
        with_payload: true
      });
      return result
    }else {
      result = await client.scroll(collection_name, {
        limit: 4,
        offset: randomOffset,
        with_payload: true
      });
      return result.points
    }
  } catch (error: any) {
    console.error('Search error:', error.message);
    return [];
  }
}