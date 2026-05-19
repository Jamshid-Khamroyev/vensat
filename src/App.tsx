import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  Loader2,
  RotateCcw,
  User as UserIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { 
  chatWithAI,
  ParsedTest 
} from './services/geminiService';
import { AppUser, StoryRecord, TestRecord, WordRecord, GroupWord } from './types';
import PasteWord from './components/paste-word';
import Navbar from './components/navbar';
import TestingPage from './pages/testing';
import api from "./services/api"
import HistoryDetail from './components/history';
import GNewsReader from './components/article';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Lazy loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/landing'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const ManualTest = lazy(() => import('./components/manual-test'));
const AiPracticeGenerator = lazy(() => import('./components/ai-practice-generator'));
const StoryReading = lazy(() => import('./pages/story-reading'));
const StoryGen = lazy(() => import('./components/story-gen'));
const Stories = lazy(() => import('./pages/stories'));
const Profile = lazy(() => import('./pages/profile'));
const Results = lazy(() => import('./components/results'));
const WordGroupView = lazy(() => import('./pages/word-group'));
const NYTStoryReader = lazy(() => import('./pages/nyt-story-reader'));
const SpringerReader = lazy(() => import('./pages/springer-reader'));

// Legacy view wrapper component - keeps old view system working
function LegacyViewWrapper({ 
  view, 
  children 
}: { 
  view: string; 
  children: React.ReactNode 
}) {
  const location = useLocation();
  
  // Hide legacy view if route path matches current view
  const isRouteActive = location.pathname !== '/' && 
    location.pathname !== '/dashboard' && 
    view !== 'landing' && 
    view !== 'dashboard';
  
  if (isRouteActive) return null;
  
  return <>{children}</>;
}

