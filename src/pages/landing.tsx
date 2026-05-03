import { motion } from 'framer-motion';
import { Lock, RotateCcw, Sparkles } from 'lucide-react';

interface landingProps {
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    setAuthEmail: React.Dispatch<React.SetStateAction<string>>;
    authEmail: string;
    setUser: React.Dispatch<React.SetStateAction<any>>;
    setView: React.Dispatch<React.SetStateAction<string>>;
    fetchAll: (userId: string) => void;
    isProcessing: boolean;
}

const LandingPage = ({ authEmail, fetchAll, setAuthEmail, setIsProcessing, setUser, setView, isProcessing  }: landingProps) => {

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!authEmail) return;
        setIsProcessing(true);
        try {
           const res = await fetch("/api/auth/login", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ email: authEmail })
           });
           const userData = await res.json();
           setUser(userData);
           localStorage.setItem('aero_user', JSON.stringify(userData));
           fetchAll(userData._id);
           setView('dashboard');
        } catch (e) { alert("Login failed."); }
        finally { setIsProcessing(false); }
      };

  return (
    <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="focus-mode h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center">
      <div className="max-w-xl space-y-6">
        <div className="inline-flex p-3 bg-white rounded-2xl shadow-xl transform rotate-3"><Sparkles className="w-10 h-10 text-blue-600" /></div>
        <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">Elite SAT Preparation & Test Management</h2>
        <p className="text-slate-500 text-base sm:text-lg">Structured learning environment for standardized testing. Powered by Gemini AI and optimized for peak performance.</p>
        <form onSubmit={handleLogin} className="max-w-sm mx-auto p-6 bg-white rounded-3xl shadow-2xl border border-slate-100 space-y-4">
           <div className="space-y-2 text-left">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Universal Email Access</label>
              <input 
                type="email" 
                required 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)} 
                placeholder="Enter your email" 
                className="bluebook-input bg-slate-50 border-none !py-4 shadow-inner"
              />
           </div>
           <button 
             type="submit" 
             disabled={isProcessing}
             className="w-full bluebook-button py-4 flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg shadow-blue-600/20 active:scale-[0.98]"
           >
             {isProcessing ? (
               <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><RotateCcw className="w-4 h-4 animate-spin" /> Verifying...</div>
             ) : (
               <span className="relative z-10 flex items-center gap-3 font-black uppercase text-[10px] tracking-widest"><Lock className="w-4 h-4" /> Start Preparing</span>
             )}
           </button>
        </form>
      </div>
    </motion.div>
  )
}

export default LandingPage