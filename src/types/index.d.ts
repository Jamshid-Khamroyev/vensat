// --- Types ---
export interface AppUser {
    _id: string;
    email: string;
    displayName: string;
    isAdmin?: boolean;
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
    category: string;
    createdAt: string;
    groupId?: string;
  }

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