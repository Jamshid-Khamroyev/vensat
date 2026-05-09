import { motion } from "framer-motion"
import { BookOpen, ChevronRight, Clock, Plus, Trash2, Loader2, ExternalLink, User, TrendingUp, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface StoriesProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "nytimes-story") => void;
    dbStories: { _id: string; title: string; category: string; content: string }[];
    setCurrentStory: (story: any) => void;
    setDbStories: (books: any[]) => void;
    setCurrentNYTStory: (story: NYTStory | null) => void;
}

interface NYTStory {
    title: string;
    abstract: string;
    url: string;
    byline: string;
    published_date: string;
    section: string;
    subsection: string;
    multimedia: { url: string; format: string }[];
}

const NYT_SECTIONS = [
    'arts', 'automobiles', 'books/review', 'business', 'fashion', 'food', 
    'health', 'home', 'insider', 'magazine', 'movies', 'nyregion', 
    'obituaries', 'opinion', 'politics', 'realestate', 'science', 'sports', 
    'sundayreview', 'technology', 'theater', 't-magazine', 'travel', 
    'upshot', 'us', 'world'
] as const;

type NYTSection = typeof NYT_SECTIONS[number];

const Stories = ({ dbStories, setDbStories, setCurrentStory, setView, setCurrentNYTStory }: StoriesProps) => {
    const [activeTab, setActiveTab] = useState<'mening' | 'popular'>('mening');
    
    // NY Times states
    const [nytStories, setNytStories] = useState<NYTStory[]>([]);
    const [isLoadingNYT, setIsLoadingNYT] = useState(false);
    const [selectedSection, setSelectedSection] = useState<NYTSection>('automobiles');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (activeTab === 'popular') {
            fetchNYTStories(selectedSection);
        }
    }, [activeTab, selectedSection]);

    // Fetch NY Times stories by section
    const fetchNYTStories = async (section: NYTSection) => {
        setIsLoadingNYT(true);
        try {
            const response = await fetch(
                `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=Qyk6HlUqXmqy9SGFrflbY2u4tJnsIQhbxHAAZSkJbWPGbRsM`
            );
            if (!response.ok) throw new Error('Failed to fetch NYT stories');
            const data = await response.json();
            setNytStories(data.results || []);
        } catch (e) {
            console.error('Error fetching NYT stories:', e);
        } finally {
            setIsLoadingNYT(false);
        }
    };

    const handleNYTStoryClick = (story: NYTStory) => {
        setCurrentNYTStory(story);
        setView('nytimes-story');
    };

    const handleSectionChange = (section: NYTSection) => {
        setSelectedSection(section);
        setIsDropdownOpen(false);
    };

    const handleDeleteStory = async (id: string) => {
        if (!confirm("Delete this story?")) return;
        try {
            await fetch(`/api/stories/${id}`, { method: "DELETE" });
            setDbStories(dbStories.filter(s => s._id !== id));
        } catch (e) { alert("Delete failed."); }
    };

    return (
        <motion.div key="stories" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="focus-mode space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Narrative Archives</h2>
                    <p className="text-slate-500 text-sm">Read AI-generated stories and academic papers for your learning.</p>
                </div>
                {activeTab === 'mening' && (
                    <button onClick={() => setView('story-gen')} className="bluebook-button flex items-center gap-3 active:scale-95 shadow-lg">
                        <Plus className="w-4 h-4" /> Create Story
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('mening')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'mening'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <User className="w-4 h-4" />
                    Mening
                </button>
                <button
                    onClick={() => setActiveTab('popular')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'popular'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Popular
                </button>
            </div>

            {/* Mening Tab - User's Stories */}
            {activeTab === 'mening' && (
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
            )}

            {/* Popular Tab - NY Times Stories */}
            {activeTab === 'popular' && (
                <div className="space-y-6">
                    {/* Section Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors"
                        >
                            <span className="capitalize">{selectedSection.replace('/', ' / ')}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                                {NYT_SECTIONS.map((section) => (
                                    <button
                                        key={section}
                                        onClick={() => handleSectionChange(section)}
                                        className={`w-full px-4 py-2 text-left text-sm capitalize hover:bg-slate-50 transition-colors ${
                                            selectedSection === section ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
                                        }`}
                                    >
                                        {section.replace('/', ' / ')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {isLoadingNYT ? (
                        <div className="py-20 text-center">
                            <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
                            <p className="text-slate-500 font-medium">NY Times maqolalari yuklanmoqda...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {nytStories.map((story, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleNYTStoryClick(story)}
                                    className="group bg-white md:p-6 p-4 md:rounded-3xl rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
                                >
                                    {/* Story Image */}
                                    {story.multimedia && story.multimedia[0] && (
                                        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4">
                                            <img 
                                                src={story.multimedia[0].url} 
                                                alt={story.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                                        </div>
                                    )}
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="inline-flex px-3 py-1 bg-orange-50 text-[10px] font-black uppercase text-orange-600 rounded-full tracking-widest">
                                                {story.section}
                                            </div>
                                            {story.subsection && (
                                                <div className="text-xs text-slate-400">{story.subsection}</div>
                                            )}
                                        </div>
                                        
                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-2">
                                            {story.title}
                                        </h3>
                                        
                                        <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">
                                            {story.abstract}
                                        </p>
                                        
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <div className="text-xs text-slate-500">
                                                {story.byline}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs text-slate-400">
                                                    {new Date(story.published_date).toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    )
}

export default Stories;