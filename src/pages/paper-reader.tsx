import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, FileText, Users, Calendar, Quote } from "lucide-react";

interface PaperReaderProps {
    currentPaper: {
        paperId: string;
        title: string;
        abstract: string;
        authors: { name: string }[];
        year: number;
        citationCount: number;
        url: string;
        openAccessPdf?: { url: string };
    };
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group" | "paper-reader") => void;
}

const PaperReader = ({ currentPaper, setView }: PaperReaderProps) => {
    return (
        <motion.div 
            key="paper-reader" 
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

            {/* Paper Content */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Paper Header */}
                <div className="bg-linear-to-r from-emerald-50 to-teal-50 px-6 py-8 md:px-10 md:py-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full tracking-wider">
                                Academic Paper
                            </span>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                {currentPaper.year}
                            </span>
                        </div>
                        
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">
                            {currentPaper.title}
                        </h1>
                        
                        {/* Authors */}
                        <div className="flex items-start gap-2 text-slate-600 mb-4">
                            <Users className="w-4 h-4 mt-1 shrink-0" />
                            <p className="text-sm">
                                {currentPaper.authors?.map(a => a.name).join(', ') || 'Unknown authors'}
                            </p>
                        </div>
                        
                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>{currentPaper.year}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Quote className="w-4 h-4" />
                                <span>{currentPaper.citationCount?.toLocaleString() || 0} citations</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Paper Body */}
                <div className="px-6 py-8 md:px-10 md:py-10">
                    <div className="max-w-4xl space-y-8">
                        {/* Abstract Section */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                Abstract
                            </h2>
                            <p className="text-slate-600 leading-relaxed text-base">
                                {currentPaper.abstract || 'No abstract available for this paper.'}
                            </p>
                        </section>

                        {/* Links Section */}
                        <section className="pt-6 border-t border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Links</h2>
                            <div className="flex flex-wrap gap-3">
                                <a 
                                    href={currentPaper.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View on Semantic Scholar
                                </a>
                                {currentPaper.openAccessPdf?.url && (
                                    <a 
                                        href={currentPaper.openAccessPdf.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Open Access PDF
                                    </a>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PaperReader;
