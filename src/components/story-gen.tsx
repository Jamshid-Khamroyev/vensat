import { motion } from "framer-motion"
import { ChevronLeft, RotateCcw, Sparkles, FileText, PenTool, Type, Layers, ChevronDown, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { GroupWord } from "../types";
import { Button } from "@/components/ui/button";
import api from "../services/api";
import { useUserStore } from "../states/user.state";
import { useNavigate } from "react-router-dom";
import { useWordState } from "../states/word.state";

interface StoryGenProps {
  userWords: GroupWord[];
}

const StoryGen = ({ userWords }: StoryGenProps) => {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [storyOptions, setStoryOptions] = useState({ topic: '', genre: 'Business', length: 'medium' as 'extended' | 'medium' | 'long', words: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate()
  const { user } = useUserStore()

  const availableGroups = useMemo(() => {
    return userWords.filter(group => group.words && group.words.length > 0);
  }, [userWords]);

 const handleCreateStory = async () => {
  if (!storyOptions.topic || !storyOptions.genre) {
    toast.error('Iltimos, mavzu va janrni tanlang');
    return;
  }

  if (isProcessing) return;
  
  setIsProcessing(true);
  const loadingToast = toast.loading('Hikoya yaratilmoqda...');
  
  try {
    const allSelectedWords = selectedGroupIds
      .flatMap(groupId => {
        const group = userWords.find(g => g._id === groupId);
        return group ? group.words.map(w => w.term) : [];
      })
      .join(", ");
    
    const { data: storyResult } = await api.post('/api/ai/story', {
      genre: storyOptions.genre,
      topic: storyOptions.topic,
      length: storyOptions.length,
      words: allSelectedWords,
    });

    const result = storyResult.data;
    if (!result?.title || !result?.content) {
      throw new Error('Hikoya yaratilmadi');
    }

    await api.post("/api/stories", {
      userId: user?._id,
      title: result.title,
      content: result.content,
      category: storyOptions.genre
    });
    
    toast.success('Hikoya muvaffaqiyatli yaratildi', { id: loadingToast });
    navigate('/stories');
  } catch (e: any) {
    console.error("Story generation failed:", e);
    toast.error(e.response?.data?.message || e.message || 'Hikoya yaratishda xatolik', { id: loadingToast });
  } finally {
    setIsProcessing(false);
  }
};

  const handleGroupSelect = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
      toast.info('Guruh olib tashlandi');
    } else {
      setSelectedGroupIds(prev => [...prev, groupId]);
      toast.success('Guruh qo\'shildi');
    }
  };

  const removeGroup = (groupId: string) => {
    setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
    toast.info('Guruh olib tashlandi');
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
            Create personalized stories with AI assistance. Choose your genre, set narrative depth, 
            and weave in specific vocabulary for targeted learning.
          </p>
        </div>

        <div className="flex items-center md:gap-4 mb-6">
          <button 
            onClick={() => navigate('/stories')} 
            disabled={isProcessing}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800">Story Configuration</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Customize your narrative</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-700 uppercase">
                <FileText className="w-4 h-4" />
                Story Topic
              </label>
              <textarea 
                value={storyOptions.topic} 
                onChange={e => setStoryOptions({...storyOptions, topic: e.target.value})} 
                placeholder="Describe your story topic (e.g., 'A scientist discovering time travel')" 
                className="bluebook-input bg-slate-50 border py-4 shadow-inner h-28 resize-none"
                disabled={isProcessing}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-700 uppercase">
                  <PenTool className="w-4 h-4" />
                  Story Genre
                </label>
                <select 
                  value={storyOptions.genre} 
                  onChange={e => setStoryOptions({...storyOptions, genre: e.target.value})}
                  className="bluebook-input bg-slate-50 border py-4 shadow-inner appearance-none cursor-pointer"
                  disabled={isProcessing}
                >
                  <option value="">Select genre...</option>
                  <option value="science fiction">Science Fiction</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="mystery">Mystery</option>
                  <option value="romance">Romance</option>
                  <option value="horror">Horror</option>
                  <option value="adventure">Adventure</option>
                  <option value="drama">Drama</option>
                  <option value="comedy">Comedy</option>
                  <option value="educational">Educational</option>
                  <option value="biography">Biography</option>
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
                  disabled={isProcessing}
                >
                  <option value="medium">Medium (~500 words)</option>
                  <option value="long">Long (~1000 words)</option>
                  <option value="extended">Extended (~2000 words)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              {availableGroups.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5" />
                    Select Word Groups ({getTotalSelectedWords()} words)
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        onChange={(e) => handleGroupSelect(e.target.value)}
                        value=""
                        disabled={isProcessing}
                        className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer disabled:opacity-50"
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

                    {selectedGroupIds.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-64 overflow-auto">
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
                                  disabled={isProcessing}
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
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <div className="flex-1">
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex gap-3 flex-wrap">
                  <span className={storyOptions.topic ? 'text-green-600' : 'text-red-500'}>
                    {storyOptions.topic ? '✓ Topic defined' : '⚠ Topic required'}
                  </span>
                  <span className={storyOptions.genre ? 'text-green-600' : 'text-red-500'}>
                    {storyOptions.genre ? '✓ Genre selected' : '⚠ Genre required'}
                  </span>
                </div>
                <div className="text-slate-400">
                  Estimated reading time: {storyOptions.length === 'medium' ? '2-3 min' : storyOptions.length === 'long' ? '4-5 min' : '8-10 min'}
                </div>
              </div>
            </div>
            <button 
              onClick={handleCreateStory}
              disabled={isProcessing || !storyOptions.topic || !storyOptions.genre}
              className="w-full sm:w-auto px-8 py-4 bluebook-button flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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