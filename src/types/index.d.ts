// --- Types ---
export interface AppUser {
    _id: string;
    email: string;
    displayName: string;
    role?: 'admin' | 'user';
    createdAt: string;
    avatar?: string;
    eoi_skill?: { score: number; questionTaken: number };
    sec_skill?: { score: number; questionTaken: number };
    iai_skill?: { score: number; questionTaken: number };
    cas_skill?: { score: number; questionTaken: number };
    accuracy?: { score: number; totalTestsTaken: number };
  }
  
  export interface TestRecord {
    _id: string;  
    title: string;
    timeLimit?: number;
    questions: any[];
    category: string;
    createdAt: string;
  }
  
  export interface SessionRecord {
    _id: string;
    testId: string;
    title?: string;
    score: number;
    total?: number;
    startTime: string;
    endTime?: string;
    status: string;
  }

  export interface CategoryConfig {
  id: DSATCategory;
  name: string;
  icon: any;
  description: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
}
  
  export interface WordRecord {
    _id: string;
    term: string;
    definition: string;
    sentence?: string 
  }

  export interface UserWords { _id: string, title: string, wordsCount: number, createdAt: string, userId: string, isDefault: boolean }
  

  export interface GroupWord {
    _id: string;
    userId: string;
    title: string;
    words: {
      term: string;
      definition: string;
    }[];
    category: string;
    isDefault: boolean;
    createdAt: string;
  }

  export interface WordGroup {
    _id: string;
    name: string;
    words: WordRecord[];
    userId: string;
    createdAt: string;
    order: number;
  }
  
  export interface StoryRecord {
    _id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
  }
  
  export interface Session {
    testId: string;
    userId: string;
    title?: string;
    total?: number;
    answers: Record<string, number>;
    score: number;
    startTime: number;
    endTime?: number;
    status: 'in-progress' | 'completed';
  }


  // Rag Types

  export interface Chunk {
  id: string;
  text: string;
  chunkIndex: number;
}

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    text: string;
    chunkIndex: number;
    totalChunks: number;
    timestamp: string;
  };
}

export interface SearchResult {
  id: string | number;
  score: number;
  payload?: {
    text?: string;
    chunkIndex?: number;
    [key: string]: any;
  };
}

export interface TestQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface TestResponse {
  questions: TestQuestion[];
}

export interface EmbeddingRequest {
  pdfPath: string;
}

export interface GenerateTestRequest {
  topic: string;
  numQuestions?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface ParsedQuestion {
  _id: string;
  text: string;
  options: string[];
  correctAnswerIndex?: number;
  difficulty?: string;
  graph?: string;
  question: string;
  isDual?: boolean;
  category: string;
}

export interface ParsedTest {
  _id: string;
  title: string;
  questions: ParsedQuestion[];
}