// --- App ---
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [historyId, setHistoryId] = useState<string>("")
  const [currentArticle, setCurrentArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  // Legacy view state - kept for backward compatibility
  const [view, setView] = useState<'landing' | 'dashboard' | 'create' | "history" | "article" | 'testing' | 'results' | 'ai-gen' | 'profile' | 'words' | 'stories' | 'story-gen' | 'story-reader' | 'word-group' | 'nytimes-story' | 'springer-reader'>('landing');
  const [currentTest, setCurrentTest] = useState<ParsedTest | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [dbTests, setDbTests] = useState<TestRecord[]>([]);
  const [dbStories, setDbStories] = useState<StoryRecord[]>([]);
  const [currentStory, setCurrentStory] = useState<StoryRecord | null>(null);
  const [currentNYTStory, setCurrentNYTStory] = useState<{ title: string; abstract: string; url: string; byline: string; published_date: string; section: string; subsection: string; multimedia: { url: string; format: string }[] } | null>(null);
  const [currentSpringerArticle, setCurrentSpringerArticle] = useState<{ title: string; abstract: string; url: string; authors: { name: string }[]; publicationDate: string; journal: string; doi: string; keywords: string[] } | null>(null);
  const [currentWordGroup, setCurrentWordGroup] = useState<{ name: string; words: WordRecord[] } | null>(null);
  const [userWords, setUserWords] = useState<GroupWord[]>([]);
  const [localWords, setLocalWords] = useState<{ term: string; definition?: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedTime, setSelectedTime] = useState(30); // minutes
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Testing Tools
  const [eliminated, setEliminated] = useState<Record<number, number[]>>({});
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [storyOptions, setStoryOptions] = useState({ topic: '', category: 'Business', length: 'medium' as 'short' | 'medium' | 'long', words: '' });
  const [definition, setDefinition] = useState<{ word: string, meaning: string } | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync React Router navigation with legacy view state
  const syncViewWithRoute = (newView: typeof view) => {
    setView(newView);
    switch(newView) {
      case 'landing':
        navigate('/');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'create':
        navigate('/create');
        break;
      case 'stories':
        navigate('/stories');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'words':
        navigate('/words');
        break;
      case 'testing':
        navigate('/testing');
        break;
      case 'results':
        navigate('/results');
        break;
      case 'history':
        navigate('/history');
        break;
      case 'ai-gen':
        navigate('/ai-generator');
        break;
      case 'story-gen':
        navigate('/story-generator');
        break;
      case 'story-reader':
        navigate('/story-reader');
        break;
      case 'word-group':
        navigate(`/word-group/${currentWordGroup?.name}`);
        break;
      case 'nytimes-story':
        navigate('/nytimes-story');
        break;
      case 'springer-reader':
        navigate('/springer-reader');
        break;
      case 'article':
        navigate('/article');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Legacy setView wrapper that also updates route
  const setViewWithRoute = (newView: typeof view) => {
    syncViewWithRoute(newView);
  };

  // Restore from URL params (legacy support)
  useEffect(() => {
    const savedUser = localStorage.getItem('aero_user');
    const savedLocalWords = localStorage.getItem('aero_local_words');
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as typeof view | null;

    if (savedLocalWords) {
      try {
        setLocalWords(JSON.parse(savedLocalWords));
      } catch (e) {
        console.error('Error parsing local words:', e);
      }
    }

    const init = async () => {
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        await fetchAll(u._id);
        if (viewParam && viewParam !== 'landing') {
          setView(viewParam);
          syncViewWithRoute(viewParam);
        } else if (location.pathname === '/') {
          setView('landing');
        } else {
          setView('dashboard');
          navigate('/dashboard');
        }
      } else {
        if (viewParam) setView(viewParam);
        else if (location.pathname === '/') setView('landing');
        else navigate('/');
      }
      setLoading(false);
    };

    init();
  }, []);

  // Restore word-group from URL when words load
  useEffect(() => {
    if (view !== 'word-group' || currentWordGroup || userWords.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const groupName = params.get('groupName');
    if (groupName) {
      const group = userWords.find(g => g.title === groupName);
      if (group) {
        const wordRecords: WordRecord[] = group.words.map((word, idx) => ({
          _id: `${group._id}-${idx}`,
          term: word.term,
          definition: word.definition,
          category: group.category,
          createdAt: group.createdAt
        }));
        setCurrentWordGroup({ name: groupName, words: wordRecords });
      }
    }
  }, [view, userWords, currentWordGroup]);

  // Restore story-reader from URL when stories load
  useEffect(() => {
    if (view !== 'story-reader' || currentStory || dbStories.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('storyId');
    if (storyId) {
      const story = dbStories.find(s => s._id === storyId);
      if (story) setCurrentStory(story);
    }
  }, [view, dbStories, currentStory]);

  useEffect(() => {
    if (view === 'testing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, timeLeft]);

  const fetchAll = async (id: string) => {
    try {
      const [wordsRes, storiesRes] = await Promise.all([
        api.get(`/api/words/${id}`),
        api.get(`/api/stories/${id}`)
      ]);
      
      setUserWords(wordsRes.data);
      setDbStories(storiesRes.data);
    } catch (e) { 
      console.error("Fetch failed", e);
    }
  };

  const handleAddWord = async (words: { term: string, definition: string, sentence: string }[], title?: string) => {
    try {
      const res = await api.post("/api/words", { userId: user?._id, words, title });
      setUserWords([res.data, ...userWords]);
    } catch (e) { alert("Failed to save word group."); }
  };

  const handleDeleteWord = async (id: string) => {
    try {
      await api.delete(`/api/words/${id}`);
      setUserWords(userWords.filter(w => w._id !== id));
    } catch (e) { alert("Delete failed."); }
  };

  const handleUpdateGroup = async (id: string, words: { term: string, definition: string }[], title?: string) => {
    try {
      const res = await api.patch(`/api/words/${id}`, { words, title });
      setUserWords(userWords.map(w => w._id === id ? res.data : w));
    } catch (e) { alert("Group update failed."); }
  };

  const handleAddToDefaultGroup = async (words: { term: string, definition: string }[]) => {
    try {
      const res = await api.post(`/api/words/${user?._id}/default`, { words });
      
      const existingIndex = userWords.findIndex(w => w.isDefault);
      if (existingIndex >= 0) {
        setUserWords(userWords.map(w => w.isDefault ? res.data : w));
      } else {
        setUserWords([res.data, ...userWords]);
      }
    } catch (e) { alert("Failed to save to default group."); }
  };

  const startTest = async(id: string) => {
    try {
      setViewWithRoute('testing');
      setEliminated({});
      setIsHighlighterActive(false);
      const response = await api.get(`/api/tests/${id}`)
      setCurrentTest(response.data)
      setTimeLeft(selectedTime * 60);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error("Failed to start test", error);
    }
  };

  const handleLookup = async (word: string) => {
    if (!word.trim()) return;
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.trim().toLowerCase().replace(/[.,!?;:()]/g, '')}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const meaning = data[0].meanings[0].definitions[0].definition;
      setDefinition({ word, meaning });
    } catch (e) {
      setDefinition({ word, meaning: "Definition unavailable for this word." });
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatMessages, { role: 'user' as const, parts: [{ text: msg }] }];
    setChatMessages(newHistory);
    setIsChatting(true);
    try {
      const response = await chatWithAI(msg, chatMessages);
      if (response) {
        setChatMessages([...newHistory, { role: 'model', parts: [{ text: response }] }]);
      }
    } catch (e) { alert("Chat failed."); }
    finally { setIsChatting(false); }
  };

  const scrollToBottom = () => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [chatMessages]);

  const handleCompleteTest = async (answers: {questionId: string, selectedIndex: number}[], id: string) => {
    try {
      const response = await api.post(`/api/tests/${id}/check`, { answers });
      console.log(response.data);
      setResult(response.data);
      setViewWithRoute('results');
    } catch (error) {
      console.log(`Error completing test: ${error}`);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><RotateCcw className="animate-spin" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-bluebook-bg font-sans selection:bg-blue-100">
      {/* Navbar - using legacy view for navbar logic */}
      <Navbar 
        view={view} 
        setView={setViewWithRoute} 
        setUser={setUser} 
        user={user} 
        formatTime={formatTime} 
        timeLeft={timeLeft}
      />

      <main className="flex-1 overflow-x-hidden">
        {/* React Router Routes */}
        <Routes>
          <Route path="/" element={
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <LandingPage setUser={setUser} user={user} setView={setViewWithRoute} fetchAll={fetchAll} />
            </Suspense>
          } />
          <Route path="/dashboard" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Dashboard fetchAll={fetchAll} startTest={startTest} user={user} setView={setViewWithRoute} />
            </Suspense>
          } />
          <Route path="/create" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <ManualTest selectedTime={selectedTime} setSelectedTime={setSelectedTime} dbTests={dbTests} setDbTests={setDbTests} setView={setViewWithRoute} user={user} isProcessing={isProcessing} setIsProcessing={setIsProcessing} />
            </Suspense>
          } />
          <Route path="/stories" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Stories setCurrentGNewsArticle={setCurrentArticle} dbStories={dbStories} setCurrentStory={setCurrentStory} setDbStories={setDbStories} setView={setViewWithRoute} setCurrentNYTStory={setCurrentNYTStory} setCurrentSpringerArticle={setCurrentSpringerArticle} />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Profile chatInput={chatInput} setChatInput={setChatInput} setHistoryId={setHistoryId} chatMessages={chatMessages} handleSendMessage={handleSendMessage} user={user} setView={setViewWithRoute} chatScrollRef={chatScrollRef} isChatting={isChatting} setChatMessages={setChatMessages} setIsChatting={setIsChatting} />
            </Suspense>
          } />
          <Route path="/words" element={
            <motion.div key="words" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="focus-mode space-y-8">
              <PasteWord handleDeleteGroup={handleDeleteWord} handleAddWord={handleAddWord} handleUpdateGroup={handleUpdateGroup} userWords={userWords} setView={setViewWithRoute} setCurrentWordGroup={setCurrentWordGroup} />
            </motion.div>
          } />
          <Route path="/testing" element={
            currentTest ? <TestingPage eliminated={eliminated} currentQuestionIndex={currentQuestionIndex} setEliminated={setEliminated} setLocalWords={setLocalWords} localWords={localWords} isHighlighterActive={isHighlighterActive} timeLeft={timeLeft} currentTest={currentTest} setCurrentQuestionIndex={setCurrentQuestionIndex} handleCompleteTest={handleCompleteTest} setIsHighlighterActive={setIsHighlighterActive} /> : <div>Loading...</div>
          } />
          <Route path="/results" element={
            currentTest && result ? <Results setView={setViewWithRoute} data={result} currentTest={currentTest} /> : <div>Loading...</div>
          } />
          <Route path="/history" element={<HistoryDetail historyId={historyId} />} />
          <Route path="/ai-generator" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <AiPracticeGenerator isProcessing={isProcessing} setIsProcessing={setIsProcessing} dbTests={dbTests} setDbTests={setDbTests} userWords={userWords} user={user} selectedTime={selectedTime} setSelectedTime={setSelectedTime} setView={setViewWithRoute} startTest={startTest} />
            </Suspense>
          } />
          <Route path="/story-generator" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <StoryGen user={user} userWords={userWords} storyOptions={storyOptions} setStoryOptions={setStoryOptions} setIsProcessing={setIsProcessing} isProcessing={isProcessing} setDbStories={setDbStories} dbStories={dbStories} setCurrentStory={setCurrentStory} setView={setViewWithRoute} />
            </Suspense>
          } />
          <Route path="/story-reader" element={
            currentStory ? <StoryReading currentStory={currentStory} definition={definition} handleAddWord={handleAddWord} handleAddToDefaultGroup={handleAddToDefaultGroup} handleLookup={handleLookup} setDefinition={setDefinition} setView={setViewWithRoute} /> : <div>Loading...</div>
          } />
          <Route path="/word-group/:groupName" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <WordGroupView group={currentWordGroup} setView={setViewWithRoute} handleDeleteWord={handleDeleteWord} />
            </Suspense>
          } />
          <Route path="/nytimes-story" element={
            currentNYTStory ? <NYTStoryReader currentStory={currentNYTStory} setView={setViewWithRoute} /> : <div>Loading...</div>
          } />
          <Route path="/springer-reader" element={
            currentSpringerArticle ? <SpringerReader article={currentSpringerArticle} setView={setViewWithRoute} onSaveWord={handleAddWord} /> : <div>Loading...</div>
          } />
          <Route path="/article" element={
            currentArticle ? <GNewsReader article={currentArticle} setView={setViewWithRoute} /> : <div>Loading...</div>
          } />
        </Routes>
      </main>
    </div>
  );
}