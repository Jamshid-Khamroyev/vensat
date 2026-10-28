import { motion } from "framer-motion"
import { BookOpen, ChevronRight, Clock, Plus, Trash2, Loader2, ExternalLink, User, TrendingUp, ChevronDown, GraduationCap, Globe, Calendar, Newspaper } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
    Edit2, 
    Sparkles,
    FileText
} from 'lucide-react';
import api from "../services/api";
import { useUserStore } from "../states/user.state";


interface GNewsArticle {
    title: string;
    description: string;
    content: string;
    url: string;
    image: string;
    publishedAt: string;
    source: { name: string; url: string };
    author: string;
}

interface DBStory {
    _id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
}

const NEWS_CATEGORIES = [
    'General', 'World', 'Nation', 'Business', 'Technology', 'Entertainment', 
    'Sports', 'Science', 'Health', 'Top News'
];

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'uz', name: 'Oʻzbek' },
    { code: 'ru', name: 'Русский' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' },
];

const COUNTRIES = [
    { code: 'us', name: 'United States' },
    { code: 'uz', name: 'Uzbekistan' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'ru', name: 'Russia' },
    { code: 'de', name: 'Germany' },
    { code: 'fr', name: 'France' },
    { code: 'jp', name: 'Japan' },
    { code: 'cn', name: 'China' },
    { code: 'in', name: 'India' },
    { code: 'au', name: 'Australia' },
];

