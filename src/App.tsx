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
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
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
  ParsedTest 
} from './services/geminiService';

// --- Types ---
interface TestRecord {
  _id: string;
  title: string;
  questions: any[];
  createdAt: string;
}

interface Session {
  testId: string;
  userId: string;
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
  const [view, setView] = useState<'landing' | 'dashboard' | 'create' | 'testing' | 'results' | 'ai-gen'>('landing');
  const [currentTest, setCurrentTest] = useState<ParsedTest | null>(null);
  const [dbTests, setDbTests] = useState<TestRecord[]>([]);
  const [dbSessions, setDbSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedTime, setSelectedTime] = useState(30); // minutes
  const [isProcessing, setIsProcessing] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      const testsRes = await fetch("/api/tests");
      const tests = await testsRes.json();
      setDbTests(tests);

      const sessionsRes = await fetch(`/api/sessions/${uid}`);
      const sessions = await sessionsRes.json();
      setDbSessions(sessions);
    } catch (e) { console.error("Fetch failed", e); }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = () => signOut(auth);

  const startTest = (test: ParsedTest) => {
    setCurrentTest(test);
    setView('testing');
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

  const handleAIGen = async (options: { type: 'sat' | 'words', value: string, count: number }) => {
    setIsProcessing(true);
    try {
      let parsed;
      if (options.type === 'sat') parsed = await generateSATTest(options.value, options.count);
      else parsed = await generateWordsTest(options.value, options.count);
      
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed, creatorId: user?.uid })
      });
      const saved = await res.json();
      setDbTests([saved, ...dbTests]);
      startTest(parsed);
    } catch (e) { alert("Generation failed."); }
    finally { setIsProcessing(false); }
  };

  const handleSelectAnswer = (idx: number) => {
    if (!currentSession) return;
    setCurrentSession({
      ...currentSession,
      answers: { ...currentSession.answers, [currentQuestionIndex]: idx }
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
          <div className="flex items-center gap-4">
             <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors"><LogOut className="w-5 h-5" /></button>
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
                        <div key={t._id} className="bluebook-card p-5 group relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"><Settings className="w-4 h-4 text-slate-400 cursor-pointer" /></div>
                          <h4 className="font-bold text-base mb-1 truncate pr-6">{t.title}</h4>
                          <p className="text-xs text-slate-400 mb-4">{t.questions.length} Questions</p>
                          <button onClick={() => startTest(t as any)} className="w-full py-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded font-bold text-xs transition-all uppercase tracking-tighter">Enter Practice</button>
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
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">Test Session</div>
                            <div className="text-[10px] text-slate-400">{new Date(s.startTime).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-600">{s.score} pts</div>
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
              <div className="bluebook-card p-6 sm:p-8 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><BrainCircuit className="text-blue-600" /> AI Generator</h2>
                  <p className="text-sm text-slate-500">Generate professional practice tests in seconds.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => {
                    const val = prompt("Enter Vocabulary Words (comma separated):");
                    if(val) handleAIGen({ type: 'words', value: val, count: 10 });
                  }} className="p-6 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all text-left group">
                    <Sparkles className="w-8 h-8 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-blue-900 group-hover:text-blue-600">Vocabulary Based</h4>
                    <p className="text-xs text-blue-400 mt-1">Tests based on specific word lists.</p>
                  </button>

                  <button onClick={() => {
                    const val = prompt("SAT Topic (Reading, Writing, Math, or specific concepts):");
                    if(val) handleAIGen({ type: 'sat', value: val, count: 10 });
                  }} className="p-6 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all text-left group">
                    <BookOpen className="w-8 h-8 text-bluebook-navy mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600">SAT Style</h4>
                    <p className="text-xs text-slate-400 mt-1">High-rigor SAT practice questions.</p>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-sm font-bold text-slate-600">Test Duration (Min)</span>
                    <input type="number" value={selectedTime} onChange={e => setSelectedTime(Number(e.target.value))} className="w-20 p-2 border rounded bg-white text-center font-bold" />
                </div>

                <button onClick={() => setView('dashboard')} className="w-full py-3 text-slate-400 text-sm font-bold hover:text-slate-600">Back to Dashboard</button>
              </div>
              {isProcessing && <div className="mt-8 text-center animate-pulse flex flex-col items-center gap-4"><RotateCcw className="animate-spin w-8 h-8 text-blue-600" /><p className="font-bold text-blue-600">Gemini AI is crafting your test...</p></div>}
            </motion.div>
          )}

          {view === 'testing' && currentTest && (
            <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-[calc(100vh-64px)] flex flex-col bg-white">
              <div className="flex-1 flex overflow-hidden">
                <div className="w-full lg:w-3/4 flex flex-col p-4 sm:p-12 overflow-y-auto">
                   <div className="max-w-2xl mx-auto w-full space-y-6">
                      <div className="space-y-4">
                        <span className="inline-flex px-2 py-0.5 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded">Question {currentQuestionIndex+1} / {currentTest.questions.length}</span>
                        <h3 className="text-xl sm:text-2xl font-medium leading-relaxed !text-slate-800">{currentTest.questions[currentQuestionIndex].text}</h3>
                      </div>

                      <div className="space-y-3 pt-4">
                        {currentTest.questions[currentQuestionIndex].options.map((opt: string, idx: number) => {
                          const label = String.fromCharCode(65 + idx);
                          const isSel = currentSession?.answers[currentQuestionIndex] === idx;
                          return (
                            <button key={idx} onClick={() => handleSelectAnswer(idx)} className={`w-full flex items-center gap-4 p-4 text-left border-2 rounded-xl transition-all ${isSel ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                              <span className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded border-2 font-bold text-sm ${isSel ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-400'}`}>{label}</span>
                              <span className={`text-base ${isSel ? 'font-bold text-blue-900' : 'text-slate-600'}`}>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                   </div>
                </div>
                {/* Navigation Desktop Sidebar */}
                <aside className="hidden lg:flex w-1/4 border-l border-slate-100 flex-col p-6 bg-slate-50 overflow-y-auto no-scrollbar">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 underline underline-offset-4">Exam Navigator</h4>
                   <div className="grid grid-cols-4 gap-2">
                    {currentTest.questions.map((_, i) => (
                      <button key={i} onClick={() => setCurrentQuestionIndex(i)} className={`aspect-square rounded-md flex items-center justify-center font-bold text-xs transition-all ${currentQuestionIndex === i ? 'bg-bluebook-navy text-white shadow-lg scale-110' : currentSession?.answers[i] !== undefined ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200 text-slate-400'}`}>
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

