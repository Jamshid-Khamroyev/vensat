import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, ChevronLeft, Lightbulb } from "lucide-react";

interface StoryReadingPorps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    currentStory: { title: string; category: string; content: string };
    handleLookup: (word: string) => void;
    definition: { word: string; meaning: string } | null;
    setDefinition: (def: { word: string; meaning: string } | null) => void;
    handleAddWord: (wordData: { term: string; definition: string; category: string }) => void;
}

const StoryReading = ({ currentStory, definition, handleAddWord, handleLookup, setDefinition, setView }: StoryReadingPorps) => {
  return (
    <motion.div key="story-reader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="focus-mode min-h-[calc(100vh-64px)] bg-white">
              {/* Reader Header */}
              <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center md:gap-4">
                   <button onClick={() => setView('stories')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
                   <div>
                     <h2 className="text-lg font-bold text-slate-800 leading-none">{currentStory.title}</h2>
                     <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1.5">{currentStory.category} • {Math.ceil(currentStory.content.split(' ').length / 200)} min read</p>
                   </div>
                </div>
                <div className="text-[10px] max-md:hidden font-bold text-slate-300 flex items-center gap-2">
                  <Lightbulb className="w-3 h-3 text-amber-400" /> Click any word for definition
                </div>
              </div>

              {/* Reader Content */}
              <div className="max-w-3xl mx-auto py-16 md:px-6 sm:px-12 relative group/reader">
                <article className="prose prose-slate lg:prose-lg mx-auto">
                   <div 
                     className="text-slate-700 leading-[2.2] text-xl font-serif space-y-8 select-auto"
                     onClick={(e) => {
                        const selection = window.getSelection()?.toString().trim();
                        if (selection && selection.length > 1 && selection.length < 25) {
                          handleLookup(selection);
                        }
                     }}
                   >
                     {currentStory.content.split('\n\n').map((para, i) => (
                       <p key={i} className="first-letter:text-5xl max-xl:text-lg first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-blue-900 first-letter:leading-none">
                         {para}
                       </p>
                     ))}
                   </div>
                </article>

                {/* Popover Definition */}
                <AnimatePresence>
                  {definition && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-white rounded-3xl shadow-2xl border border-blue-100 p-6 z-50 text-center space-y-4 ring-8 ring-blue-50/50"
                    >
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600"><BrainCircuit className="w-6 h-6" /></div>
                       <div>
                          <h4 className="text-xl font-black text-slate-800 capitalize leading-none mb-2">{definition.word}</h4>
                          <div className="w-8 h-1 bg-blue-200 mx-auto rounded-full" />
                       </div>
                       <p className="text-sm text-slate-500 leading-relaxed italic">{definition.meaning}</p>
                       <div className="flex gap-2">
                          <button onClick={() => { handleAddWord({ term: definition.word, definition: definition.meaning, category: currentStory.category }); setDefinition(null); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200">Add to Lexicon</button>
                          <button onClick={() => setDefinition(null)} className="py-3 px-5 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">Dismiss</button>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
  )
}

export default StoryReading