// gnews-reader.tsx
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, User, Newspaper, Share2, MapPin, Globe, Clock, BookOpen } from "lucide-react";

interface GNewsReaderProps {
    article: {
        id?: string;
        title: string;
        content: string;
        description: string;
        url: string;
        image: string;
        publishedAt: string;
        source: { 
            id?: string;
            name: string; 
            url: string;
            country?: string;
        };
        author?: string;
        lang?: string;
    };
    setView: (view: "stories" | "story-reader" | "springer-reader" | "nytimes-story" | "word-group" | "words" | "profile" | "ai-gen" | "results" | "testing" | "article" | "create" | "dashboard" | "landing") => void;
}

const GNewsReader = ({ article, setView }: GNewsReaderProps) => {
    // Calculate read time (average 200 words per minute)
    const readTime = Math.max(1, Math.ceil((article.content?.length || 0) / 1000));
    
    // Format language code to language name
    const getLanguageName = (langCode?: string) => {
        const languages: { [key: string]: string } = {
            'en': 'English',
            'uz': 'Oʻzbek',
            'ru': 'Russian',
            'fr': 'French',
            'de': 'German',
            'es': 'Spanish',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'ja': 'Japanese',
            'ko': 'Korean',
            'it': 'Italian',
            'pt': 'Portuguese',
            'nl': 'Dutch',
            'pl': 'Polish',
            'tr': 'Turkish',
            'vi': 'Vietnamese',
            'th': 'Thai',
            'hi': 'Hindi'
        };
        return languages[langCode || 'en'] || langCode?.toUpperCase() || 'English';
    };

    // Format country code to country name
    const getCountryName = (countryCode?: string) => {
        const countries: { [key: string]: string } = {
            'us': 'United States',
            'gb': 'United Kingdom',
            'ca': 'Canada',
            'au': 'Australia',
            'nz': 'New Zealand',
            'ie': 'Ireland',
            'za': 'South Africa',
            'in': 'India',
            'pk': 'Pakistan',
            'bd': 'Bangladesh',
            'lk': 'Sri Lanka',
            'my': 'Malaysia',
            'sg': 'Singapore',
            'ph': 'Philippines',
            'ng': 'Nigeria',
            'gh': 'Ghana',
            'ke': 'Kenya',
            'tz': 'Tanzania',
            'ug': 'Uganda',
            'uz': 'Uzbekistan',
            'ru': 'Russia',
            'de': 'Germany',
            'fr': 'France',
            'it': 'Italy',
            'es': 'Spain',
            'pt': 'Portugal',
            'nl': 'Netherlands',
            'be': 'Belgium',
            'ch': 'Switzerland',
            'at': 'Austria',
            'se': 'Sweden',
            'no': 'Norway',
            'dk': 'Denmark',
            'fi': 'Finland',
            'pl': 'Poland',
            'cz': 'Czech Republic',
            'hu': 'Hungary',
            'ro': 'Romania',
            'gr': 'Greece',
            'tr': 'Turkey',
            'il': 'Israel',
            'ae': 'UAE',
            'sa': 'Saudi Arabia',
            'eg': 'Egypt',
            'ma': 'Morocco',
            'jp': 'Japan',
            'cn': 'China',
            'kr': 'South Korea',
            'tw': 'Taiwan',
            'hk': 'Hong Kong',
            'th': 'Thailand',
            'vn': 'Vietnam',
            'id': 'Indonesia',
            'mx': 'Mexico',
            'br': 'Brazil',
            'ar': 'Argentina',
            'cl': 'Chile',
            'co': 'Colombia',
            'pe': 'Peru'
        };
        return countries[countryCode || ''] || countryCode?.toUpperCase() || 'International';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto px-4 py-8"
        >
            <button
                onClick={() => setView('stories')}
                className="group flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-all duration-200 font-medium"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                Back to Stories
            </button>

            <article className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                {article.image && article.image !== 'https://via.placeholder.com/400x200?text=No+Image' && (
                    <div className="relative aspect-video bg-slate-100">
                        <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 to-transparent" />
                    </div>
                )}

                <div className="p-8">
                    {/* Source and Meta Badges */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                            <Newspaper className="w-3 h-3" />
                            {article.source.name}
                        </span>
                        
                        {article.source.country && (
                            <span className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-full flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                {getCountryName(article.source.country)}
                            </span>
                        )}
                        
                        {article.lang && (
                            <span className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-full flex items-center gap-1.5">
                                <Globe className="w-3 h-3" />
                                {getLanguageName(article.lang)}
                            </span>
                        )}
                        
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" />
                            {readTime} min read
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-blue-950 mb-4 leading-tight">
                        {article.title}
                    </h1>

                    {/* Author and Date */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
                        {article.author && article.author !== 'Unknown author' && (
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-400" />
                                <span className="font-medium">By {article.author}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <time dateTime={article.publishedAt}>
                                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </time>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span>Published {Math.floor((Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60))} hours ago</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <div className="bg-blue-50/30 rounded-2xl p-6 border-l-4 border-blue-500">
                            <p className="text-lg text-slate-700 leading-relaxed font-medium italic">
                                "{article.description}"
                            </p>
                        </div>
                    </div>

                    {/* Full Content */}
                    <div className="prose prose-lg max-w-none">
                        <div className="text-slate-700 leading-relaxed space-y-4">
                            {article.content ? (
                                article.content.split('\n').map((paragraph, idx) => {
                                    if (paragraph.trim().length > 0 && !paragraph.includes('... [')) {
                                        return (
                                            <p key={idx} className="text-slate-600 leading-relaxed">
                                                {paragraph}
                                            </p>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <p className="text-slate-500 italic">
                                    Full content preview not available. Click the button below to read the complete article on the original source.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Article ID (if available) */}
                    {article.id && (
                        <div className="mt-6 text-xs text-slate-400 border-t border-slate-100 pt-4">
                            <span className="font-mono">Article ID: {article.id}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-950 text-white rounded-xl hover:bg-blue-800 transition-all duration-200 shadow-md hover:shadow-lg group"
                        >
                            <span>Read Full Article on {article.source.name}</span>
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.open(article.url, '_blank')}
                                className="p-3 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200"
                                title="Share article"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(article.url);
                                    alert('Link copied to clipboard!');
                                }}
                                className="p-3 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200"
                                title="Copy link"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Source Info Footer */}
                    <div className="mt-6 text-xs text-slate-400 text-center">
                        <p>Source: {article.source.name} • {article.source.url}</p>
                        <p className="mt-1">Original publication date: {new Date(article.publishedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </article>
        </motion.div>
    );
};

export default GNewsReader;