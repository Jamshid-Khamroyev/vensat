import { useEffect, useState } from "react";
import { WordRecord, UserWords } from "../types";
import WordImageMode from "./word-image-mode";
import WordBatchMode from "./word-batch-mode";
import WordsCards from "./words-cards";
import SelectWord from "../shared/select-word";
import SearchWord from "../shared/search-word";
import WordsHeader from "../shared/words-header";
import { toast } from "sonner";
import api from "../services/api";
import { useUserStore } from "../states/user.state";

interface PasteWordProps {
    setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group") => void;
    setCurrentWordGroup: (group: { name: string; words: WordRecord[], _id: string } | null) => void;
}

const PasteWord = ({ setView, setCurrentWordGroup }: PasteWordProps) => {
    const { user } = useUserStore()
    const [userWords, setUserWords] = useState<UserWords[]>()
    const [batchMode, setBatchMode] = useState(false);
    const [selectedWord, setSelectedWord] = useState<WordRecord | null>(null);
    const [imageMode, setImageMode] = useState(false);

    const handleAddWord = async (words: { term: string, definition: string, sentence: string }[], title?: string) => {
        try {
            if (userWords.length > 50) {
                toast.error("You have too many words in your selected group. Please select a group with less than 50 words.");
                return;
            }
            const res = await api.post("/api/words", { userId: user?._id, words, title });
            setUserWords([res.data, ...userWords]);
            } catch (e) { toast.error(e.response.data.error || "Failed to add word group."); }
    };

    const handleDeleteGroup = async (id: string) => {
        try {
        await api.delete(`/api/words/${id}`);
        setUserWords(userWords.filter(w => w._id !== id));
        } catch (e) { toast.error("Delete failed."); }
    };

    const handleUpdateGroup = async (id: string, words: { term: string, definition: string }[], title?: string) => {
        try {
        const res = await api.patch(`/api/words/${id}`, { words, title });
        setUserWords(userWords.map(w => w._id === id ? res.data : w));
        } catch (e) { toast.error("Group update failed."); }
    };

    useEffect(() => {
        const getWords = async () => {
            try {
                const { data } = await api.get(`/api/words/${user._id}`);
                setUserWords(data);
            } catch (error) {
                console.error("Failed to fetch words:", error);
            }
        }
        getWords();
    },[])

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <WordsHeader setBatchMode={setBatchMode} setImageMode={setImageMode} />

            {/* Search & Filter Bar */}
            <SearchWord />

            {/* Words Display */}
            <WordsCards 
                setCurrentWordGroup={setCurrentWordGroup}
                setView={setView}
                userWords={userWords}
                handleUpdateGroup={handleUpdateGroup}
                handleDeleteGroup={handleDeleteGroup}
            />

            {/* Word Detail Modal */}
            {selectedWord && (
                <SelectWord selectedWord={selectedWord} setSelectedWord={setSelectedWord} />
            )}

            {/* Batch Import Modal (same as before but with improved styling) */}
            {batchMode && (
                <WordBatchMode setBatchMode={setBatchMode} handleAddWord={handleAddWord} handleUpdateGroup={handleUpdateGroup} userWords={userWords}/>
            )}

            {/* Image OCR Modal */}
            {imageMode && (
                <WordImageMode handleAddWord={handleAddWord} handleUpdateGroup={handleUpdateGroup} setImageMode={setImageMode} userWords={userWords}/>
            )}
        </div>
    );
};

export default PasteWord;