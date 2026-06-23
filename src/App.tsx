import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  chatWithAI,
  generateSentencesForWords,
  ParsedTest 
} from './services/geminiService';
import { WordRecord, GroupWord } from './types';
import PasteWord from './components/paste-word';
import Navbar from './components/navbar';
import TestingPage from './pages/testing';
import api from "./services/api"
import HistoryDetail from './components/history';
import GNewsReader from './components/article';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import MockTest from './pages/mock-test';
import { useUserStore } from './states/user.state';
import { toast } from 'sonner';

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

// --- App ---
export default function App() {
  const { login, user } = useUserStore()
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  // Legacy view state - kept for backward compatibility
  const [view, setView] = useState<'landing' | 'dashboard' | 'mock-test' | 'create' | "article" | 'testing' | 'results' | 'ai-gen' | 'profile' | 'words' | 'stories' | 'story-gen' | 'story-reader' | 'word-group' | 'nytimes-story' | 'springer-reader'>('landing');
  const [currentTest, setCurrentTest] = useState<ParsedTest | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [currentWordGroup, setCurrentWordGroup] = useState<{ name: string; words: WordRecord[], _id: string } | null>(null);
  const [userWords, setUserWords] = useState<GroupWord[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedTime, setSelectedTime] = useState(30); // minutes
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Testing Tools
  const [eliminated, setEliminated] = useState<Record<number, number[]>>({});

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [storyOptions, setStoryOptions] = useState({ topic: '', genre: 'Business', length: 'medium' as 'extended' | 'medium' | 'long', words: '' });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync React Router navigation with legacy view state
  const syncViewWithRoute = (newView: typeof view, id?: string) => {
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
      case 'mock-test':
        navigate('/mock-test');
        break;
      case 'words':
        navigate('/words');
        break;
      case 'testing':
        navigate(`/testing/${id}`);
        break;
      case 'results':
        navigate('/results');
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
        navigate(`/word-group/${currentWordGroup._id}`);
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
    const init = async () => {
      if(!localStorage.getItem("aero_token")) return navigate('/');
      setLoading(true)
      try {
        const { data } = await api.get("/api/auth/me")
        login(data.user)
      } catch (error) {
        navigate('/')
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

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

  const handleAddToDefaultGroup = async (words: { term: string, definition: string , sentence?: string}[]) => {
    try {
      const data = await generateSentencesForWords(words.map(w => w.term));
      const sentenceMap = new Map(
          data.map(item => [item.term, item.sentence])
        );

        words.forEach(word => {
          word.sentence = sentenceMap.get(word.term) || "";
        });
      
      const res = await api.post(`/api/words/${user?._id}/default`, { words });
      
      const existingIndex = userWords.findIndex(w => w.isDefault);
      if (existingIndex >= 0) {
        setUserWords(userWords.map(w => w.isDefault ? res.data : w));
      } else {
        setUserWords([res.data, ...userWords]);
      }
    } catch (e) { toast.error("Failed to save to default group.", e); }
  };

  const startTest = async(id: string) => {
    try {
      syncViewWithRoute('testing', id);
      setEliminated({});
      const response = await api.get(`/api/tests/${id}`)
      setCurrentTest(response.data)
      setTimeLeft(selectedTime * 60);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error("Failed to start test", error);
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
      setIsProcessing(true)
      const response = await api.post(`/api/tests/${id}/check`, { answers });
      console.log(response.data);
      setResult(response.data);
      setViewWithRoute('results');
    } catch (error) { 
      console.log(`Error completing test: ${error}`);
    } finally {
      setIsProcessing(false)
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
      <Navbar />

      <main className="flex-1 overflow-x-hidden">
        {/* React Router Routes */}
        <Routes>
          <Route path="/" element={
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <LandingPage />
            </Suspense>
          } />
          <Route path="/dashboard" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Dashboard startTest={startTest} />
            </Suspense>
          } />
          <Route path="/create" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <ManualTest selectedTime={selectedTime} setSelectedTime={setSelectedTime} setView={setViewWithRoute} isProcessing={isProcessing} setIsProcessing={setIsProcessing} />
            </Suspense>
          } />
          <Route path="/stories" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Stories />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Profile chatInput={chatInput} setChatInput={setChatInput} chatMessages={chatMessages} handleSendMessage={handleSendMessage} setView={setViewWithRoute} chatScrollRef={chatScrollRef} isChatting={isChatting} setChatMessages={setChatMessages} setIsChatting={setIsChatting} />
            </Suspense>
          } />
          <Route path="/words" element={
            <motion.div key="words" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="focus-mode space-y-8">
              <PasteWord setCurrentWordGroup={setCurrentWordGroup} setView={setViewWithRoute} />
            </motion.div>
          } />
          <Route path="/testing/:id" element={<TestingPage eliminated={eliminated} setCurrentTest={setCurrentTest} currentQuestionIndex={currentQuestionIndex} setEliminated={setEliminated} currentTest={currentTest} setCurrentQuestionIndex={setCurrentQuestionIndex} handleCompleteTest={handleCompleteTest} />
          } />
          <Route path="/results" element={
           result ? <Results setView={setViewWithRoute} data={result} currentTest={currentTest} /> : <div>Loading...</div>
          } />
          <Route path="/history/:id" element={<HistoryDetail  />} />
          
          <Route path="/ai-generator" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <AiPracticeGenerator isProcessing={isProcessing} setIsProcessing={setIsProcessing} userWords={userWords} setView={setViewWithRoute} startTest={startTest} />
            </Suspense>
          } />
          <Route path="/story-generator" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <StoryGen userWords={userWords} storyOptions={storyOptions} setStoryOptions={setStoryOptions} setIsProcessing={setIsProcessing} isProcessing={isProcessing} setView={setViewWithRoute} />
            </Suspense>
          } />
          <Route path="/story-reader/:id" element={<StoryReading handleAddToDefaultGroup={handleAddToDefaultGroup}/> } />

          <Route path="/word-group/:groupId" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <WordGroupView />
            </Suspense>
          } />

          <Route path="/mock-test" element={
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <MockTest setView={setViewWithRoute} />
            </Suspense>
          } />

          <Route path="/article" element={<GNewsReader /> } />
        </Routes>
      </main>
    </div>
  );
}