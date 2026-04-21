import { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  LogOut, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Timer, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  BookOpen,
  Settings,
  BrainCircuit,
  Wand2,
  FileJson,
  LayoutGrid,
  Trash2,
  Edit2,
  Send,
  MessageSquare,
  GraduationCap,
  X,
  User as UserIcon,
  Lightbulb,
  Highlighter,
  Strikethrough,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { 
  auth 
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  parseTestContent, 
  generateSATTest, 
  generateWordsTest,
  chatWithAI,
  ParsedTest 
} from './services/geminiService';

// --- Types ---
interface TestRecord {
  _id: string;
  title: string;
  timeLimit?: number;
  questions: any[];
  createdAt: string;
}

interface SessionRecord {
  _id: string;
  testId: string;
  title?: string;
  score: number;
  total?: number;
  startTime: string;
  endTime?: string;
  status: string;
}

interface WordRecord {
  _id: string;
  term: string;
  definition: string;
  category: string;
  createdAt: string;
}

interface Session {
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

// --- App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'landing' | 'dashboard' | 'create' | 'testing' | 'results' | 'ai-gen' | 'profile' | 'words'>('landing');
  const [currentTest, setCurrentTest] = useState<ParsedTest | null>(null);
  const [dbTests, setDbTests] = useState<TestRecord[]>([]);
  const [dbSessions, setDbSessions] = useState<SessionRecord[]>([]);
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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        fetchAll(u.uid);
        setView('dashboard');
      } else {
        setView('landing');
      }
    });
    return () => unsubscribe();
  }, []);

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

  const fetchAll = async (uid: string) => {
    try {
      const [testsRes, sessionsRes, wordsRes] = await Promise.all([
        fetch("/api/tests"),
        fetch(`/api/sessions/${uid}`),
        fetch(`/api/words/${uid}`)
      ]);
      setDbTests(await testsRes.json());
      setDbSessions(await sessionsRes.json());
      setUserWords(await wordsRes.json());
    } catch (e) { console.error("Fetch failed", e); }
  };

  const handleAddWord = async (word: { term: string, definition: string, category: string }) => {
    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...word, userId: user?.uid })
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

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = () => signOut(auth);

  const startTest = (test: ParsedTest) => {
    setCurrentTest(test);
    setView('testing');
    setEliminated({});
    setIsHighlighterActive(false);
    setCurrentSession({
      testId: 'active',
      userId: user?.uid || 'guest',
      answers: {},
      score: 0,
      startTime: Date.now(),
      status: 'in-progress'
    });
    setTimeLeft(selectedTime * 60);
    setCurrentQuestionIndex(0);
  };

  const handleManualImport = async (testText: string, keyText: string) => {
    setIsProcessing(true);
    try {
      const parsed = await parseTestContent(testText, keyText);
      // Save it
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed, creatorId: user?.uid })
      });
      const saved = await res.json();
      setDbTests([saved, ...dbTests]);
      startTest(parsed);
    } catch (e) { alert("Parsing failed."); }
    finally { setIsProcessing(false); }
  };

  const handleAIGen = async (options: { type: 'sat' | 'words', value: string, count: number, difficulty?: string, category?: string, words?: string }) => {
    setIsProcessing(true);
    try {
      let parsed;
      // If it's a SAT category (not Math) and words are provided, we use the new logic
      const isMath = options.value.toLowerCase().includes('math');
      if (options.type === 'sat') {
        parsed = await generateSATTest(options.value, options.difficulty || 'Medium', options.count, (!isMath && options.words) ? options.words : undefined);
      } else {
        parsed = await generateWordsTest(options.category || 'General', options.value, options.count);
      }
      
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed, creatorId: user?.uid, timeLimit: selectedTime })
      });
      const saved = await res.json();
      setDbTests([saved, ...dbTests]);
      startTest(parsed);
    } catch (e) { alert("Generation failed."); }
    finally { setIsProcessing(false); }
  };

  const handleRenameTest = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Enter new title:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    try {
      await fetch(`/api/tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });
      if (user) fetchAll(user.uid);
    } catch (e) { alert("Rename failed."); }
  };

  const handleUpdateTimeLimit = async (id: string, currentTime: number) => {
    const newTime = prompt("Enter new time limit (minutes):", currentTime.toString());
    if (!newTime || Number(newTime) === currentTime) return;
    try {
      await fetch(`/api/tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeLimit: Number(newTime) })
      });
      if (user) fetchAll(user.uid);
    } catch (e) { alert("Update failed."); }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Delete this test permanently?")) return;
    try {
      await fetch(`/api/tests/${id}`, { method: "DELETE" });
      if (user) fetchAll(user.uid);
    } catch (e) { alert("Delete failed."); }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this history record?")) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (user) fetchAll(user.uid);
    } catch (e) { alert("Delete failed."); }
  };

  const handleRenameSession = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Rename session record:", currentTitle || "Test Session");
    if (!newTitle || newTitle === currentTitle) return;
    try {
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });
      if (user) fetchAll(user.uid);
    } catch (e) { alert("Rename failed."); }
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
      fetchAll(user.uid);
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
      <header className="h-14 sm:h-16 px-4 sm:px-8 bg-bluebook-navy text-white flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => user && setView('dashboard')}>
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">AeroTest</h1>
        </div>
        
        {user && view === 'testing' && (
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-md border border-white/20">
              <Clock className="w-4 h-4 text-blue-300" />
              <span className="font-mono text-base sm:text-lg tabular-nums">{formatTime(timeLeft)}</span>
            </div>
            <button onClick={handleCompleteTest} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm font-bold transition-all">Finish</button>
          </div>
        )}

        {user && view !== 'testing' && (
          <div className="flex items-center gap-1 sm:gap-2 no-scrollbar">
             <button onClick={() => setView('dashboard')} className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Home</button>
             <button onClick={() => setView('words')} className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === 'words' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>My Words</button>
             <button onClick={() => setView('profile')} className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === 'profile' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Analysis</button>
             <div className="w-[1px] h-4 bg-white/10 mx-2 hidden sm:block" />
             <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-red-400" title="Sign Out"><LogOut className="w-4 h-4 sm:w-5 h-5" /></button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="focus-mode h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center">
              <div className="max-w-xl space-y-6">
                <div className="inline-flex p-3 bg-white rounded-2xl shadow-xl transform rotate-3"><Sparkles className="w-10 h-10 text-blue-600" /></div>
                <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">Elite SAT Preparation & Test Management</h2>
                <p className="text-slate-500 text-base sm:text-lg">Structured learning environment for standardized testing. Powered by Gemini AI and optimized for peak performance.</p>
                <button onClick={handleLogin} className="bluebook-button flex items-center gap-2 mx-auto scale-110 shadow-xl"><Lock className="w-5 h-5" /> Sign In with Google</button>
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
              className="focus-mode space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Good Day, {user?.displayName?.split(' ')[0]}</h2>
                  <p className="text-slate-500 text-sm">Your testing centralized center.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setView('create')} className="bluebook-button !bg-white !text-bluebook-navy border border-bluebook-border flex items-center gap-2 shadow-sm"><FileJson className="w-4 h-4" /> Import</button>
                  <button onClick={() => setView('ai-gen')} className="bluebook-button flex items-center gap-2 shadow-md"><Wand2 className="w-4 h-4" /> AI Generate</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><LayoutGrid className="w-4 h-4" /> Library</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dbTests.length === 0 ? (
                      <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">Library is empty. Create your first test.</div>
                    ) : (
                      dbTests.map((t) => (
                        <div key={t._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                          <div className="p-4 sm:p-5 relative">
                            <div className="absolute top-3 right-3 flex gap-1 z-10">
                              <button onClick={(e) => { e.stopPropagation(); handleUpdateTimeLimit(t._id, t.timeLimit || 30); }} className="p-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-all shadow-sm" title="Edit Time"><Clock className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleRenameTest(t._id, t.title); }} className="p-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all shadow-sm" title="Rename"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteTest(t._id); }} className="p-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shadow-sm" title="Delete"><Trash2 className="w-3 h-3" /></button>
                            </div>
                            <div className="mb-4">
                              <h4 className="font-bold text-sm sm:text-base mb-1 truncate pr-20 text-slate-800">{t.title}</h4>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.questions.length} Quest</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.timeLimit || 30} Min</span>
                              </div>
                            </div>
                            <button onClick={() => startTest(t as any)} className="w-full py-2 bg-slate-900 text-white hover:bg-blue-600 rounded-lg font-black text-[10px] transition-all uppercase tracking-widest">Start Session</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><Clock className="w-4 h-4" /> History</div>
                  <div className="bluebook-card p-4 space-y-3 h-[400px] overflow-y-auto no-scrollbar">
                    {dbSessions.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No activity recorded.</div>
                    ) : (
                      dbSessions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 group transition-all duration-200 shadow-sm hover:shadow-md">
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-[11px] sm:text-xs truncate flex items-center gap-1 text-slate-700">
                              <span className="truncate">{s.title || "Test Session"}</span>
                              <div className="flex gap-0.5 ml-auto sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleRenameSession(s._id, s.title)} className="p-0.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"><Edit2 className="w-2.5 h-2.5" /></button>
                                <button onClick={() => handleDeleteSession(s._id)} className="p-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"><Trash2 className="w-2.5 h-2.5" /></button>
                              </div>
                            </div>
                            <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">{new Date(s.startTime).toLocaleDateString()}</div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="px-2 py-1 bg-blue-50/50 rounded-lg border border-blue-100/50 text-[10px] font-black text-blue-600">
                              {Math.round(((s.score || 0) / (s.total || 1)) * 100)}%
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="focus-mode max-w-2xl">
              <div className="bluebook-card p-6 sm:p-8 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">Manual Test Import</h2>
                  <p className="text-sm text-slate-500">Fast parsing powered by Gemini AI.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2 text-slate-400 tracking-wider">Test Text</label>
                    <textarea id="ti" className="bluebook-input h-48 resize-none" placeholder="Paste questions here..."></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2 text-slate-400 tracking-wider">Answer Key</label>
                    <textarea id="ki" className="bluebook-input h-20 resize-none" placeholder="Paste answers here (e.g. 1-A, 2-B)..."></textarea>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-sm font-bold text-slate-600">Time Limit (Min)</span>
                    <input type="number" value={selectedTime} onChange={e => setSelectedTime(Number(e.target.value))} className="w-20 p-2 border rounded bg-white text-center font-bold" />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setView('dashboard')} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">Cancel</button>
                    <button disabled={isProcessing} onClick={() => {
                        const t = (document.getElementById('ti') as HTMLTextAreaElement).value;
                        const k = (document.getElementById('ki') as HTMLTextAreaElement).value;
                        if(t && k) handleManualImport(t, k);
                      }} className="flex-[2] bluebook-button shadow-md disabled:opacity-50">
                      {isProcessing ? "Processing..." : "Generate Test"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'ai-gen' && (
            <motion.div key="ai-gen" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="focus-mode max-w-2xl">
              <div className="bluebook-card p-6 sm:p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold flex items-center gap-2 tracking-tight"><BrainCircuit className="text-blue-600 w-7 h-7" /> Aero AI Generator</h2>
                    <p className="text-sm text-slate-500">Crafting high-rigor SAT modules instantly.</p>
                  </div>
                  <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Test Type & Category</label>
                       <select 
                         value={genOptions.category} 
                         onChange={e => setGenOptions({...genOptions, category: e.target.value})} 
                         className="bluebook-input !py-3 bg-slate-50 appearance-none text-xs font-bold"
                       >
                          <optgroup label="DSAT Sections">
                            <option>Reading & Writing: Craft & Structure</option>
                            <option>Reading & Writing: Information & Ideas</option>
                            <option>Reading & Writing: Standard English Conventions</option>
                            <option>Reading & Writing: Expression of Ideas</option>
                            <option>Math: Algebra</option>
                            <option>Math: Advanced Math</option>
                            <option>Math: Problem Solving & Data Analysis</option>
                            <option>Math: Geometry & Trigonometry</option>
                          </optgroup>
                          <optgroup label="Vocabulary Focus">
                            <option value="Vocabulary: Science & Tech">Vocabulary: Science & Tech</option>
                            <option value="Vocabulary: Literature & Arts">Vocabulary: Literature & Arts</option>
                            <option value="Vocabulary: History & Social Studies">Vocabulary: History & Social Studies</option>
                          </optgroup>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Complexity</label>
                       <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                         {['Easy', 'Medium', 'Hard'].map(lvl => (
                           <button key={lvl} onClick={() => setGenOptions({...genOptions, difficulty: lvl})} className={`flex-1 py-2 text-[10px] font-black rounded-md transition-all uppercase ${genOptions.difficulty === lvl ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}>{lvl}</button>
                         ))}
                       </div>
                    </div>
                  </div>

                  {!genOptions.category.startsWith('Math') && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Context Words (Optional)</label>
                       <textarea 
                        value={genOptions.words || ''} 
                        onChange={e => setGenOptions({...genOptions, words: e.target.value})} 
                        className="bluebook-input h-24 resize-none text-sm bg-slate-50 border-slate-100" 
                        placeholder="e.g. ephemeral, ubiquitous, pragmatic, resilient..."
                       />
                       <p className="text-[9px] text-slate-400 italic">AI will attempt to prioritize these words within the DSAT passages where appropriate.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Question Count</label>
                       <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <input type="range" min="5" max="25" step="5" value={genOptions.count} onChange={e => setGenOptions({...genOptions, count: Number(e.target.value)})} className="flex-1 accent-blue-600 h-1" />
                          <span className="font-bold text-blue-600 text-xs">{genOptions.count}</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Time Limit (Min)</label>
                       <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <input type="number" value={selectedTime} onChange={e => setSelectedTime(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none font-bold text-xs" />
                       </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      disabled={isProcessing} 
                      onClick={() => handleAIGen({ 
                        type: 'sat', 
                        value: genOptions.category, 
                        count: genOptions.count, 
                        difficulty: genOptions.difficulty,
                        words: genOptions.words
                      })} 
                      className="bluebook-button w-full flex items-center justify-center gap-3 !py-4 shadow-xl active:scale-[0.98] transition-all"
                    >
                      {isProcessing ? <RotateCcw className="animate-spin w-5 h-5" /> : <><Wand2 className="w-5 h-5" /> Assemble AI Module</>}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'words' && (
            <motion.div key="words" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="focus-mode space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Lexicon Manager</h2>
                  <p className="text-slate-500 text-sm">Store private vocabulary for AI-enhanced test generation.</p>
                </div>
                <button onClick={() => {
                  const term = prompt("Enter word/phrase:");
                  const definition = prompt("Enter definition/context:");
                  const category = prompt("Category (e.g. Science, Literature):", "General");
                  if (term && definition) handleAddWord({ term, definition, category: category || 'General' });
                }} className="bluebook-button flex items-center gap-3 active:scale-95"><Plus className="w-4 h-4" /> Add Word</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userWords.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="text-slate-300 w-8 h-8" /></div>
                    <p className="text-slate-400 font-medium">Your lexicon is empty.</p>
                  </div>
                ) : (
                  userWords.map(w => (
                    <div key={w._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                      <button onClick={() => handleDeleteWord(w._id)} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                      <div className="space-y-3">
                         <div className="inline-flex px-2 py-0.5 bg-blue-50 text-[9px] font-black uppercase text-blue-600 rounded tracking-widest">{w.category}</div>
                         <h3 className="text-lg font-bold text-slate-800">{w.term}</h3>
                         <p className="text-xs text-slate-500 leading-relaxed italic">"{w.definition}"</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="focus-mode space-y-6">
              <div className="flex items-center gap-4 mb-2">
                 <button onClick={() => setView('dashboard')} className="p-2 hover:bg-white rounded-full bg-slate-100 text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                 <h2 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="text-blue-600" /> Student Profile</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Stats & Identity */}
                  <div className="bluebook-card p-8 bg-gradient-to-br from-bluebook-navy to-slate-900 text-white border-none shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                       <img src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName}`} className="w-16 h-16 rounded-full border-2 border-blue-400 shadow-lg p-0.5 bg-white" referrerPolicy="no-referrer" />
                       <div>
                          <h3 className="text-xl font-black">{user?.displayName}</h3>
                          <p className="text-blue-300 text-sm font-medium">{user?.email}</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                          <div className="text-2xl font-black">{dbSessions.length}</div>
                          <div className="text-[10px] uppercase font-bold text-blue-300 tracking-tighter">Total Sessions</div>
                       </div>
                       <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                          <div className="text-2xl font-black">{Math.round(dbSessions.reduce((acc, s) => acc + s.score, 0) / (dbSessions.reduce((acc, s) => acc + (s.total || 10), 0) || 1) * 100) || 0}%</div>
                          <div className="text-[10px] uppercase font-bold text-blue-300 tracking-tighter">Avg Mastery</div>
                       </div>
                    </div>
                  </div>

                  {/* Study Tips */}
                  <div className="bluebook-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-400" /> Performance Tips</h3>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">Live Analysis</span>
                    </div>
                    <div className="space-y-4">
                       {(() => {
                         if (dbSessions.length === 0) return (
                            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-400 italic">Complete at least one session to see AI insights.</div>
                         );
                         const avgScore = dbSessions.reduce((acc, s) => acc + (s.score / (s.total || 1)), 0) / dbSessions.length;
                         const tips = [];
                         if (avgScore < 0.6) tips.push({ icon: <GraduationCap className="w-4 h-4 text-amber-500" />, tip: "Review core foundations. Focus on one category at a time to build confidence." });
                         else if (avgScore < 0.85) tips.push({ icon: <BrainCircuit className="w-4 h-4 text-blue-500" />, tip: "Solid accuracy! Use the 'Eliminate' tool more aggressively to narrow down trick questions." });
                         else tips.push({ icon: <Sparkles className="w-4 h-4 text-green-500" />, tip: "Excellent mastery. Focus on full-length mock exams to build mental stamina." });

                         const avgTime = dbSessions.reduce((acc, s) => acc + (s.endTime && s.startTime ? (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) : 0), 0) / dbSessions.length / 60000;
                         if (avgTime > 15) tips.push({ icon: <Clock className="w-4 h-4 text-red-500" />, tip: "Pacing Alert: You are spending significant time per module. Try 20-minute timed sets." });

                         return tips.map((t, idx) => (
                           <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm flex gap-4 items-start shadow-sm hover:shadow-md transition-all">
                              <span className="p-2 bg-white rounded-lg shadow-inner">{t.icon}</span>
                              <p className="text-slate-600 leading-relaxed font-medium">{t.tip}</p>
                           </div>
                         ));
                       })()}
                    </div>
                  </div>
                </div>

                {/* Chatbot */}
                <div className="bluebook-card flex flex-col min-h-[500px] max-h-[600px] overflow-hidden shadow-2xl relative">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><BrainCircuit className="w-4 h-4" /></div>
                       <div>
                          <h4 className="text-sm font-black tracking-tight">AeroBot AI</h4>
                          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> <span className="text-[10px] text-slate-400 font-bold uppercase">Online Coach</span></div>
                       </div>
                    </div>
                    <button onClick={() => setChatMessages([])} className="p-2 hover:bg-slate-100 rounded text-slate-300 hover:text-slate-500 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                  </div>

                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 no-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                         <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center"><MessageSquare className="text-slate-200" /></div>
                         <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto leading-relaxed">Ask me about SAT strategies, formulas, or grammar rules.</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                       <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-md leading-relaxed ${msg.role === 'user' ? 'bg-bluebook-navy text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                            <div className="markdown-body">
                              <Markdown>{msg.parts[0].text}</Markdown>
                            </div>
                          </div>
                       </div>
                    ))}
                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl flex gap-1 items-center shadow-sm">
                           <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                           <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                           <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                       <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bluebook-input !py-2.5 bg-slate-50 border-none px-4" />
                       <button type="submit" disabled={!chatInput.trim() || isChatting} className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"><Send className="w-5 h-5" /></button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
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
                       className={`w-6 h-6 rounded flex items-center justify-center transition-all ${highlightColor === c && isHighlighterActive ? 'ring-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
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
                <div className="flex-1 overflow-y-auto selection:bg-yellow-200/50 focus-mode-inner p-6 sm:p-12">
                   <div className="max-w-2xl mx-auto w-full space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex px-2 py-0.5 bg-slate-50 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 rounded">Question {currentQuestionIndex+1} / {currentTest.questions.length}</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-medium leading-relaxed text-slate-800" onMouseUp={() => isHighlighterActive && applyHighlight()}>{currentTest.questions[currentQuestionIndex].text}</h3>
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
             <motion.div key="results" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="focus-mode max-w-2xl text-center space-y-8">
              <div className="bluebook-card p-10 sm:p-12 space-y-8">
                 <div className="space-y-2">
                    <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">Results Finalized</div>
                    <h2 className="text-4xl font-black">Performance Audit</h2>
                 </div>

                 <div className="flex justify-center">
                    <div className="relative w-40 h-40">
                       <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-blue-600" strokeDasharray={440} strokeDashoffset={440 - (440 * (currentSession.score / currentTest.questions.length))} strokeLinecap="round" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-blue-900">{Math.round((currentSession.score/currentTest.questions.length)*100)}%</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Correct</span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-2xl font-bold">{currentSession.score} / {currentTest.questions.length}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points Secured</div>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-2xl font-bold">{Math.floor((currentSession.endTime! - currentSession.startTime)/60000)}m</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Time</div>
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <button onClick={() => setView('dashboard')} className="flex-1 py-4 bg-slate-100 rounded-xl font-bold hover:bg-slate-200">Main Menu</button>
                    <button onClick={() => setView('testing')} className="flex-1 py-4 bg-bluebook-navy text-white rounded-xl font-bold shadow-xl hover:scale-[1.02] transition-all">Retake Session</button>
                 </div>
              </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