// ==================== MY STORIES TAB ====================
const MyStoriesTab = ({ userId }: { userId: string }) => {
    const navigate = useNavigate();
    const [stories, setStories] = useState<DBStory[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStories = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/stories/${userId}`);
            setStories(response.data);
        } catch (e) {
            console.error('Error fetching stories:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this story?")) return;
        try {
            await api.delete(`/api/stories/${id}`);
            setStories(stories.filter(s => s._id !== id));
        } catch (e) { 
            alert("Delete failed."); 
        }
    };

    useEffect(() => {
        fetchStories();
    }, [userId]);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-slate-500 font-medium">Loading your stories...</p>
            </div>
        );
    }

    if (stories.length === 0) {
        return (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <BookOpen className="text-slate-200 w-12 h-12 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No stories found. Create one to begin reading!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story, index) => (
                

// ... component ichida

<motion.div
    key={story._id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className="group bg-white rounded-2xl border border-slate-200 shadow-sm md:hover:shadow-xl md:hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
    onClick={() => navigate(`/story-reader/${story._id}`)}
>
    {/* Thumbnail Area */}
    <div className="relative aspect-video bg-linear-to-br from-cyan-50 to-blue-100 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-cyan-600/20 md:group-hover:scale-110 md:group-hover:text-cyan-600/30 transition-all duration-500" />
        </div>
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg opacity-0 md:group-hover:opacity-100 scale-75 md:group-hover:scale-100 transition-all duration-300">
                <ChevronRight className="w-6 h-6 text-cyan-600" />
            </div>
        </div>

        {/* Badges */}
        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {Math.ceil(story.content.split(' ').length / 200)} min
        </div>
        <div className="absolute top-2 left-2 bg-cyan-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            {story.category}
        </div>
    </div>

    {/* Info Area */}
    <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-bold text-slate-800 text-base transition-colors line-clamp-1 group-hover:text-cyan-600">
                {story.title}
            </h3>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(story._id); }}
                    className="p-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="hidden sm:inline text-xs font-semibold">
                        Remove
                    </span>
                </button>
            </div>
        </div>

        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            Story • {story.content.split(' ').length} words
        </p>

        <div className="flex flex-wrap gap-1 mt-3">
            <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-md text-[10px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" /> {Math.ceil(story.content.split(' ').length / 200)} min
            </span>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {story.category}
            </span>
        </div>
    </div>
</motion.div>
            ))}
        </div>
    );
};

// ==================== NEWS TAB (GNews) ====================
const NewsTab = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<GNewsArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('technology');
    const [selectedCategory, setSelectedCategory] = useState('Technology');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [selectedCountry, setSelectedCountry] = useState('us');
    const [maxResults, setMaxResults] = useState(10);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

    const fetchGNewsArticles = async () => {
        setLoading(true);
        try {
            let query = searchKeyword;
            if (selectedCategory !== 'General') {
                query = `${searchKeyword} ${selectedCategory}`;
            }
            
            const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${selectedLanguage}&country=${selectedCountry}&max=${maxResults}&apikey=b5feddda2dff0a69bfc3552dfc52b872`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch news');
            const data = await response.json();
            
            const mappedArticles = (data.articles || []).map((article: any) => ({
                title: article.title || 'Untitled',
                description: article.description || 'No description available',
                content: article.content || article.description || 'No content available',
                url: article.url,
                image: article.image || 'https://via.placeholder.com/400x200?text=No+Image',
                publishedAt: article.publishedAt,
                source: article.source,
                author: article.author || 'Unknown author'
            }));
            
            setArticles(mappedArticles);
        } catch (e) {
            console.error('Error fetching GNews articles:', e);
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleArticleClick = (article: GNewsArticle) => {
        navigate('/article', { state: { article } });
    };

    useEffect(() => {
        fetchGNewsArticles();
    }, []);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="w-12 h-12 text-green-500 mx-auto mb-4 animate-spin" />
                <p className="text-slate-500 font-medium">News articles loading...</p>
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Globe className="text-slate-200 w-12 h-12 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No news articles found. Try different search terms!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Search news (e.g., technology, science, business)..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && fetchGNewsArticles()}
                    />
                    <button
                        onClick={fetchGNewsArticles}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Search
                    </button>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            <Newspaper className="w-4 h-4" />
                            <span>{selectedCategory}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isCategoryDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                {NEWS_CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setIsCategoryDropdownOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                                            selectedCategory === category ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                            <span>{LANGUAGES.find(l => l.code === selectedLanguage)?.name}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isLanguageDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setSelectedLanguage(lang.code);
                                            setIsLanguageDropdownOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                                            selectedLanguage === lang.code ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
                                        }`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            <span>{COUNTRIES.find(c => c.code === selectedCountry)?.name}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isCountryDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                {COUNTRIES.map((country) => (
                                    <button
                                        key={country.code}
                                        onClick={() => {
                                            setSelectedCountry(country.code);
                                            setIsCountryDropdownOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                                            selectedCountry === country.code ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
                                        }`}
                                    >
                                        {country.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <span className="text-sm text-slate-600">Results:</span>
                        <input
                            type="range"
                            min="5"
                            max="20"
                            value={maxResults}
                            onChange={(e) => setMaxResults(parseInt(e.target.value))}
                            className="w-32"
                        />
                        <span className="text-sm font-medium text-blue-600">{maxResults}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {articles.map((article, idx) => (
                    <div
                        key={idx}
                        onClick={() => handleArticleClick(article)}
                        className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col"
                    >
                        {article.image && article.image !== 'https://via.placeholder.com/400x200?text=No+Image' && (
                            <div className="relative aspect-video overflow-hidden">
                                <img 
                                    src={article.image} 
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Image+Not+Available';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                        
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="inline-flex px-3 py-1 bg-green-50 text-[10px] font-black uppercase text-green-600 rounded-full tracking-widest">
                                    {article.source.name}
                                </div>
                                {article.author && article.author !== 'Unknown author' && (
                                    <div className="text-xs text-slate-400">by {article.author}</div>
                                )}
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-green-600 transition-colors line-clamp-2 mb-3">
                                {article.title}
                            </h3>
                            
                            <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-4">
                                {article.description}
                            </p>
                            
                            <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-blue-600">Read full article</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================
const Stories = () => {
    const { user } = useUserStore()
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTabParam = searchParams.get('tab') as 'mening' | 'popular' | 'news' || 'mening';
    const [activeTab, setActiveTab] = useState<'mening' | 'popular' | 'news'>(activeTabParam);
    const navigate = useNavigate();

    const handleTabChange = (tab: 'mening' | 'popular' | 'news') => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    return (
        <motion.div 
            key="stories" 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0 }}
            className="focus-mode space-y-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Narrative Archives</h2>
                    <p className="text-slate-500 text-sm">Read AI-generated stories, news articles, and more for your learning.</p>
                </div>
                {activeTab === 'mening' && (
                    <button 
                        onClick={() => navigate('/story-generator')} 
                        className="bluebook-button flex items-center gap-3 active:scale-95 shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> Create Story
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => handleTabChange('mening')}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'mening'
                            ? 'bg-white text-blue-950 shadow-sm'
                            : 'text-slate-500 hover:text-blue-950 hover:bg-white'
                    }`}
                >
                    <User className="w-4 h-4" />
                    My stories
                </button>
                <button
                    onClick={() => handleTabChange('news')}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'news'
                            ? 'bg-white text-blue-950 shadow-sm'
                            : 'text-slate-500 hover:text-blue-950 hover:bg-white'
                    }`}
                >
                    <Globe className="w-4 h-4" />
                    News
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'mening' && <MyStoriesTab userId={user._id} />}
            {activeTab === 'news' && <NewsTab />}
        </motion.div>
    );
};

export default Stories;