import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, MinusCircle, Eye, EyeOff } from 'lucide-react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

interface Question {
  _id: string;
  text: string;
  options: string[];
  question: string;
  difficulty: string;
  correctAnswerIndex: number;
  explanation?: Record<string, string>;
}

interface Result {
  questionId: string;
  isCorrect: boolean;
  correctAnswerIndex: number;
  userSelectedIndex: number | null;
  question: Question;
  explanationSteps?: { title: string; text: string; _id: string }[];
}

interface HistoryDetail {
  _id: string;
  title: string;
  category: string;
  score: number;
  total: number;
  completedAt: string;
  results: Result[];
  stats: { correctCount: number; incorrectCount: number; percentage: number };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const HistoryDetail = ({ onBack }: { onBack?: () => void }) => {
  const { id: historyId } = useParams();
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [displayed, setDisplayed] = useState<string[]>([]);
  const abortRef = useRef(false);

  useEffect(() => {
    fetchDetail();
  }, [historyId]);

  useEffect(() => {
    if (!detail) return;
    const q = detail.results[index]?.question;
    if (!q) return;
    setExpanded(null);
    setDisplayed(Array(q.options.length).fill(''));
    abortRef.current = false;
  }, [index, detail]);

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/history/detail/${historyId}`);
      setDetail(res.data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleExplain = async (optIdx: number) => {
    const res = detail?.results[index];
    if (!res) return;
    const q = res.question;
    if (!q) return;
    if (expanded === optIdx) {
      abortRef.current = true;
      setExpanded(null);
      setDisplayed((prev) => {
        const copy = [...prev];
        copy[optIdx] = '';
        return copy;
      });
      abortRef.current = false;
      return;
    }
    abortRef.current = true;
    await sleep(50);
    abortRef.current = false;
    setExpanded(optIdx);
    const text = q.explanation?.[String(optIdx)] ?? '';
    const speed = Math.max(6, Math.floor(40 / Math.max(1, text.length / 50)));
    for (let i = 0; i <= text.length; i++) {
      if (abortRef.current) break;
      const chunk = text.slice(0, i);
      setDisplayed((prev) => {
        const copy = [...prev];
        copy[optIdx] = chunk;
        return copy;
      });
      await sleep(speed);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">History not found</p>
          {onBack && (
            <button onClick={onBack} className="mt-4 px-3 py-1 rounded text-white bg-gradient-to-r from-blue-800 to-blue-900">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const current = detail.results[index];
  const q = current.question;
  const omittedCount = detail.results.filter((r) => r.userSelectedIndex === null || r.userSelectedIndex === undefined).length;

  const getLetter = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1.5 rounded">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
            )}
            <div>
              <div className="text-sm font-semibold text-gray-900">{detail.title}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{detail.category}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{new Date(detail.completedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{detail.score}/{detail.total}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">{Math.round(detail.stats.percentage)}%</div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4 bg-white border rounded p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700">Questions</div>
            <div className="text-xs text-gray-500">Tap number to jump</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {detail.results.map((r, i) => {
              const status = r.userSelectedIndex === null || r.userSelectedIndex === undefined ? 'omitted' : r.isCorrect ? 'correct' : 'incorrect';
              return (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-10 h-10 rounded-md flex items-center justify-center font-medium ${index === i ? 'bg-blue-900 text-white' : status === 'correct' ? 'bg-green-600 text-white' : status === 'incorrect' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white border rounded shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-gray-700">Q{index + 1}</div>
              {q?.difficulty && (
                <div className={`text-xs px-2 py-0.5 rounded capitalize ${q.difficulty === 'easy' ? 'bg-green-100 text-green-800' : q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {q.difficulty}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${current.userSelectedIndex === null ? 'bg-gray-100 text-gray-700' : current.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {current.userSelectedIndex === null ? <MinusCircle className="w-4 h-4" /> : current.isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span className="text-xs">{current.userSelectedIndex === null ? 'Omitted' : current.isCorrect ? 'Correct' : 'Incorrect'}</span>
              </div>
              <div className="text-sm font-medium text-gray-600">{index + 1}/{detail.total}</div>
            </div>
          </div>

         <div className="p-4">
            <p className="text-slate-700 md:leading-7 mb-3">{q?.text}</p>
            <p className="text-slate-900 font-semibold text-lg mb-4">{q?.question}</p>

            <div className="space-y-3">
              {q?.options?.map((opt, i) => {
                const isCorrect = i === current.correctAnswerIndex;
                const isUser = i === current.userSelectedIndex;
                const isExpanded = expanded === i;
                const text = displayed[i] ?? (q.explanation?.[String(i)] ?? '');

                const bg = isCorrect
                  ? 'bg-emerald-50 border-emerald-200'
                  : isUser && !isCorrect
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-slate-200';

                const letterStyle = isCorrect
                  ? 'bg-emerald-100 text-emerald-700'
                  : isUser && !isCorrect
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-700';

                return (
                  <div key={i} className={`border rounded-xl p-4 transition-all ${bg}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${letterStyle}`}>
                        {getLetter(i)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-slate-800">
                            {opt}
                          </div>

                          <div className="flex items-center gap-2">
                            {isCorrect && (
                              <div className="text-xs max-md:hidden font-medium text-emerald-600">
                                Correct
                              </div>
                            )}

                            {isUser && !isCorrect && (
                              <div className="text-xs max-md:hidden font-medium text-red-600">
                                Your choice
                              </div>
                            )}

                            <button
                              onClick={() => toggleExplain(i)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                              {isExpanded ? (
                                <EyeOff className="w-4 h-4 text-slate-600" />
                              ) : (
                                <Eye className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isExpanded
                              ? 'max-h-96 opacity-100 mt-3'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          {text ? (
                            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-6">
                              {text}
                            </div>
                          ) : (
                            <div className="text-slate-400 italic text-sm">
                              No explanation available.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <button onClick={() => setIndex((s) => Math.max(0, s - 1))} disabled={index === 0} className="px-3 py-1 rounded bg-white text-blue-950 border-blue-950 border cursor-pointer disabled:opacity-50">
              Previous
            </button>
            <div className="text-sm text-gray-600">{index + 1}/{detail.total}</div>
            <button onClick={() => setIndex((s) => Math.min(detail.total - 1, s + 1))} disabled={index === detail.total - 1} className="px-3 py-1 rounded text-white bg-gradient-to-r from-blue-800 to-blue-900 text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryDetail;