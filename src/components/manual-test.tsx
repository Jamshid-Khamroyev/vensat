import { motion } from "framer-motion";
import { parseTestContent } from "../services/geminiService";

interface ManualTestProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    user: { _id: string; displayName: string; email: string } | null;
    dbTests: any[];
    setDbTests: (tests: any[]) => void;
    selectedTime: number;
    setSelectedTime: (time: number) => void;
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;
}

const ManualTest = ({ selectedTime, dbTests, setDbTests,setSelectedTime,setView, user, isProcessing, setIsProcessing  }: ManualTestProps) => {

    const handleManualImport = async (testText: string, keyText: string) => {
        setIsProcessing(true);
        try {
          const parsed = await parseTestContent(testText, keyText);
          // Save it
          const res = await fetch("/api/tests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...parsed, creatorId: user?._id })
          });
          const saved = await res.json();
          setDbTests([saved, ...dbTests]);
        } catch (e) { alert("Parsing failed."); }
        finally { setIsProcessing(false); }
      };
      
  return (
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
  )
}

export default ManualTest