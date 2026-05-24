import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Play, Volume2, BookOpen, Layers, ArrowLeft, ChevronLeft, ChevronRight, MessageSquare, Sparkles, BrainCircuit, Plus, X, History } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { WordRecord } from "../types";
import api from "../services/api";
import { generateStory } from "../services/geminiService";

interface WordGroupProps {
  setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group") => void;
  group: { name: string; words: WordRecord[]; _id?: string } | null;
  user?: any;
  setDbStories?: (stories: any[]) => void;
  setCurrentStory?: (story: any) => void;
}

type Mode = "flashcard" | "reading";

interface StoryHistory {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  groupName: string;
}

const gradients = [
  "from-rose-500 to-orange-400", "from-violet-500 to-purple-500", "from-emerald-500 to-teal-400",
  "from-amber-500 to-yellow-400", "from-cyan-500 to-blue-500", "from-pink-500 to-rose-400",
  "from-indigo-500 to-blue-400", "from-lime-500 to-green-400"
];

const getGradient = (index: number) => gradients[index % gradients.length];

const STORAGE_KEY = "word_group_stories";

const WordGroupView = ({ setView, group, user, setDbStories, setCurrentStory }: WordGroupProps) => {
  const [mode, setMode] = useState<Mode>("flashcard");
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const constraintsRef = useRef(null);
  
  const [story, setStory] = useState<string>("");
  const [storyTitle, setStoryTitle] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [definition, setDefinition] = useState<{ word: string; meaning: string } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [wordsToAdd, setWordsToAdd] = useState<{ term: string; definition: string }[]>([]);
  const [storyHistory, setStoryHistory] = useState<StoryHistory[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const words = group?.words && Array.isArray(group.words) ? group.words : [];
  const groupName = group?.name || "Word Group";
  
  const fontSizeClasses = { small: 'text-sm', medium: 'text-base', large: 'text-lg' };

  // Load stories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const groupStories = parsed.filter((s: StoryHistory) => s.groupName === groupName);
        setStoryHistory(groupStories);
        if (groupStories.length > 0) {
          const latest = groupStories[groupStories.length - 1];
          setStory(latest.content);
          setStoryTitle(latest.title);
          setCurrentHistoryId(latest.id);
        }
      } catch (e) {
        console.error("Failed to load stories:", e);
      }
    }
  }, [groupName]);

  // Save story to localStorage
  const saveStoryToLocal = (title: string, content: string) => {
    const newStory: StoryHistory = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: Date.now(),
      groupName
    };
    
    const saved = localStorage.getItem(STORAGE_KEY);
    let allStories: StoryHistory[] = saved ? JSON.parse(saved) : [];
    allStories = allStories.filter(s => s.groupName !== groupName);
    allStories.push(newStory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allStories));
    
    setStoryHistory(prev => [...prev, newStory]);
    setCurrentHistoryId(newStory.id);
    return newStory;
  };

  const handleCreateStory = useCallback(async () => {
    if (words.length === 0) {
      toast.error("No words to generate story");
      return;
    }
    if (isGenerating) return;
    
    setIsGenerating(true);
    const loadingId = toast.loading("Creating your fantasy story...");
    
    try {
      const allWords = words.map(w => w.term).join(", ");
      const result = await generateStory("Fantasy", "Any fantasty and professional theme", "medium", allWords);
      
      if (!result.title || !result.content) throw new Error('Story not generated');
      
      setStoryTitle(result.title);
      setStory(result.content);
      
      saveStoryToLocal(result.title, result.content);
      
      if (user?._id) {
        try {
          await api.post("/api/stories", {
            userId: user._id, title: result.title, content: result.content, category: "Fantasy"
          });
          const { data: updatedStories } = await api.get("/api/stories", { params: { userId: user._id } });
          setDbStories?.(updatedStories);
          setCurrentStory?.(updatedStories[0]);
        } catch (e) { console.error("Failed to save story to DB:", e); }
      }
      
      toast.success("Story created successfully!", { id: loadingId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create story', { id: loadingId });
      setStory("");
      setStoryTitle("");
    } finally {
      setIsGenerating(false);
    }
  }, [words, isGenerating, user, setDbStories, setCurrentStory, groupName]);

  const loadStoryFromHistory = (historyItem: StoryHistory) => {
    setStory(historyItem.content);
    setStoryTitle(historyItem.title);
    setCurrentHistoryId(historyItem.id);
    toast.info(`Loaded: ${historyItem.title}`);
  };

  const handleLookup = async (word: string) => {
    setIsLookingUp(true);
    try {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.addEventListener('readystatechange', function() {
        if (this.readyState === this.DONE) {
          try {
            const info = JSON.parse(this.responseText);
            const finalResult = info.data?.translations?.translatedText?.[0] || "Tarjima topilmadi";
            setDefinition({ word, meaning: finalResult });
            toast.info(`"${word}" translated`);
          } catch { 
            setDefinition({ word, meaning: "Tarjima topilmadi" });
            toast.error("Translation failed");
          } finally { 
            setIsLookingUp(false); 
          }
        }
      });
      xhr.open('POST', 'https://deep-translate1.p.rapidapi.com/language/translate/v2');
      xhr.setRequestHeader('x-rapidapi-key', 'f3251f90e7msh179edc31ad1c822p139b02jsnaeb7fd4fb5cd');
      xhr.setRequestHeader('x-rapidapi-host', 'deep-translate1.p.rapidapi.com');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ q: word, source: 'en', target: 'uz' }));
    } catch { 
      setDefinition({ word, meaning: "Tarjima xatolik" });
      toast.error("Translation service error");
      setIsLookingUp(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 1 && selection.length < 30) handleLookup(selection);
  };

  const handleAddToWords = () => {
    if (definition) {
      if (!wordsToAdd.some(w => w.term === definition.word)) {
        setWordsToAdd(prev => [...prev, { term: definition.word, definition: definition.meaning }]);
        toast.success(`"${definition.word}" added to save list`);
      }
      setDefinition(null);
    }
  };

  const handleSaveWords = () => {
    if (wordsToAdd.length) {
      toast.success(`${wordsToAdd.length} word(s) saved to your vocabulary`);
      setWordsToAdd([]);
    }
  };

  const removeFromSaveList = (term: string) => {
    setWordsToAdd(prev => prev.filter(w => w.term !== term));
    toast.info(`"${term}" removed`);
  };

  const startTextToSpeech = () => {
    if (!story) return;
    if (isPlaying) { 
      window.speechSynthesis.cancel(); 
      setIsPlaying(false); 
      return; 
    }
    const utterance = new SpeechSynthesisUtterance(story);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    toast.info("Reading aloud...");
  };

  useEffect(() => {
    return () => { if (isPlaying) window.speechSynthesis.cancel(); };
  }, [isPlaying]);

  const goNext = () => { if (activeIndex < words.length - 1) { setDirection(1); setActiveIndex(prev => prev + 1); } };
  const goPrev = () => { if (activeIndex > 0) { setDirection(-1); setActiveIndex(prev => prev - 1); } };
  const speakText = (text: string) => { 
    const u = new SpeechSynthesisUtterance(text); 
    u.lang = 'en-US'; 
    u.rate = 0.9; 
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(u); 
  };
  
  const progress = ((activeIndex + 1) / words.length) * 100;
  const activeWord = words[activeIndex];

  const formatStoryParagraphs = (content: string) => {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 3) {
      paragraphs.push(sentences.slice(i, i + 3).join(" "));
    }
    return paragraphs;
  };

  if (!group || words.length === 0) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 px-4">
      <div className="text-center space-y-4">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
        <p className="text-slate-500 text-base font-medium">No words found</p>
        <button onClick={() => setView("words")} className="px-5 py-2.5 bg-blue-950 text-white rounded-lg text-sm">Back to Lexicon</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("words")} className="p-2 rounded-full bg-slate-100 text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-blue-950 truncate">{groupName}</h2>
            <p className="text-xs text-slate-400">{words.length} words</p>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setMode("flashcard")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${mode === "flashcard" ? "bg-white text-blue-950 shadow-sm" : "text-slate-400"}`}>
              <Layers className="w-3.5 h-3.5 inline mr-1" />Cards
            </button>
            <button onClick={() => setMode("reading")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${mode === "reading" ? "bg-white text-blue-950 shadow-sm" : "text-slate-400"}`}>
              <BookOpen className="w-3.5 h-3.5 inline mr-1" />Read
            </button>
          </div>
        </div>
      </div>

      {/* Flashcard Mode */}
      {mode === "flashcard" && (
        <div className="flex flex-col flex-1">
          <div className="h-0.5 bg-slate-200 w-full"><div className="h-full bg-blue-950 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
          <div className="flex-1 flex items-center justify-center p-4" ref={constraintsRef}>
            <div className="w-full max-w-md relative">
              <AnimatePresence mode="wait" custom={direction}>
                {activeWord && (
                  <motion.div key={activeWord._id} custom={direction} initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }} transition={{ duration: 0.25 }} drag="x" dragConstraints={constraintsRef} dragElastic={0.5} 
                    onDragEnd={(e, info) => { if (info.offset.x > 50 && activeIndex > 0) goPrev(); else if (info.offset.x < -50 && activeIndex < words.length - 1) goNext(); }} className="touch-pan-y">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                      <div className={`bg-gradient-to-r ${getGradient(activeIndex)} p-6 text-white`}>
                        <div className="flex items-center justify-between mb-3">
                          <button onClick={() => speakText(activeWord.term)} className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><Volume2 className="w-5 h-5" /></button>
                          <div className="text-5xl font-black text-white/20">{String(activeIndex + 1).padStart(2, "0")}</div>
                        </div>
                        <h1 className="text-3xl font-black capitalize">{activeWord.term}</h1>
                      </div>
                      <div className="p-6">
                        <div className="mb-5">
                          <div className="flex items-center gap-2 mb-2"><div className="w-1 h-5 bg-blue-950 rounded-full" /><span className="text-xs text-slate-400 uppercase">Meaning</span></div>
                          <p className="text-slate-700 text-base">{activeWord.definition}</p>
                        </div>
                        {activeWord.sentence && (
                          <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-indigo-500" /><span className="text-xs text-slate-400 uppercase">Example</span></div>
                              <button onClick={() => speakText(activeWord.sentence!)} className="p-1.5 rounded-full bg-slate-100"><Volume2 className="w-3.5 h-3.5 text-slate-500" /></button>
                            </div>
                            <p className="text-slate-600 text-sm italic">"{activeWord.sentence}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 p-4 pt-0">
            <button onClick={goPrev} disabled={activeIndex === 0} className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm disabled:opacity-40"><ChevronLeft className="w-4 h-4 inline mr-1" />Prev</button>
            <div className="text-xs text-slate-400 px-3">{activeIndex + 1} / {words.length}</div>
            <button onClick={goNext} disabled={activeIndex === words.length - 1} className="flex-1 py-3 rounded-xl bg-blue-950 text-white font-medium text-sm disabled:opacity-40">Next<ChevronRight className="w-4 h-4 inline ml-1" /></button>
          </div>
          <div className="border-t border-slate-200 bg-white">
            <div className="p-4 border-b border-slate-100"><Layers className="w-4 h-4 text-slate-400 inline mr-2" /><h3 className="font-semibold text-sm text-slate-700 inline">Word List</h3></div>
            <div className="max-h-64 overflow-y-auto">
              {words.map((word, idx) => (
                <button key={word._id} onClick={() => { setDirection(idx > activeIndex ? 1 : -1); setActiveIndex(idx); }}
                  className={`w-full flex items-center gap-3 p-3 text-left border-l-4 ${idx === activeIndex ? "border-l-blue-950 bg-blue-50" : "border-l-transparent"}`}>
                  <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">{idx + 1}</div>
                  <div className="flex-1 min-w-0"><p className={`font-semibold text-sm truncate ${idx === activeIndex ? "text-blue-950" : "text-slate-700"}`}>{word.term}</p><p className="text-xs text-slate-400 truncate">{word.definition}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reading Mode */}
      {mode === "reading" && (
        <div className="flex-1 bg-white flex flex-col">
          <div className="sticky top-[57px] z-20 bg-white border-b border-slate-100 py-3 px-4">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button onClick={handleCreateStory} disabled={isGenerating} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-950 text-white rounded-lg text-sm disabled:opacity-50">
                  {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? "Creating..." : story ? "Regenerate" : "Create Story"}
                </button>
                {story && <button onClick={startTextToSpeech} className="py-2.5 px-4 bg-slate-100 rounded-lg"><Volume2 className="w-4 h-4 text-slate-600" /></button>}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  {(['small','medium','large'] as const).map(s => (
                    <button key={s} onClick={() => setFontSize(s)} className={`w-8 py-1.5 rounded-md text-xs ${fontSize === s ? "bg-white text-blue-950 shadow-sm" : "text-slate-400"}`}>
                      {s === 'small' ? 'A' : s === 'medium' ? 'A' : 'A'}
                    </button>
                  ))}
                </div>
                {wordsToAdd.length > 0 && (
                  <button onClick={handleSaveWords} className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-950 text-white rounded-lg text-xs">
                    <Plus className="w-3.5 h-3.5" />Save ({wordsToAdd.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {wordsToAdd.length > 0 && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-emerald-700 font-medium">Save list:</span>
                {wordsToAdd.map((w, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-md border border-emerald-200">
                    {w.term}<button onClick={() => removeFromSaveList(w.term)}><X className="w-3 h-3 text-emerald-500" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Story Content */}
          <div className="flex-1 overflow-y-auto">
            {story ? (
              <>
                <div className="max-w-2xl mx-auto py-6 px-4">
                  {storyTitle && (
                    <div className="mb-6 text-center border-b border-slate-100 pb-4">
                      <h1 className="text-2xl font-bold text-blue-950">{storyTitle}</h1>
                      <div className="flex justify-center gap-2 mt-2">
                        <span className="text-xs text-blue-950 bg-blue-50 px-2 py-0.5 rounded-full">Fantasy</span>
                        <span className="text-xs text-slate-400">Short Story</span>
                      </div>
                    </div>
                  )}
                  <article ref={contentRef} onMouseUp={handleTextSelection} onTouchEnd={handleTextSelection}>
                    {formatStoryParagraphs(story).map((para, idx) => (
                      <p key={idx} className={`text-slate-700 leading-loose ${fontSizeClasses[fontSize]} mb-5 text-justify ${idx === 0 ? "first-letter:text-4xl first-letter:font-bold first-letter:text-blue-950 first-letter:mr-2 first-letter:float-left first-letter:leading-none" : ""}`}>
                        {para.trim()}
                      </p>
                    ))}
                  </article>
                </div>

                {/* Story History Section */}
                {storyHistory.length > 1 && (
                  <div className="border-t border-slate-100 bg-slate-50 mt-4">
                    <div className="max-w-2xl mx-auto px-4 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="w-4 h-4 text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-700">Previous Stories</h3>
                        <span className="text-xs text-slate-400">{storyHistory.length} total</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {storyHistory.slice(0, -1).reverse().map((item) => (
                          <button
                            key={item.id}
                            onClick={() => loadStoryFromHistory(item)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              currentHistoryId === item.id 
                                ? "bg-blue-50 border-blue-200" 
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-blue-950 truncate flex-1">{item.title}</p>
                              <span className="text-xs text-slate-400 ml-2">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              {item.content.substring(0, 80)}...
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center py-20 px-4">
                <div className="text-center space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-sm">Create a fantasy story using "{groupName}" words</p>
                  <p className="text-slate-400 text-xs">{words.length} words available</p>
                </div>
              </div>
            )}
          </div>

          {/* Definition Bottom Sheet */}
          <AnimatePresence>
            {(definition || isLookingUp) && (
              <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl border-t border-slate-200 z-50">
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-4" />
                {isLookingUp ? (
                  <div className="flex flex-col items-center py-8 gap-3"><div className="w-8 h-8 border-2 border-blue-950 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-slate-400">Translating...</p></div>
                ) : definition && (
                  <div className="px-5 pb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-blue-950" /></div>
                      <div className="flex-1"><h4 className="text-lg font-bold text-blue-950 capitalize mb-1">{definition.word}</h4><p className="text-sm text-slate-500">{definition.meaning}</p></div>
                      <button onClick={() => setDefinition(null)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleAddToWords} className="flex-1 py-3 bg-blue-950 text-white rounded-lg text-sm flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add</button>
                      <button onClick={() => setDefinition(null)} className="py-3 px-5 bg-slate-100 text-slate-500 rounded-lg text-sm">Close</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default WordGroupView;