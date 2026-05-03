import { motion } from "framer-motion"
import { BrainCircuit, ChevronLeft, RotateCcw, Sparkles } from "lucide-react";
import { generateStory } from "../services/geminiService";
import { AppUser } from "../types";

interface StoryGenProps {
  setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
  userWords: { term: string }[];
  storyOptions: {
    topic: string;
    category: string;
    length: 'short' | 'medium' | 'long';
    words: string;
  }
  setStoryOptions: (options: StoryGenProps['storyOptions']) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  user: AppUser | null;
  setCurrentStory: (story: any) => void;
  setDbStories: (stories: any[]) => void;
  dbStories: any[];
}

const StoryGen = ({ isProcessing, setIsProcessing, setStoryOptions, dbStories, setCurrentStory, setDbStories, user, setView, storyOptions, userWords }: StoryGenProps) => {

  const handleCreateStory = async () => {
    if (!storyOptions.topic || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await generateStory(storyOptions.category, storyOptions.topic, storyOptions.length, storyOptions.words);
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result, userId: user?._id, category: storyOptions.category })
      });
      const saved = await res.json();
      setDbStories([saved, ...dbStories]);
      setCurrentStory(saved);
      setView('story-reader');
    } catch (e) {
      alert("Story generation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div key="story-gen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="focus-mode max-w-2xl mx-auto">
              <div className="bluebook-card p-8 sm:p-12 space-y-8">
                <div className="flex items-center gap-4 mb-4">
                   <button onClick={() => setView('stories')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
                   <div>
                     <h2 className="text-2xl font-black">AI Story Weaver</h2>
                     <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Personalized Content Generation</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2 text-left">
                     <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Learning Context / Topic</label>
                     <input 
                       value={storyOptions.topic} 
                       onChange={e => setStoryOptions({...storyOptions, topic: e.target.value})} 
                       placeholder="e.g. Life in Victorian London, Quantum Physics Basics" 
                       className="bluebook-input bg-slate-50 border-none !py-4 shadow-inner"
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Category</label>
                       <select 
                         value={storyOptions.category} 
                         onChange={e => setStoryOptions({...storyOptions, category: e.target.value})}
                         className="bluebook-input bg-slate-50 border-none !py-4 shadow-inner appearance-none cursor-pointer"
                       >
                         <option>Business</option>
                         <option>Startup</option>
                         <option>Bilionares biography</option>
                         <option>Personal growth</option>
                         <option>Motivation</option>
                         <option>Useful research</option>
                       </select>
                    </div>
                    <div className="space-y-2 text-left">
                       <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Narrative Depth</label>
                       <select 
                         value={storyOptions.length} 
                         onChange={e => setStoryOptions({...storyOptions, length: e.target.value as any})}
                         className="bluebook-input bg-slate-50 border-none !py-4 shadow-inner appearance-none cursor-pointer"
                       >
                         <option value="short">Short Flash (~250 words)</option>
                         <option value="medium">Medium Story (~500 words)</option>
                         <option value="long">Long Dive (~1000 words)</option>
                       </select>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                     <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                       <BrainCircuit className="w-3.5 h-3.5 text-blue-500" /> Focus Vocabulary (Optional)
                     </label>
                     <textarea 
                       value={storyOptions.words} 
                       onChange={e => setStoryOptions({...storyOptions, words: e.target.value})} 
                       placeholder="Enter words to weave into the story..." 
                       className="bluebook-input bg-slate-50 border-none !py-4 shadow-inner h-24 resize-none"
                     />
                     <div className="flex gap-2 items-center">
                        <button onClick={() => setStoryOptions({...storyOptions, words: userWords.slice(0, 5).map(w => w.term).join(', ')})} className="text-[9px] font-bold text-blue-500 hover:underline">Use My Lexicon</button>
                        <span className="text-[9px] text-slate-300">|</span>
                        <button onClick={() => setStoryOptions({...storyOptions, words: ''})} className="text-[9px] font-bold text-slate-400 hover:underline">Clear</button>
                     </div>
                  </div>

                  <button 
                    onClick={handleCreateStory}
                    disabled={isProcessing || !storyOptions.topic}
                    className="bluebook-button w-full !py-5 flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all mt-4"
                  >
                    {isProcessing ? <RotateCcw className="animate-spin w-5 h-5" /> : <><Sparkles className="w-5 h-5" /> Weave Story</>}
                  </button>
                </div>
              </div>
            </motion.div>
  )
}

export default StoryGen