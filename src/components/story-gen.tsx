import { motion } from "framer-motion"
import { BrainCircuit, ChevronLeft, RotateCcw, Sparkles, FileText, BookOpen, PenTool, Type, Hash, Layers, ChevronDown, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { generateStory } from "../services/geminiService";
import { AppUser, GroupWord } from "../types";
import { Button } from "@/components/ui/button";

interface StoryGenProps {
  setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader") => void;
  userWords: GroupWord[];
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
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // UserWords to'g'ridan-to'g'ri guruhlar sifatida ishlatiladi
  const availableGroups = useMemo(() => {
    return userWords.filter(group => group.words && group.words.length > 0);
  }, [userWords]);

  const handleCreateStory = async () => {
    if (!storyOptions.topic || isProcessing) return;
    setIsProcessing(true);
    try {
      // Tanlangan guruhlardan barcha so'zlarni yig'ish
      const allSelectedWords = selectedGroupIds
        .flatMap(groupId => {
          const group = userWords.find(g => g._id === groupId);
          return group ? group.words.map(w => w.term) : [];
        })
        .join(", ");
      
      const result = await generateStory(storyOptions.category, storyOptions.topic, storyOptions.length, allSelectedWords);
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
      console.error("Story generation failed:", e);
      alert("Story generation failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      }
      return [...prev, groupId];
    });
  };

  const removeGroup = (groupId: string) => {
    setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
  };

  const getTotalSelectedWords = () => {
    return selectedGroupIds.reduce((total, groupId) => {
      const group = userWords.find(g => g._id === groupId);
      return total + (group?.words.length || 0);
    }, 0);
  };

  return (
    <motion.div 
      key="story-gen" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }}
      className="focus-mode md:max-w-4xl w-full mx-auto"
    >
      <div className="bluebook-card p-2 sm:p-8 space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-50 rounded-2xl mb-4">
            <PenTool className="w-8 h-8 text-blue-900" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-bluebook-navy mb-2">AI Story Creator</h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto">
            Create personalized stories with AI assistance. Choose your topic, set narrative depth, 
            and weave in specific vocabulary for targeted learning.
          </p>
        </div>

        <div className="flex items-center md:gap-4 mb-6">
          <button onClick={() => setView('stories')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800">Story Configuration</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Customize your narrative</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-700 uppercase">
                <FileText className="w-4 h-4" />
                Story Topic & Context
              </label>
              <textarea 
                value={storyOptions.topic} 
                onChange={e => setStoryOptions({...storyOptions, topic: e.target.value})} 
                placeholder="Describe your story topic" 
                className="bluebook-input bg-slate-50 border py-4 shadow-inner h-28 resize-none"
              />
              <div className="text-xs text-slate-500">
                Be specific about characters, setting, and desired tone for better results.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-700 uppercase">
                  <BookOpen className="w-4 h-4" />
                  Story Category
                </label>
                <select 
                  value={storyOptions.category} 
                  onChange={e => setStoryOptions({...storyOptions, category: e.target.value})}
                  className="bluebook-input bg-slate-50 border py-4 shadow-inner appearance-none cursor-pointer"
                >
                  <option>Business</option>
                  <option>Startup</option>
                  <option>Biography</option>
                  <option>Personal Growth</option>
                  <option>Motivation</option>
                  <option>Research</option>
                  <option>Fiction</option>
                  <option>Education</option>
                  <option>Technology</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-700 uppercase">
                  <Type className="w-4 h-4" />
                  Story Length
                </label>
                <select 
                  value={storyOptions.length} 
                  onChange={e => setStoryOptions({...storyOptions, length: e.target.value as any})}
                  className="bluebook-input bg-slate-50 border py-4 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="short">Short Flash (250-300 words)</option>
                  <option value="medium">Medium Story (500-600 words)</option>
                  <option value="long">Long Narrative (1000-1200 words)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              {/* Group Selector - UserWords guruhlarini to'g'ridan-to'g'ri ko'rsatish */}
              {availableGroups.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5" />
                    Select Word Groups
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        onChange={(e) => handleGroupSelect(e.target.value)}
                        value=""
                        className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                      >
                        <option value="" disabled>Choose a word group...</option>
                        {availableGroups.map((group) => (
                          <option key={group._id} value={group._id}>
                            {group.title} ({group.words.length} words)
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Selected groups display */}
                    {selectedGroupIds.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-slate-600">
                          Selected Groups ({getTotalSelectedWords()} total words):
                        </div>
                        <div className="space-y-2">
                          {selectedGroupIds.map(groupId => {
                            const group = userWords.find(g => g._id === groupId);
                            if (!group) return null;
                            
                            return (
                              <div key={groupId} className="bg-white rounded-lg border border-slate-200 p-2">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="text-sm font-semibold text-slate-800">{group.title}</span>
                                    <span className="text-xs text-slate-500 ml-2">({group.words.length} words)</span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="cursor-pointer h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeGroup(groupId)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.words.slice(0, 8).map((word, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-blue-100 text-blue-950 rounded text-[10px] font-medium"
                                    >
                                      {word.term}
                                    </span>
                                  ))}
                                  {group.words.length > 8 && (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">
                                      +{group.words.length - 8} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {availableGroups.length === 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
                  <p className="text-sm text-amber-800">
                    No word groups available. Please add some words to your vocabulary first.
                  </p>
                  <button
                    onClick={() => setView('words')}
                    className="mt-2 text-sm text-amber-900 underline font-medium"
                  >
                    Go to Words →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-2">
                {storyOptions.topic ? '✓ Topic defined' : '⚠ Topic required'} • 
                {storyOptions.category ? ' ✓ Category selected' : ' ⚠ Category required'} •
                {selectedGroupIds.length > 0 ? ` ✓ ${getTotalSelectedWords()} words selected` : ' ⚠ No word groups selected'}
              </div>
              <div className="text-xs text-slate-400">
                Estimated reading time: {storyOptions.length === 'short' ? '1-2 min' : storyOptions.length === 'medium' ? '3-4 min' : '6-8 min'}
              </div>
            </div>
            <button 
              onClick={handleCreateStory}
              disabled={isProcessing || !storyOptions.topic || selectedGroupIds.length === 0}
              className="w-full sm:w-auto px-8 py-4 bluebook-button flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all font-bold"
            >
              {isProcessing ? (
                <>
                  <RotateCcw className="animate-spin w-5 h-5" />
                  <span>Creating Story...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Story</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default StoryGen