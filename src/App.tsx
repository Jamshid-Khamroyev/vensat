import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  ChevronRight, 
  ChevronLeft,
  RotateCcw,
  LayoutGrid,
  X,
  User as UserIcon,
  Highlighter,
  Strikethrough,
  Flag,
  BookOpen,
  PlusCircle,
  Loader2,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { 
  chatWithAI,
  ParsedTest 
} from './services/geminiService';
import api from './services/api';
import { AppUser, Session, SessionRecord, StoryRecord, TestRecord, WordRecord, GroupWord } from './types';
import PasteWord from './components/paste-word';
import Navbar from './components/navbar';

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


// --- App ---
export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [view, setView] = useState<'landing' | 'dashboard' | 'create' | 'testing' | 'results' | 'ai-gen' | 'profile' | 'words' | 'stories' | 'story-gen' | 'story-reader' | 'word-group' | 'nytimes-story' | 'springer-reader'>('landing');
  const [currentTest, setCurrentTest] = useState<ParsedTest | null>(null);
  const [dbTests, setDbTests] = useState<TestRecord[]>([]);
  const [dbSessions, setDbSessions] = useState<SessionRecord[]>([]);
  const [dbStories, setDbStories] = useState<StoryRecord[]>([]);
  const [currentStory, setCurrentStory] = useState<StoryRecord | null>(null);
  const [currentNYTStory, setCurrentNYTStory] = useState<{ title: string; abstract: string; url: string; byline: string; published_date: string; section: string; subsection: string; multimedia: { url: string; format: string }[] } | null>(null);
  const [currentSpringerArticle, setCurrentSpringerArticle] = useState<{ title: string; abstract: string; url: string; authors: { name: string }[]; publicationDate: string; journal: string; doi: string; keywords: string[] } | null>(null);
  const [currentWordGroup, setCurrentWordGroup] = useState<{ name: string; words: WordRecord[] } | null>(null);
  const [userWords, setUserWords] = useState<GroupWord[]>([]);
  const [localWords, setLocalWords] = useState<{ term: string; definition?: string }[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedTime, setSelectedTime] = useState(30); // minutes
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Testing Tools
  const [eliminated, setEliminated] = useState<Record<number, number[]>>({});
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [highlightColor, setHighlightColor] = useState<'yellow' | 'mint' | 'sky'>('yellow');
  const [loadingVocab, setLoadingVocab] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Advanced AI Gen State
  const [genOptions, setGenOptions] = useState<{ category: string, difficulty: string, count: number, words?: string }>({
    category: 'Reading & Writing: Information & Ideas',
    difficulty: 'Medium',
    count: 10,
    words: ''
  });

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [storyOptions, setStoryOptions] = useState({ topic: '', category: 'Business', length: 'medium' as 'short' | 'medium' | 'long', words: '' });
  const [definition, setDefinition] = useState<{ word: string, meaning: string } | null>(null);
  
  // Vocabulary Tooltips State (for test view)
  const [vocabMeanings, setVocabMeanings] = useState<Record<string, string>>({});
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Restore view from URL on mount
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
        if (viewParam) setView(viewParam);
        else setView('dashboard');
      } else {
        if (viewParam) setView(viewParam);
      }
      setLoading(false);
    };

    init();
  }, []);

  // Sync URL when view or dependent state changes
  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    params.set('view', view);
    if (view === 'word-group' && currentWordGroup) {
      params.set('groupName', currentWordGroup.name);
    } else {
      params.delete('groupName');
    }
    if (view === 'story-reader' && currentStory) {
      params.set('storyId', currentStory._id);
    } else {
      params.delete('storyId');
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [view, currentWordGroup, currentStory, loading]);

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
            handleCompleteTest();
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
      const [testsRes, sessionsRes, wordsRes, storiesRes] = await Promise.all([
        api.get("/api/tests"),
        api.get(`/api/sessions/${id}`),
        api.get(`/api/words/${id}`),
        api.get(`/api/stories/${id}`)
      ]);
      
      setDbTests(testsRes.data);
      setDbSessions(sessionsRes.data);
      setUserWords(wordsRes.data);
      setDbStories(storiesRes.data);
    } catch (e) { 
      console.error("Fetch failed", e);
    }
  };

  const handleAddWord = async (words: { term: string, definition: string }[], title?: string) => {
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
      
      // Update userWords state
      const existingIndex = userWords.findIndex(w => w.isDefault);
      if (existingIndex >= 0) {
        setUserWords(userWords.map(w => w.isDefault ? res.data : w));
      } else {
        setUserWords([res.data, ...userWords]);
      }
    } catch (e) { alert("Failed to save to default group."); }
  };

  const startTest = (test: ParsedTest) => {
    setCurrentTest(test);
    setView('testing');
    setEliminated({});
    setIsHighlighterActive(false);
    setCurrentSession({
      testId: 'active',
      userId: user?._id || 'guest',
      answers: {},
      score: 0,
      startTime: Date.now(),
      status: 'in-progress'
    });
    setTimeLeft(selectedTime * 60);
    setCurrentQuestionIndex(0);
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

  const handleSelectAnswer = (idx: number) => {
    if (!currentSession) return;
    // Don't select if eliminated
    if (eliminated[currentQuestionIndex]?.includes(idx)) return;
    
    setCurrentSession({
      ...currentSession,
      answers: { ...currentSession.answers, [currentQuestionIndex]: idx }
    });
  };

  const toggleEliminate = (qIdx: number, oIdx: number) => {
    setEliminated(prev => {
      const qElim = prev[qIdx] || [];
      if (qElim.includes(oIdx)) {
        return { ...prev, [qIdx]: qElim.filter(i => i !== oIdx) };
      } else {
        // If selecting an eliminated answer, deselect it from session
        if (currentSession?.answers[qIdx] === oIdx) {
           setCurrentSession({ ...currentSession, answers: { ...currentSession.answers, [qIdx]: -1 } } as any);
        }
        return { ...prev, [qIdx]: [...qElim, oIdx] };
      }
    });
  };

  const applyHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const mark = document.createElement('mark');
    const colorClasses = {
      yellow: 'hl-yellow',
      mint: 'hl-mint',
      sky: 'hl-sky'
    };
    mark.className = colorClasses[highlightColor];
    
    try {
      range.surroundContents(mark);
    } catch (e) {
      console.warn("Highlighting across multiple node types not fully supported in this simple mode.");
    }
    selection.removeAllRanges();
  };

  const clearHighlights = () => {
    const marks = document.querySelectorAll('mark');
    marks.forEach(m => {
      const parent = m.parentNode;
      if (parent) {
        while (m.firstChild) {
          parent.insertBefore(m.firstChild, m);
        }
        parent.removeChild(m);
      }
    });
  };

  // Vocabulary Lookup Function (for test view)
  const fetchVocabMeaning = async (word: string) => {
    if (vocabMeanings[word]) return; // Already cached
    
    setLoadingVocab(word);
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
        const meaning = data[0].meanings[0].definitions[0]?.definition || 'No definition found';
        setVocabMeanings(prev => ({ ...prev, [word]: meaning }));
      }
    } catch (e) {
      console.error('Error fetching vocab meaning:', e);
      setVocabMeanings(prev => ({ ...prev, [word]: 'Definition not found' }));
    } finally {
      setLoadingVocab(null);
    }
  };

  // Toggle fullscreen for test mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Save word temporarily during test
  const saveWordTemporarily = (word: string) => {
    const newLocalWords = [...localWords, { term: word }];
    setLocalWords(newLocalWords);
    localStorage.setItem('aero_local_words', JSON.stringify(newLocalWords));
    toast.success(`"${word}" vaqtincha saqlandi`);
  };

  const handleCompleteTest = async () => {
    if (!currentTest || !currentSession) return;
    let score = 0;
    currentTest.questions.forEach((q, i) => {
      if (currentSession.answers[i] === q.correctAnswerIndex) score++;
    });

    const final = {
      ...currentSession,
      score,
      total: currentTest.questions.length,
      title: currentTest.title,
      endTime: Date.now(),
      status: 'completed'
    };

    if (user) {
      await api.post("/api/sessions", final);
      fetchAll(user._id);
    }

    setCurrentSession(final as Session);
    setView('results');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><RotateCcw className="animate-spin" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-bluebook-bg font-sans selection:bg-blue-100">
      {/* Navbar */}
      <Navbar 
        view={view} 
        setView={setView} 
        setUser={setUser} 
        user={user} 
        handleCompleteTest={handleCompleteTest} 
        formatTime={formatTime} 
        timeLeft={timeLeft}
      />

      <main className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <LandingPage
                setUser={setUser}
                setView={setView}
                fetchAll={fetchAll} 
              />
            </Suspense>
          )}

          {view === 'dashboard' && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Dashboard
                dbSessions={dbSessions}
                dbTests={dbTests}
                fetchAll={fetchAll}
                startTest={startTest}
                user={user}
                setView={setView} 
              />
            </Suspense>
          )}

          {view === 'create' && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <ManualTest
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                dbTests={dbTests}
                setDbTests={setDbTests}
                setView={setView}
                startTest={startTest}
                user={user}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing} 
              />
            </Suspense>
          )}

          {view === 'stories' && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Stories
                dbStories={dbStories}
                setCurrentStory={setCurrentStory}
                setDbStories={setDbStories}
                setView={setView}
                setCurrentNYTStory={setCurrentNYTStory}
                setCurrentSpringerArticle={setCurrentSpringerArticle}
              />
            </Suspense>
          )}

          {view === 'story-gen' && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <StoryGen
                user={user}
                userWords={userWords}
                storyOptions={storyOptions}
                setStoryOptions={setStoryOptions}
                setIsProcessing={setIsProcessing}
                isProcessing={isProcessing}
                setDbStories={setDbStories}
                dbStories={dbStories}
                setCurrentStory={setCurrentStory}
                setView={setView} 
              />
            </Suspense>
          )}

          {view === 'story-reader' && currentStory && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <StoryReading
                currentStory={currentStory}
                definition={definition}
                handleAddWord={handleAddWord}
                handleAddToDefaultGroup={handleAddToDefaultGroup}
                handleLookup={handleLookup}
                setDefinition={setDefinition}
                setView={setView} 
              />
            </Suspense>
          )}


          {view === 'nytimes-story' && currentNYTStory && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <NYTStoryReader
                currentStory={currentNYTStory}
                setView={setView}
              />
            </Suspense>
          )}

          {view === 'springer-reader' && currentSpringerArticle && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <SpringerReader
                article={currentSpringerArticle}
                setView={setView}
                onSaveWord={handleAddWord}
              />
            </Suspense>
          )}

          {view === 'ai-gen' && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <AiPracticeGenerator
                genOptions={genOptions}
                setGenOptions={setGenOptions}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                dbTests={dbTests}
                setDbTests={setDbTests}
                user={user}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                setView={setView}
                startTest={startTest}
              />
            </Suspense>
          )}

          {view === 'words' && (
            <motion.div key="words" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="focus-mode space-y-8">
              <PasteWord handleDeleteGroup={handleDeleteWord} handleAddWord={handleAddWord} handleUpdateGroup={handleUpdateGroup} userWords={userWords} setView={setView} setCurrentWordGroup={setCurrentWordGroup} />
            </motion.div>
          )}

          {view === 'word-group' && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <WordGroupView group={currentWordGroup} setView={setView} handleDeleteWord={handleDeleteWord} />
            </Suspense>
          )}

          {view === 'profile' && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Profile
                chatInput={chatInput}
                setChatInput={setChatInput}
                chatMessages={chatMessages}
                handleSendMessage={handleSendMessage}
                user={user}
                setView={setView}
                chatScrollRef={chatScrollRef}
                fetchAll={fetchAll}
                dbSessions={dbSessions}
                isChatting={isChatting}
                setChatMessages={setChatMessages}
                setIsChatting={setIsChatting}
              />
            </Suspense>
          )}

          {view === 'testing' && currentTest && (
            <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col bg-white">
              {/* Bluebook-style Tools Header - Minimal */}
              <div className="h-12 border-b border-slate-200 bg-white flex items-center px-2 sm:px-4 gap-1 shrink-0">
                <span className="font-mono text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                  {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}
                </span>

                <button
                  onClick={() => setIsHighlighterActive(!isHighlighterActive)}
                  className={`h-8 px-2 sm:px-3 rounded-md flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase transition ${
                    isHighlighterActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isHighlighterActive ? "Active" : "Highlight"}
                  </span>
                </button>

                <button
                  onClick={clearHighlights}
                  className="h-8 w-8 sm:w-auto sm:px-3 rounded-md flex items-center justify-center sm:gap-1 text-slate-500 hover:bg-slate-100 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px] font-semibold uppercase">
                    Clear
                  </span>
                </button>

                <div className="ml-auto flex items-center gap-1">

                  <button
                    onClick={toggleFullscreen}
                    className="h-8 w-8 sm:w-auto sm:px-3 rounded-md flex items-center justify-center sm:gap-1 text-slate-500 hover:bg-slate-100 transition"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    <span className="hidden sm:inline text-[10px] font-semibold uppercase">
                      {isFullscreen ? "Exit" : "Full"}
                    </span>
                  </button>

                  <button
                    onClick={handleCompleteTest}
                    className="h-8 px-2 sm:px-4 rounded-md bg-blue-900 hover:bg-blue-950 cursor-pointer text-white flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold uppercase transition"
                  >
                    <Flag className="w-3.5 h-3.5 sm:hidden" />
                    <span>{window.innerWidth < 640 ? "End" : "Finish"}</span>
                  </button>

                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 overflow-y-auto selection:bg-blue-100 p-6 sm:p-10">
                   <div className="max-w-3xl mx-auto w-full space-y-6">
                      {/* Question Text */}
                      <div className="space-y-4">
                        <p className="text-slate-800 text-base leading-relaxed" onMouseUp={() => isHighlighterActive && applyHighlight()}>{currentTest.questions[currentQuestionIndex].text}</p>
                        <p className="text-slate-800 font-medium text-base">{currentTest.questions[currentQuestionIndex].question}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-2">
                        {currentTest.questions[currentQuestionIndex].options.map((opt: string, idx: number) => {
                          const label = String.fromCharCode(65 + idx);
                          const isSel = currentSession?.answers[currentQuestionIndex] === idx;
                          const isElim = eliminated[currentQuestionIndex]?.includes(idx);
                          const isVocabQuestion = currentTest.questions[currentQuestionIndex].category?.toLowerCase().includes('vocab');
                          const vocabMeaning = vocabMeanings[opt];
                          
                          return (
                            <div key={idx} className="relative group/opt">
                              <button 
                                onClick={() => !isElim && handleSelectAnswer(idx)} 
                                disabled={isElim}
                                className={`w-full flex items-start gap-4 p-3 sm:p-3.5 text-left border rounded-xl transition-all duration-200 ${isSel ? 'border-blue-950 bg-blue-50/30 ring-1 ring-blue-600/10' : isElim ? 'border-slate-50 bg-slate-50 opacity-50 grayscale cursor-not-allowed shadow-inner' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50/50'}`}
                              >
                                <span className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center rounded border font-black text-xs transition-all ${isSel ? 'bg-blue-950 border-blue-950 text-white' : 'border-slate-200 text-slate-400 group-hover/opt:border-blue-950 group-hover/opt:text-blue-950 bg-white'}`}>{label}</span>
                                <div className={`flex-1 md:pr-10 ${isElim ? 'line-through decoration-slate-400 decoration-1 italic text-slate-400' : ''}`}>
                                  <span className={`text-[13px] sm:text-[14px] font-medium leading-tight ${isSel ? 'text-blue-900' : isElim ? 'text-slate-400' : 'text-slate-700'}`}>{opt}</span>
                                  {/* Vocab meaning popup */}
                                  {isVocabQuestion && vocabMeaning && (
                                    <div className="mt-2 p-2 w-full bg-slate-100 border border-slate-200 md:rounded-lg rounded-sm text-xs text-slate-700">
                                      <strong>Definition:</strong> {vocabMeaning}
                                    </div>
                                  )}
                                </div>
                              </button>
                              
                              {/* Vocabulary buttons for vocab questions */}
                              {isVocabQuestion && (
                                <div className="absolute right-3 top-5 -translate-y-1/2 flex items-center gap-1">
                                  {/* Lookup meaning button with loader */}
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      fetchVocabMeaning(opt);
                                    }}
                                    disabled={loadingVocab === opt}
                                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all md:opacity-0 md:group-hover/opt:opacity-100  disabled:opacity-50"
                                    title="Look up meaning"
                                  >
                                    {loadingVocab === opt ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <BookOpen className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  {/* Save word button */}
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      saveWordTemporarily(opt);
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all md:opacity-0 group-hover/opt:opacity-100"
                                    title="Save to dictionary"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Eliminate button */}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleEliminate(currentQuestionIndex, idx); }} 
                                    className={`p-1.5 rounded-lg transition-all ${isElim ? 'bg-slate-100 text-slate-500 opacity-100' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-400 md:opacity-0 group-hover/opt:opacity-100'}`}
                                    title={isElim ? "Undelete" : "Eliminate option"}
                                  >
                                    {isElim ? <RotateCcw className="w-3.5 h-3.5" /> : <Strikethrough className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              )}
                              
                              {/* Regular eliminate button for non-vocab questions */}
                              {!isVocabQuestion && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleEliminate(currentQuestionIndex, idx); }} 
                                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isElim ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 opacity-100' : 'text-slate-200 hover:bg-slate-100 hover:text-slate-400 opacity-0 group-hover/opt:opacity-100 active:scale-90'}`}
                                  title={isElim ? "Undelete" : "Eliminate option"}
                                >
                                  {isElim ? <RotateCcw className="w-3.5 h-3.5" /> : <Strikethrough className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </div>
              </div>
              {/* Footer Desktop */}

              <footer className="h-16 sm:h-20 border-t border-slate-200 px-4 sm:px-8 bg-white flex items-center justify-between">
                <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(p => p - 1)} className="bluebook-button bg-slate-100! text-slate-500! px-4! hover:bg-slate-200! disabled:opacity-0 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Previous</button>
                
                <div className="flex-1 px-4 max-w-md hidden sm:block">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / currentTest.questions.length) * 100}%` }}></div>
                  </div>
                </div>

                {currentQuestionIndex === currentTest.questions.length - 1 ? (
                  <button onClick={handleCompleteTest} className="bluebook-button bg-blue-600! shadow-blue-200">Submit Exam</button>
                ) : (
                  <button onClick={() => setCurrentQuestionIndex(p => p + 1)} className="bluebook-button shadow-md flex items-center gap-1">Next Question <ChevronRight className="w-4 h-4" /></button>
                )}
              </footer>
            </motion.div>
          )}

          {view === 'results' && currentSession && currentTest && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Results
                setView={setView}
                currentSession={currentSession}
                currentTest={currentTest} 
              />
            </Suspense>
          )}
        </AnimatePresence>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}

