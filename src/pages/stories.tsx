import { motion } from "framer-motion"
import { BookOpen, ChevronRight, Clock, Plus, Trash2, Loader2, ExternalLink, User, TrendingUp, ChevronDown, GraduationCap, Globe, Calendar, Newspaper } from "lucide-react";
import { useState, useEffect } from "react";

interface StoriesProps {
    setView: (view: 'landing' | 'dashboard' | 'create' | "history" | "article" | 'testing' | 'results' | 'ai-gen' | 'profile' | 'words' | 'stories' | 'story-gen' | 'story-reader' | 'word-group' | 'nytimes-story' | 'springer-reader') => void;
    dbStories: { _id: string; title: string; category: string; content: string }[];
    setCurrentStory: (story: any) => void;
    setDbStories: (books: any[]) => void;
    setCurrentNYTStory: (story: NYTStory | null) => void;
    setCurrentSpringerArticle: (article: SpringerArticle | null) => void;
    setCurrentGNewsArticle: (article: GNewsArticle | null) => void;
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

interface SpringerArticle {
    title: string;
    abstract: string;
    url: string;
    authors: { name: string }[];
    publicationDate: string;
    journal: string;
    doi: string;
    keywords: string[];
}

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

const NYT_SECTIONS = [
    'arts', 'automobiles', 'books/review', 'business', 'fashion', 'food', 
    'health', 'home', 'insider', 'magazine', 'movies', 'nyregion', 
    'obituaries', 'opinion', 'politics', 'realestate', 'science', 'sports', 
    'sundayreview', 'technology', 'theater', 't-magazine', 'travel', 
    'upshot', 'us', 'world'
] as const;

type NYTSection = typeof NYT_SECTIONS[number];

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

const Stories = ({ dbStories, setDbStories, setCurrentStory, setView, setCurrentNYTStory, setCurrentSpringerArticle, setCurrentGNewsArticle }: StoriesProps) => {
    const [activeTab, setActiveTab] = useState<'mening' | 'popular' | 'news'>('mening');
    
    // NY Times states
    const [nytStories, setNytStories] = useState<NYTStory[]>([]);
    const [isLoadingNYT, setIsLoadingNYT] = useState(false);
    const [selectedSection, setSelectedSection] = useState<NYTSection>('automobiles');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // GNews states
    const [gnewsArticles, setGnewsArticles] = useState<GNewsArticle[]>([]);
    const [isLoadingGNews, setIsLoadingGNews] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('technology');
    const [selectedCategory, setSelectedCategory] = useState('Technology');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [selectedCountry, setSelectedCountry] = useState('us');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [maxResults, setMaxResults] = useState(10);

    useEffect(() => {
        if (activeTab === 'popular') {
            fetchNYTStories(selectedSection);
        } else if (activeTab === 'news') {
            fetchGNewsArticles();
        }
    }, [activeTab, selectedSection, searchKeyword, selectedCategory, selectedLanguage, selectedCountry, maxResults]);

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

    // Fetch GNews articles
    const fetchGNewsArticles = async () => {
        setIsLoadingGNews(true);
        try {
            let query = searchKeyword;
            
            // If category is selected and not 'General', add it to query
            if (selectedCategory !== 'General') {
                query = `${searchKeyword} ${selectedCategory}`;
            }
            
            const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${selectedLanguage}&country=${selectedCountry}&max=${maxResults}&apikey=b5feddda2dff0a69bfc3552dfc52b872`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch news');
            const data = await response.json();
            
            const articles = (data.articles || []).map((article: any) => ({
                title: article.title || 'Untitled',
                description: article.description || 'No description available',
                content: article.content || article.description || 'No content available',
                url: article.url,
                image: article.image || 'https://via.placeholder.com/400x200?text=No+Image',
                publishedAt: article.publishedAt,
                source: article.source,
                author: article.author || 'Unknown author'
            }));
            
            setGnewsArticles(articles);
        } catch (e) {
            console.error('Error fetching GNews articles:', e);
            setGnewsArticles([]);
        } finally {
            setIsLoadingGNews(false);
        }
    };

    const handleNYTStoryClick = (story: NYTStory) => {
        setCurrentNYTStory(story);
        setView('nytimes-story');
    };

    const handleGNewsArticleClick = (article: GNewsArticle) => {
        setCurrentGNewsArticle(article);
        setView('article');
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
                    <p className="text-slate-500 text-sm">Read AI-generated stories, news articles, and more for your learning.</p>
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
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'mening'
                            ? 'bg-white text-blue-950 shadow-sm'
                            : 'text-slate-500 hover:text-blue-950 hover:bg-white'
                    }`}
                >
                    <User className="w-4 h-4" />
                    Mening
                </button>
                <button
                    onClick={() => setActiveTab('popular')}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'popular'
                            ? 'bg-white text-blue-950 shadow-sm'
                            : 'text-slate-500 hover:text-blue-950 hover:bg-white'
                    }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Popular
                </button>
                <button
                    onClick={() => setActiveTab('news')}
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

            {/* Mening Tab - User's Stories */}
            {activeTab === 'mening' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* News Tab - GNews API */}
            {activeTab === 'news' && (
                <div className="space-y-6">
                    {/* Search and Filter Controls */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        {/* Search Input */}
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
                                onClick={() => fetchGNewsArticles()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>

                        {/* Filter Row */}
                        <div className="flex flex-wrap gap-3">
                            {/* Category Dropdown */}
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

                            {/* Language Dropdown */}
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

                            {/* Country Dropdown */}
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

                            {/* Max Results Slider */}
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
                    
                    {isLoadingGNews ? (
                        <div className="py-20 text-center">
                            <Loader2 className="w-12 h-12 text-green-500 mx-auto mb-4 animate-spin" />
                            <p className="text-slate-500 font-medium">News articles loading...</p>
                        </div>
                    ) : gnewsArticles.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <Globe className="text-slate-200 w-12 h-12 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No news articles found. Try different search terms!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {gnewsArticles.map((article, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleGNewsArticleClick(article)}
                                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col"
                                >
                                    {/* Article Image */}
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
                                        {/* Source Badge */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="inline-flex px-3 py-1 bg-green-50 text-[10px] font-black uppercase text-green-600 rounded-full tracking-widest">
                                                {article.source.name}
                                            </div>
                                            {article.author && article.author !== 'Unknown author' && (
                                                <div className="text-xs text-slate-400">by {article.author}</div>
                                            )}
                                        </div>
                                        
                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-green-600 transition-colors line-clamp-2 mb-3">
                                            {article.title}
                                        </h3>
                                        
                                        {/* Description */}
                                        <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-4">
                                            {article.description}
                                        </p>
                                        
                                        {/* Meta Info */}
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
                    )}
                </div>
            )}
        </motion.div>
    )
}

export default Stories;