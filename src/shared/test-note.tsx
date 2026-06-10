import { X } from "lucide-react"

interface TestNoteProps {
    setShowNotes: (show: boolean) => void
    currentQuestionIndex: number
    tempNote: string
    setTempNote: (note: string) => void
    currentNote: string | null
    isTestDisabled: boolean
    setNotes: (notes: Record<number, string>) => void
}

const TestNote = ({ setShowNotes, currentQuestionIndex, tempNote, setTempNote, currentNote, isTestDisabled, setNotes }: TestNoteProps) => {

    const saveNote = () => {
        if (isTestDisabled) return;
        
        if (tempNote.trim()) {
            setNotes((prev: Record<number, string>) => ({
                ...prev,
                [currentQuestionIndex]: tempNote.trim()
            }));
            setTempNote("");
            setShowNotes(false);
        }
    };

    const deleteNote = () => {
        if (isTestDisabled) return;
        
        setNotes((prev: Record<number, string>) => {
            const newNotes = { ...prev };
            delete newNotes[currentQuestionIndex];
            return newNotes;
        });
        setTempNote("");
        setShowNotes(false);
    };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-lg w-full p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-900">Notes for Question {currentQuestionIndex + 1}</h3>
                <button onClick={() => setShowNotes(false)} className="p-1">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <textarea 
                value={tempNote || currentNote || ""}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="Write your notes here..."
                className="w-full h-32 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                disabled={isTestDisabled}
            />
            <div className="flex gap-2 mt-3">
                <button onClick={saveNote} disabled={isTestDisabled}
                    className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                    Save Note
                </button>
                {currentNote && (
                    <button onClick={deleteNote} disabled={isTestDisabled}
                        className="px-4 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                        Delete
                    </button>
                )}
            </div>
        </div>
    </div>
  )
}

export default TestNote