import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  chatWithAI,
  ParsedTest 
} from './services/geminiService';
import { AppUser, Session, SessionRecord, StoryRecord, TestRecord, WordRecord } from './types';
import PasteWord from './components/paste-word';
import LandingPage from './pages/landing';
import Navbar from './components/navbar';
import Dashboard from './pages/dashboard';
import ManualTest from './components/manual-test';
import AiPracticeGenerator from './components/ai-practice-generator';
import StoryReading from './pages/story-reading';
import StoryGen from './components/story-gen';
import Stories from './pages/stories';
import Profile from './pages/profile';
import Results from './components/results';
import WordGroupView from './pages/word-group';


// --- App ---
export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [view, setView] = useState<'landing' | 'dashboard' | 'create' | 'testing' | 'results' | 'ai-gen' | 'profile' | 'words' | 'stories' | 'story-gen' | 'story-reader' | 'word-group'>('landing');
  const [currentTest, setCurrentTest] = useState<ParsedTest | null>(null);
  const [dbTests, setDbTests] = useState<TestRecord[]>([]);
  const [dbSessions, setDbSessions] = useState<SessionRecord[]>([]);
  const [dbStories, setDbStories] = useState<StoryRecord[]>([]);
  const [currentStory, setCurrentStory] = useState<StoryRecord | null>(null);
  const [currentWordGroup, setCurrentWordGroup] = useState<{ name: string; words: WordRecord[] } | null>(null);
  const [userWords, setUserWords] = useState<WordRecord[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedTime, setSelectedTime] = useState(30); // minutes
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Testing Tools
  const [eliminated, setEliminated] = useState<Record<number, number[]>>({});
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [highlightColor, setHighlightColor] = useState<'yellow' | 'mint' | 'sky'>('yellow');

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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Restore view from URL on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('aero_user');
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as typeof view | null;

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
      const sorted = [...userWords].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      const groupIndex = parseInt(groupName.replace('Group ', '')) - 1;
      if (!isNaN(groupIndex) && groupIndex >= 0) {
        const words = sorted.slice(groupIndex * 20, (groupIndex + 1) * 20);
        if (words.length > 0) setCurrentWordGroup({ name: groupName, words });
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
        fetch("/api/tests"),
        fetch(`/api/sessions/${id}`),
        fetch(`/api/words/${id}`),
        fetch(`/api/stories/${id}`)
      ]);
      
      if (testsRes.ok) setDbTests(await testsRes.json());
      if (sessionsRes.ok) setDbSessions(await sessionsRes.json());
      if (wordsRes.ok) setUserWords(await wordsRes.json());
      if (storiesRes.ok) setDbStories(await storiesRes.json());
    } catch (e) { 
      console.error("Fetch failed", e);
    }
  };

  const handleAddWord = async (word: { term: string, definition: string, category: string }) => {
    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...word, userId: user?._id })
      });
      const saved = await res.json();
      setUserWords([saved, ...userWords]);
    } catch (e) { alert("Failed to save word."); }
  };

  const handleDeleteWord = async (id: string) => {
    try {
      await fetch(`/api/words/${id}`, { method: "DELETE" });
      setUserWords(userWords.filter(w => w._id !== id));
    } catch (e) { alert("Delete failed."); }
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
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(final)
      });
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
            <LandingPage
              authEmail={authEmail}
              setAuthEmail={setAuthEmail}
              setIsProcessing={setIsProcessing}
              setUser={setUser}
              setView={setView}
              isProcessing={isProcessing}
              fetchAll={fetchAll} 
            />
          )}

          {view === 'dashboard' && (
            <Dashboard
              dbSessions={dbSessions}
              dbTests={dbTests}
              fetchAll={fetchAll}
              startTest={startTest}
              user={user}
              setView={setView} 
            />
          )}

          {view === 'create' && (
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
          )}

          {view === 'stories' && (
            <Stories
              dbStories={dbStories}
              setCurrentStory={setCurrentStory}
              setDbStories={setDbStories}
              setView={setView} 
            />
          )}

          {view === 'story-gen' && (
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
          )}

          {view === 'story-reader' && currentStory && (
            <StoryReading
              currentStory={currentStory}
              definition={definition}
              handleAddWord={handleAddWord}
              handleLookup={handleLookup}
              setDefinition={setDefinition}
              setView={setView} 
            />
          )}

          {view === 'ai-gen' && (
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
          )}

          {view === 'words' && (
            <motion.div key="words" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="focus-mode space-y-8">
              <PasteWord handleAddWord={handleAddWord} userWords={userWords} setView={setView} setCurrentWordGroup={setCurrentWordGroup} />
            </motion.div>
          )}

          {view === 'word-group' && (
            <WordGroupView group={currentWordGroup} setView={setView} handleDeleteWord={handleDeleteWord} />
          )}

          {view === 'profile' && (
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
          )}

          {view === 'testing' && currentTest && (
            <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-[calc(100vh-64px)] flex flex-col bg-white">
              {/* Tools Header */}
              <div className="h-auto py-2 sm:h-12 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center px-4 gap-3">
                 <div className="flex bg-white border border-slate-200 rounded-md p-1 gap-1">
                   {/* Highlighter Color Selectors */}
                   {(['yellow', 'mint', 'sky'] as const).map(c => (
                     <button
                       key={c}
                       onClick={() => { setHighlightColor(c); setIsHighlighterActive(true); }}
                       className={`w-6 h-6 rounded flex items-center justify-center transition-all ${highlightColor === c && isHighlighterActive ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                     >
                       <div className={`w-4 h-4 rounded-full ${c === 'yellow' ? 'bg-yellow-300' : c === 'mint' ? 'bg-emerald-300' : 'bg-sky-300'}`} />
                     </button>
                   ))}
                 </div>

                 <button onClick={() => setIsHighlighterActive(!isHighlighterActive)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${isHighlighterActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    <Highlighter className="w-3 h-3" /> {isHighlighterActive ? 'Active' : 'Highlighter'}
                 </button>
                 
                 <button onClick={clearHighlights} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-tight text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    <X className="w-3 h-3" /> Clear
                 </button>

                 <div className="h-4 w-[1px] bg-slate-200 ml-auto hidden sm:block" />
                 
                 <button onClick={() => {}} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-tight text-slate-500 hover:bg-slate-100">
                    <Flag className="w-3 h-3" /> Mark
                 </button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 overflow-y-auto selection:bg-yellow-200/50 focus-mode-inner p-2 sm:p-12">
                   <div className="max-w-2xl mx-auto w-full space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex px-2 py-0.5 bg-slate-50 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 rounded">Question {currentQuestionIndex+1} / {currentTest.questions.length}</span>
                        </div>
                        <p className="text-slate-800" onMouseUp={() => isHighlighterActive && applyHighlight()}>{currentTest.questions[currentQuestionIndex].text}</p>
                        <p className="text-slate-800">{currentTest.questions[currentQuestionIndex].question}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-2">
                        {currentTest.questions[currentQuestionIndex].options.map((opt: string, idx: number) => {
                          const label = String.fromCharCode(65 + idx);
                          const isSel = currentSession?.answers[currentQuestionIndex] === idx;
                          const isElim = eliminated[currentQuestionIndex]?.includes(idx);
                          
                          return (
                            <div key={idx} className="relative group/opt">
                              <button 
                                onClick={() => !isElim && handleSelectAnswer(idx)} 
                                disabled={isElim}
                                className={`w-full flex items-start gap-4 p-3 sm:p-3.5 text-left border rounded-xl transition-all duration-200 ${isSel ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/10' : isElim ? 'border-slate-50 bg-slate-50 opacity-50 grayscale cursor-not-allowed shadow-inner' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50/50'}`}
                              >
                                <span className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 flex items-center justify-center rounded border font-black text-xs transition-all ${isSel ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-400 group-hover/opt:border-blue-300 group-hover/opt:text-blue-400 bg-white'}`}>{label}</span>
                                <div className={`flex-1 pr-10 ${isElim ? 'line-through decoration-slate-400 decoration-1 italic text-slate-400' : ''}`}>
                                  <span className={`text-[13px] sm:text-[14px] font-medium leading-tight ${isSel ? 'text-blue-900' : isElim ? 'text-slate-400' : 'text-slate-700'}`}>{opt}</span>
                                </div>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleEliminate(currentQuestionIndex, idx); }} 
                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isElim ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 opacity-100' : 'text-slate-200 hover:bg-slate-100 hover:text-slate-400 opacity-0 group-hover/opt:opacity-100 active:scale-90'}`}
                                title={isElim ? "Undelete" : "Eliminate option"}
                              >
                                {isElim ? <RotateCcw className="w-3.5 h-3.5" /> : <Strikethrough className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </div>
                 {/* Navigation Desktop Sidebar */}
                 <aside className="hidden lg:flex w-1/4 border-l border-slate-100 flex-col p-6 bg-slate-50/50 overflow-y-auto no-scrollbar">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> Exam Navigator</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                     {currentTest.questions.map((_, i) => (
                       <button key={i} onClick={() => setCurrentQuestionIndex(i)} className={`aspect-square rounded border transition-all flex items-center justify-center font-black text-[10px] ${currentQuestionIndex === i ? 'bg-bluebook-navy text-white shadow-md border-bluebook-navy scale-105' : currentSession?.answers[i] !== undefined ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                         {i+1}
                       </button>
                     ))}
                    </div>
                 </aside>
              </div>
              {/* Footer Desktop */}

              <footer className="h-16 sm:h-20 border-t border-slate-200 px-4 sm:px-8 bg-white flex items-center justify-between">
                <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(p => p - 1)} className="bluebook-button !bg-slate-100 !text-slate-500 !px-4 hover:!bg-slate-200 disabled:opacity-0 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Previous</button>
                
                <div className="flex-1 px-4 max-w-md hidden sm:block">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / currentTest.questions.length) * 100}%` }}></div>
                  </div>
                </div>

                {currentQuestionIndex === currentTest.questions.length - 1 ? (
                  <button onClick={handleCompleteTest} className="bluebook-button !bg-blue-600 shadow-blue-200">Submit Exam</button>
                ) : (
                  <button onClick={() => setCurrentQuestionIndex(p => p + 1)} className="bluebook-button shadow-md flex items-center gap-1">Next Question <ChevronRight className="w-4 h-4" /></button>
                )}
              </footer>
            </motion.div>
          )}

          {view === 'results' && currentSession && currentTest && (
             <Results
                setView={setView}
                currentSession={currentSession}
                currentTest={currentTest} 
             />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

