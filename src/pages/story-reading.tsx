import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, ChevronLeft, Lightbulb, Volume2, VolumeX, Plus, Type, Settings, Save } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface StoryReadingPorps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
    currentStory: { title: string; category: string; content: string };
    handleLookup: (word: string) => void;
    definition: { word: string; meaning: string } | null;
    setDefinition: (def: { word: string; meaning: string } | null) => void;
    handleAddWord: (words: { term: string; definition: string }[], title?: string) => void;
    handleAddToDefaultGroup: (words: { term: string; definition: string }[]) => void;
}

const StoryReading = ({ currentStory, definition, handleAddWord, handleAddToDefaultGroup, handleLookup, setDefinition, setView }: StoryReadingPorps) => {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans-serif' | 'mono'>('serif');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [words, setWords] = useState<{ term: string; definition: string }[]>([]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fontSizeClasses = {
    small: 'text-base',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  const fontFamilyClasses = {
    serif: 'font-serif',
    'sans-serif': 'font-sans',
    mono: 'font-mono'
  };

  const handleTextSelection = () => {
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 1 && selection.length < 25) {
      setSelectedText(selection);
      handleLookup(selection);
    }
  };

  const handleAddToWords = ({ term }: { term: string }) => {
    if (selectedText) {
      const data = JSON.stringify({
        q: term,
        source: 'en',
        target: 'uz'
      });

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

   xhr.addEventListener('readystatechange', function () {
    if (this.readyState === this.DONE) {
      try {
        const info = JSON.parse(this.responseText);
        
        const translatedArray = info.data.translations.translatedText;
        
        const finalResult = translatedArray[0]; 
        setWords(prev => [...prev, { term, definition: finalResult }]);
      } catch (error) {
        console.error("JSON parse qilishda xato:", error);
      }
    }
  });

    xhr.open('POST', 'https://deep-translate1.p.rapidapi.com/language/translate/v2');
    xhr.setRequestHeader('x-rapidapi-key', 'f3251f90e7msh179edc31ad1c822p139b02jsnaeb7fd4fb5cd');
    xhr.setRequestHeader('x-rapidapi-host', 'deep-translate1.p.rapidapi.com');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(data);
    setSelectedText('');
    setDefinition(null);
    }
  };

  const handleMobileWordAdd = () => {
    if(words.length > 0) {
      handleAddToDefaultGroup(words);
      setWords([]);
      setDefinition(null);
      setSelectedText('');
    }
  };

  const startTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentStory.content);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopTextToSpeech();
      }
    };
  }, [isPlaying]);
  return (
    <motion.div key="story-reader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="focus-mode min-h-[calc(100vh-64px)] bg-white">
               {/* Mobile Controls - Always Visible */}
              <div className="md:hidden border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between md:px-3 py-2 overflow-x-auto">
                  
                  {/* Font Size */}
                  <div className="flex items-center gap-1">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`
                          px-2 py-1 text-slate-500 transition-colors
                          ${
                            fontSize === size
                              ? 'text-bluebook-navy font-semibold'
                              : 'hover:text-slate-700'
                          }
                        `}
                      >
                        <span
                          className={
                            size === 'small'
                              ? 'text-xs'
                              : size === 'medium'
                              ? 'text-sm'
                              : 'text-base'
                          }
                        >
                          A
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

                  {/* Font Style */}
                  <div className="flex items-center gap-2">
                    {(['serif', 'sans-serif', 'mono'] as const).map((font) => (
                      <button
                        key={font}
                        onClick={() => setFontFamily(font)}
                        className={`
                          text-xs transition-colors whitespace-nowrap
                          ${
                            fontFamily === font
                              ? 'text-bluebook-navy font-semibold'
                              : 'text-slate-500 hover:text-slate-700'
                          }
                        `}
                      >
                        <span
                          className={
                            font === 'serif'
                              ? 'font-serif'
                              : font === 'sans-serif'
                              ? 'font-sans'
                              : 'font-mono'
                          }
                        >
                          {font === 'serif'
                            ? 'Serif'
                            : font === 'sans-serif'
                            ? 'Sans'
                            : 'Mono'}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

                  {/* Read Button */}
                  <button
                    onClick={isPlaying ? stopTextToSpeech : startTextToSpeech}
                    className="flex items-center gap-1.5 md:px-3 px-2 cursor-pointer py-1.5 bg-bluebook-navy text-white text-xs rounded-md"
                  >
                    {isPlaying ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}

                    <span className="max-md:hidden">{isPlaying ? 'Stop' : 'Listen'}</span>
                  </button>
                </div>
              </div>

              <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center w-full justify-between md:gap-4">
                   <button onClick={() => setView('stories')} className="p-2 hover:bg-slate-100 max-md:hidden rounded-full text-slate-400"><ChevronLeft className="w-5 h-5 max-md:hidden" /></button>
                   <div>
                     <h2 className="text-lg font-bold text-slate-800 leading-none">{currentStory.title}</h2>
                     <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1.5">{currentStory.category} • {Math.ceil(currentStory.content.split(' ').length / 200)} min read</p>
                   </div>
                  <button onClick={handleMobileWordAdd} 
                    className="p-1 cursor-pointer rounded-sm hover:bg-slate-200 border relative flex items-center justify-center text-sm">
                      <span className="md:block hidden">Save New Words</span> 
                      <Save />
                      {words.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-950 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{words.length}</span>
                      )}
                    </button>
                </div>
                
                {/* Desktop Controls */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center bg-slate-50 rounded-lg p-1">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                          fontSize === size ? 'bg-white text-bluebook-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center bg-slate-50 rounded-lg p-1">
                    {(['serif', 'sans-serif', 'mono'] as const).map((font) => (
                      <button
                        key={font}
                        onClick={() => setFontFamily(font)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                          fontFamily === font ? 'bg-white text-bluebook-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {font === 'serif' ? 'Serif' : font === 'sans-serif' ? 'Sans' : 'Mono'}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={isPlaying ? stopTextToSpeech : startTextToSpeech}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    title={isPlaying ? 'Stop reading' : 'Read aloud'}
                  >
                    {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Mobile Menu Toggle - Hidden since controls are always visible */}
                <div className="md:hidden" />
              </div>

              {/* Reader Content */}
              <div className="max-w-3xl mx-auto md:py-16 md:px-6 sm:px-12 relative group/reader">
                <article className="prose prose-slate lg:prose-lg mx-auto">
                   <div 
                     ref={contentRef}
                     className={`text-slate-700 leading-[2.2] ${fontSizeClasses[fontSize]} ${fontFamilyClasses[fontFamily]} space-y-4 sm:space-y-6 select-auto`}
                     onClick={handleTextSelection}
                     onTouchEnd={handleTextSelection}
                   >
                     {currentStory.content
                      .match(/[^.!?]+[.!?]+/g)
                      ?.reduce((acc: string[], sentence, index) => {
                        const groupIndex = Math.floor(index / 3);

                        if (!acc[groupIndex]) {
                          acc[groupIndex] = "";
                        }

                        acc[groupIndex] += sentence + " ";

                        return acc;
                      }, [])
                      .map((para, i) => (
                        <p
                          key={i}
                          className={`
                            text-justify
                            mb-4 sm:mb-6
                            ${
                              i === 0
                                ? "md:first-letter:text-5xl first-letter:text-4xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-blue-950 first-letter:leading-none"
                                : ""
                            }
                            ${
                              fontSize === "small"
                                ? "text-sm"
                                : fontSize === "medium"
                                ? "text-base"
                                : "text-lg"
                            }
                          `}
                        >
                          {para.trim()}
                        </p>
                      ))}
                   </div>
                </article>

                {/* Popover Definition - Desktop */}
                <AnimatePresence>
                  {definition && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="hidden md:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-white rounded-3xl shadow-2xl border border-blue-100 p-6 z-50 text-center space-y-4 ring-8 ring-blue-50/50"
                    >
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600"><BrainCircuit className="w-6 h-6" /></div>
                       <div>
                          <h4 className="text-xl font-black text-slate-800 capitalize leading-none mb-2">{definition.word}</h4>
                          <div className="w-8 h-1 bg-blue-200 mx-auto rounded-full" />
                       </div>
                       <p className="text-sm text-slate-500 leading-relaxed italic">{definition.meaning}</p>
                       <div className="flex gap-2">
                          <button onClick={() => handleAddToWords({ term: definition.word  })} 
                          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200">Add to Lexicon</button>
                          <button onClick={() => setDefinition(null)} className="py-3 px-5 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">Dismiss</button>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Mobile Definition Bottom Sheet */}
                <AnimatePresence>
                  {definition && (
                    <motion.div 
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-6 z-50 space-y-4"
                    >
                      <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
                          <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black text-slate-800 capitalize leading-none mb-2 truncate">{definition.word}</h4>
                          <p className="text-sm text-slate-500 leading-relaxed">{definition.meaning}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => handleAddToWords({ term: definition.word })}
                          className="flex-1 py-3 bg-bluebook-navy text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add to Lexicon
                        </button>
                        <button 
                          onClick={() => setDefinition(null)} 
                          className="py-3 px-6 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
  )
}

export default StoryReading