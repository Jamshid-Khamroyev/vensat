import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, User, FileText } from "lucide-react";

interface NYTStoryReaderProps {
    currentStory: {
        title: string;
        abstract: string;
        url: string;
        byline: string;
        published_date: string;
        section: string;
        subsection: string;
        multimedia: { url: string; format: string }[];
    };
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group" | "nytimes-story") => void;
}

const NYTStoryReader = ({ currentStory, setView }: NYTStoryReaderProps) => {
    return (
        <motion.div 
            key="nyt-story-reader" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="focus-mode"
        >
            {/* Header */}
            <div className="mb-6">
                <button 
                    onClick={() => setView('stories')} 
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Orqaga</span>
                </button>
            </div>

            {/* Story Content */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Story Header */}
                <div className="bg-linear-to-r from-orange-50 to-amber-50 px-6 py-8 md:px-10 md:py-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold uppercase rounded-full tracking-wider">
                                {currentStory.section}
                            </span>
                            {currentStory.subsection && (
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                    {currentStory.subsection}
                                </span>
                            )}
                        </div>
                        
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">
                            {currentStory.title}
                        </h1>
                        
                        {/* Author */}
                        <div className="flex items-start gap-2 text-slate-600 mb-4">
                            <User className="w-4 h-4 mt-1 shrink-0" />
                            <p className="text-sm">{currentStory.byline}</p>
                        </div>
                        
                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                                {new Date(currentStory.published_date).toLocaleDateString('en-US', { 
                                    year: 'numeric',
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Story Image */}
                {currentStory.multimedia && currentStory.multimedia[0] && (
                    <div className="px-6 md:px-10 py-6">
                        <div className="relative aspect-video rounded-2xl overflow-hidden">
                            <img 
                                src={currentStory.multimedia[0].url} 
                                alt={currentStory.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* Story Body */}
                <div className="px-6 py-8 md:px-10 md:py-10">
                    <div className="max-w-4xl space-y-8">
                        {/* Abstract Section */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange-600" />
                                Abstract
                            </h2>
                            <p className="text-slate-600 leading-relaxed text-base">
                                {currentStory.abstract}
                            </p>
                        </section>

                        {/* Links Section */}
                        <section className="pt-6 border-t border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Links</h2>
                            <div className="flex flex-wrap gap-3">
                                <a 
                                    href={currentStory.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Read on NY Times
                                </a>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default NYTStoryReader;
