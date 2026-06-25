import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, ChevronLeft, Volume2, VolumeX, Plus, Save, X, CheckCircle, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {  GroupWord, StoryRecord } from "../types";
import api from "../services/api";
import { useUserStore } from "../states/user.state";
import { generateSentencesForWords } from "../services/geminiService";
import { toast } from "sonner";

interface StoryReadingProps {
    userWords: GroupWord[]
    setUserWords: (userWords: GroupWord[]) => void
}

interface TranslationResult {
  term: string;
  definition: string;
  isAdded: boolean;
}

const StoryReading = ({ userWords, setUserWords }: StoryReadingProps) => {
  const navigate = useNavigate();
  const { user } = useUserStore()
  const { id } = useParams<{ id: string }>();
  
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans-serif' | 'mono'>('serif');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [words, setWords] = useState<{ term: string; definition: string }[]>([]);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentStory, setCurrentStory] = useState<StoryRecord | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingWords, setIsSavingWords] = useState(false); // Yangi state
  
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

  // Fetch story data when component mounts or id changes
  useEffect(() => {
    const fetchStory = async () => {
      if (!user || !user._id) {
        setError('User not authenticated');
        setIsLoadingStory(false);
        return;
      }

      if (!id) {
        setError('Story ID is missing');
        setIsLoadingStory(false);
        return;
      }

      try {
        setIsLoadingStory(true);
        setError(null);
        
        const response = await api.get(`/api/stories/${user._id}/${id}`);
        setCurrentStory(response.data[0]);
        
      } catch (err: any) {
        console.error('Failed to fetch story:', err);
        if (err.response?.status === 404) {
          setError('Story not found');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this story');
        } else {
          setError('Failed to load story. Please try again.');
        }
      } finally {
        setIsLoadingStory(false);
      }
    };

    fetchStory();
  }, [user, id]);

  const handleTextSelection = () => {
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 1 && selection.length < 25) {
      setSelectedText(selection);
      translateWord(selection);
    }
  };

  const translateWord = (term: string) => {
    if (!term) return;
    
    setIsLoading(true);
    setTranslationResult(null);
    
    const data = JSON.stringify({
      q: term,
      source: 'en',
      target: 'uz'
    });

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener('readystatechange', function () {
      if (this.readyState === this.DONE) {
        setIsLoading(false);
        try {
          const info = JSON.parse(this.responseText);
          const translatedArray = info.data.translations.translatedText;
          const finalResult = translatedArray[0];
          
          setTranslationResult({
            term: term,
            definition: finalResult,
            isAdded: false
          });
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
  };

  const handleAddTranslationToWords = () => {
    if (translationResult && !translationResult.isAdded) {
      setWords(prev => [...prev, { 
        term: translationResult.term, 
        definition: translationResult.definition 
      }]);
      
      setTranslationResult({
        ...translationResult,
        isAdded: true
      });

      // Toast ko'rsatish
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const handleDismissTranslation = () => {
    setTranslationResult(null);
    setSelectedText('');
  };

  const handleMobileWordAdd = async () => {
    if(words.length === 0) return;
    
    setIsSavingWords(true);
    try {
      await handleAddToDefaultGroup(words);
      setWords([]);
      setSelectedText('');
      setTranslationResult(null);
      
      // Muvaffaqiyatli saqlanganda toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('Failed to save words:', error);
      alert('Failed to save words. Please try again.');
    } finally {
      setIsSavingWords(false);
    }
  };

  const startTextToSpeech = () => {
    if (!currentStory) return;
    
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

  const handleAddToDefaultGroup = async (words: { term: string, definition: string , sentence?: string}[]) => {
    try {
      const data = await generateSentencesForWords(words.map(w => w.term));
      const sentenceMap = new Map(
          data.map(item => [item.term, item.sentence])
        );

        words.forEach(word => {
          word.sentence = sentenceMap.get(word.term) || "";
        });
      
      const res = await api.post(`/api/words/${user?._id}/default`, { words });
      
      const existingIndex = userWords.findIndex(w => w.isDefault);
      if (existingIndex >= 0) {
        setUserWords(userWords.map(w => w.isDefault ? res.data : w));
      } else {
        setUserWords([res.data, ...userWords]);
      }
    } catch (e) { toast.error("Failed to save to default group.", e); }
  };

  const handleBack = () => {
    navigate('/stories');
  };

  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopTextToSpeech();
      }
    };
  }, [isPlaying]);

  // Loading state
  if (isLoadingStory) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading story...</p>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error || !currentStory) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center"
      >
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Failed to Load Story</h3>
          <p className="text-slate-600 text-sm mb-6">{error || 'Story not found'}</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-blue-950 text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }
  
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
          <div className="flex gap-2 items-center">
            <button onClick={handleBack} className="p-2 hover:bg-slate-100 max-md:hidden rounded-full text-slate-400">
              <ChevronLeft className="w-5 h-5 max-md:hidden" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-none">{currentStory.title}</h2>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1.5">
                {currentStory.category} • {Math.ceil(currentStory.content?.split(' ').length / 200)} min read
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleMobileWordAdd} 
            disabled={isSavingWords || words.length === 0}
            className="p-1 mx-2 cursor-pointer hover:bg-slate-200 border relative flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingWords ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="md:block hidden ml-1">Saving...</span>
              </>
            ) : (
              <div className="flex items-center gap-x-1">
                <span className="md:block hidden">Save New Words</span> 
                <Save className="block w-4 h-4" />
              </div>
            )}
            {words.length > 0 && !isSavingWords && (
              <span className="absolute -top-1 -right-1 bg-blue-950 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {words.length}
              </span>
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
      <div className="max-w-7xl mx-auto md:py-16 md:px-6 sm:px-12 relative group/reader">
        <article className="prose prose-slate lg:prose-lg mx-auto">
          <div 
            ref={contentRef}
            className={`text-slate-700 leading-[2.2] ${fontSizeClasses[fontSize]} ${fontFamilyClasses[fontFamily]} space-y-4 sm:space-y-6 select-auto`}
            onClick={handleTextSelection}
            onTouchEnd={handleTextSelection}
          >
            {currentStory.content
              ?.match(/[^.!?]+[.!?]+/g)
              ?.reduce((acc: string[], sentence, index) => {
                const groupIndex = Math.floor(index / 7);

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

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-slate-200 px-4 py-3 z-50 flex items-center gap-3"
          >
            <div className="w-4 h-4 border-2 border-blue-950 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600">Translating...</span>
          </motion.div>
        )}

        <AnimatePresence>
          {translationResult && !translationResult.isAdded && (
            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="hidden md:block fixed bottom-6 right-6 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-950 rounded-lg flex items-center justify-center">
                    <BrainCircuit className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Translation</h4>
                    <p className="text-[9px] text-slate-400">Deep Translate</p>
                  </div>
                </div>
                <button 
                  onClick={handleDismissTranslation}
                  className="w-6 h-6 rounded-full text-slate-400 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Translation Card */}
              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">English</p>
                    <p className="text-sm font-semibold text-slate-800">{translationResult.term}</p>
                  </div>
                  <div className="text-slate-300">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Uzbek</p>
                    <p className="text-sm font-bold text-blue-950">{translationResult.definition}</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={handleAddTranslationToWords}
                  className="flex-1 py-2 bg-blue-950 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Lexicon
                </button>
                <button 
                  onClick={handleDismissTranslation}
                  className="py-2 px-4 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {translationResult && !translationResult.isAdded && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 z-50"
            >
              {/* Drag Indicator */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-slate-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-950 rounded-xl flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Translation</h4>
                    <p className="text-[10px] text-slate-400">Deep Translate</p>
                  </div>
                </div>
                <button 
                  onClick={handleDismissTranslation}
                  className="w-7 h-7 rounded-full text-slate-400 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Translation Card */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">English</p>
                    <p className="text-sm font-semibold text-slate-800">{translationResult.term}</p>
                  </div>
                  <div className="text-slate-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uzbek</p>
                    <p className="text-sm font-bold text-blue-950">{translationResult.definition}</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={handleAddTranslationToWords}
                  className="flex-1 py-2.5 bg-blue-950 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Lexicon
                </button>
                <button 
                  onClick={handleDismissTranslation}
                  className="py-2.5 px-5 bg-slate-100 text-slate-500 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showToast && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-20 right-6 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 shadow-lg z-50 flex items-center gap-2"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Word added!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Words Counter */}
        {words.length > 0 && !isSavingWords && (
          <div className="fixed bottom-24 right-6 bg-white rounded-full shadow-lg px-4 py-2 border border-slate-200 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">{words.length} word{words.length > 1 ? 's' : ''}</span>
            <span className="text-xs text-slate-400">in lexicon</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default StoryReading;