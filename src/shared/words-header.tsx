import { Camera, FileText } from "lucide-react"

interface WordsHeaderProps {
    setBatchMode: (batchMode: boolean) => void;
    setImageMode: (imageMode: boolean) => void;
}

const WordsHeader = ({ setBatchMode, setImageMode }: WordsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Lexicon Manager
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Store private vocabulary for AI-enhanced test generation.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setBatchMode(true)} 
                        className="px-5 py-2.5 rounded-sm bg-linear-to-r from-blue-950 to-blue-900 text-white font-medium flex items-center gap-2 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-100 "
                    >
                        <FileText className="w-4 h-4" /> Batch Paste
                    </button>
                    <button 
                        onClick={() => setImageMode(true)} 
                        className="px-5 py-2.5 rounded-sm bg-linear-to-r from-emerald-600 to-teal-600 text-white font-medium flex items-center gap-2 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-100 "
                    >
                        <Camera className="w-4 h-4" /> Rasmdan OCR
                    </button>
                </div>
            </div>
  )
}

export default WordsHeader