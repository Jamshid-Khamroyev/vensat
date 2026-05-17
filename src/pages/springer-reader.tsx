import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Volume2, Type, BookOpen, ExternalLink, Users, Calendar, FileText, PlusCircle } from "lucide-react";
import { translateText } from "../services/geminiService";
import { toast } from "sonner";

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

interface SpringerReaderProps {
    article: SpringerArticle;
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group" | "springer-reader") => void;
    onSaveWord: (words: { term: string; definition: string; sentence?: string }[], title?: string) => void;
}

const SpringerReader = ({ article, setView, onSaveWord }: SpringerReaderProps) => {
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [definition, setDefinition] = useState<{ word: string; meaning: string } | null>(null);
    const [translatedAbstract, setTranslatedAbstract] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showFullText, setShowFullText] = useState(false);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Stop speech when unmounting
    useEffect(() => {
        return () => {
            if (speechRef.current) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Handle text selection for word lookup
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim()) {
                const text = selection.toString().trim();
                if (text.split(' ').length === 1) {
                    setSelectedText(text);
                    lookupWord(text);
                }
            }
        };

        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, []);

    const lookupWord = async (word: string) => {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) throw new Error('Word not found');
            const data = await response.json();
            if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
                const meaning = data[0].meanings[0].definitions[0]?.definition || 'No definition found';
                setDefinition({ word, meaning });
            }
        } catch (e) {
            setDefinition({ word, meaning: 'Definition not found. Try another word.' });
        }
    };

    const handleSpeak = (text: string) => {
        if (!window.speechSynthesis) {
            toast.error('Audio not supported in your browser');
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const handleTranslateAbstract = async () => {
        if (translatedAbstract) {
            setTranslatedAbstract(null);
            return;
        }
        setIsTranslating(true);
        try {
            const translated = await translateText(article.abstract, 'English', 'Uzbek');
            setTranslatedAbstract(translated);
        } catch (e) {
            toast.error('Tarjima qilishda xatolik');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSaveWord = () => {
        if (definition) {
            onSaveWord([{
                term: definition.word,
                definition: definition.meaning,
            }], `From ${article.title}`);
            setDefinition(null);
            setSelectedText('');
        }
    };

    const getFontSizeClass = () => {
        switch (fontSize) {
            case 'small': return 'text-base';
            case 'medium': return 'text-lg';
            case 'large': return 'text-xl';
        }
    };

    const getFontFamilyClass = () => {
        switch (fontFamily) {
            case 'serif': return 'font-serif';
            case 'sans': return 'font-sans';
            case 'mono': return 'font-mono';
        }
    };

    return (
        <motion.div
            key="springer-reader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="focus-mode"
        >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => setView('stories')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Orqaga</span>
                </button>

                {/* Font Controls */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setFontSize('small')}
                            className={`p-2 rounded-md transition-all ${fontSize === 'small' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Small text"
                        >
                            <Type className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setFontSize('medium')}
                            className={`p-2 rounded-md transition-all ${fontSize === 'medium' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Medium text"
                        >
                            <Type className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setFontSize('large')}
                            className={`p-2 rounded-md transition-all ${fontSize === 'large' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Large text"
                        >
                            <Type className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setFontFamily('serif')}
                            className={`px-3 py-2 rounded-md text-sm font-serif transition-all ${fontFamily === 'serif' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            Serif
                        </button>
                        <button
                            onClick={() => setFontFamily('sans')}
                            className={`px-3 py-2 rounded-md text-sm font-sans transition-all ${fontFamily === 'sans' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            Sans
                        </button>
                    </div>
                </div>
            </div>

            {/* Article Content */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Article Header */}
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-8 md:px-10 md:py-10">
                    <div className="max-w-4xl">
                        {/* Journal Badge */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full tracking-wider">
                                {article.journal}
                            </span>
                            {article.keywords.slice(0, 3).map((kw, idx) => (
                                <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                    {kw}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight">
                            {article.title}
                        </h1>

                        {/* Authors */}
                        <div className="flex items-start gap-2 text-slate-600 mb-4">
                            <Users className="w-4 h-4 mt-1 shrink-0" />
                            <p className="text-sm">
                                {article.authors.map(a => a.name).join(', ')}
                            </p>
                        </div>

                        {/* Date & DOI */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>{article.publicationDate}</span>
                            </div>
                            {article.doi && (
                                <div className="text-slate-400">
                                    DOI: {article.doi}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Abstract Section */}
                <div className="px-6 py-8 md:px-10 md:py-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Abstract
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleSpeak(article.abstract)}
                                    className={`p-2 rounded-xl transition-all ${isSpeaking ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    title={isSpeaking ? "Stop" : "Listen"}
                                >
                                    <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                                </button>
                                <button
                                    onClick={handleTranslateAbstract}
                                    disabled={isTranslating}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all disabled:opacity-50"
                                >
                                    {isTranslating ? '...' : translatedAbstract ? 'Original' : "O'zbekcha"}
                                </button>
                            </div>
                        </div>

                        {/* Abstract Text */}
                        <div
                            ref={contentRef}
                            className={`${getFontSizeClass()} ${getFontFamilyClass()} leading-relaxed text-slate-700 mb-8`}
                        >
                            {translatedAbstract || article.abstract}
                        </div>

                        {/* Full Text Toggle */}
                        <div className="border-t border-slate-100 pt-6">
                            <button
                                onClick={() => setShowFullText(!showFullText)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                <BookOpen className="w-5 h-5" />
                                {showFullText ? 'Yopish' : "To'liq matnni ko'rish (Springer)"}
                            </button>

                            {showFullText && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4"
                                >
                                    <div className="bg-slate-50 rounded-2xl p-6">
                                        <p className="text-sm text-slate-600 mb-4">
                                            To'liq matn Springer Nature saytida mavjud. Quyidagi havola orqali o'qishingiz mumkin:
                                        </p>
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Springer Nature da o'qish
                                        </a>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Links Section */}
                        <section className="pt-6 border-t border-slate-100 mt-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Links</h2>
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Read on Springer
                                </a>
                                {article.doi && (
                                    <a
                                        href={`https://doi.org/${article.doi}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        DOI Link
                                    </a>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Word Definition Popup */}
            {definition && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 max-w-md w-[90%]"
                >
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-slate-800">{definition.word}</h3>
                        <button
                            onClick={() => setDefinition(null)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-slate-600 text-sm mb-3">{definition.meaning}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveWord}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Lug'atga qo'shish
                        </button>
                        <button
                            onClick={() => handleSpeak(definition.word)}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <Volume2 className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default SpringerReader;
