import { motion } from 'framer-motion';

interface ResultsProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    currentSession: {
        score: number;
        startTime: number;
        endTime?: number;
    };
    currentTest: {
        questions: any[];
    }
}

const Results = ({ currentSession, currentTest, setView }: ResultsProps) => {
  return (
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
  )
}

export default Results