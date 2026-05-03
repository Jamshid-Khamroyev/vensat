import { motion } from "framer-motion"
import { BookOpen, ChevronRight, Clock, Plus, Trash2 } from "lucide-react";

interface StoriesProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    dbStories: { _id: string; title: string; category: string; content: string }[];
    setCurrentStory: (story: any) => void;
    setDbStories: (books: any[]) => void;
}

const Stories = ({ dbStories, setDbStories, setCurrentStory, setView }: StoriesProps) => {

    const handleDeleteStory = async (id: string) => {
        if (!confirm("Delete this story?")) return;
        try {
          await fetch(`/api/stories/${id}`, { method: "DELETE" });
          setDbStories(dbStories.filter(s => s._id !== id));
        } catch (e) { alert("Delete failed."); }
      };

  return (
    <motion.div key="stories" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="focus-mode space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Narrative Archives</h2>
                  <p className="text-slate-500 text-sm">Read AI-generated stories customized for your learning.</p>
                </div>
                <button onClick={() => setView('story-gen')} className="bluebook-button flex items-center gap-3 active:scale-95 shadow-lg"><Plus className="w-4 h-4" /> Create Story</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {dbStories.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <BookOpen className="text-slate-200 w-12 h-12 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No stories found. Create one to begin reading!</p>
                  </div>
                ) : (
                  dbStories.map(s => (
                    <div 
                      key={s._id} 
                      onClick={() => { setCurrentStory(s); setView('story-reader'); }}
                      className="group bg-white md:p-6 p-3 md:rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative"
                    >
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteStory(s._id); }} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      <div className="space-y-4">
                         <div className="inline-flex px-3 py-1 bg-blue-50 text-[10px] font-black uppercase text-cyan-600 rounded-full tracking-widest">{s.category}</div>
                         <h3 className="text-xl font-bold text-slate-800 group-hover:text-cyan-600 transition-colors">{s.title}</h3>
                         <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{s.content.substring(0, 150)}...</p>
                         <div className="flex items-center gap-4 pt-2">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Clock className="w-3.5 h-3.5" /> {Math.ceil(s.content.split(' ').length / 200)} min read</div>
                           <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-all" />
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
  )
}

export default Stories