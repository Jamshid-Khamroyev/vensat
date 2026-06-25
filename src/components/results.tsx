import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWordState } from '../states/word.state';
import {  TrendingUp } from 'lucide-react';

const Results = () => {
   const { result: data } = useWordState()
   const navigate = useNavigate()

   return (
      <motion.div 
         key="results" 
         initial={{ opacity: 0, y: 30 }} 
         animate={{ opacity: 1, y: 0 }} 
         exit={{ opacity: 0 }}
         className="min-h-screen bg-gray-50 p-4 sm:p-6"
      >
         <div className="max-w-3xl mx-auto">
       
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
               <div className="p-6 sm:p-8 space-y-6">
                  <div className="text-center">
                     <h2 className="text-2xl font-bold text-gray-900">Performance Summary</h2>
                     <p className="text-sm text-gray-500 mt-1">{data.total} questions completed</p>
                  </div>

                  <div className="flex justify-center">
                     <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                           <circle 
                              cx="64" cy="64" r="56" 
                              stroke="#2563eb" 
                              strokeWidth="10" 
                              fill="transparent" 
                              strokeDasharray={351.86} 
                              strokeDashoffset={351.86 - (351.86 * (data.percentage / 100))} 
                              strokeLinecap="round" 
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-3xl font-bold text-gray-900">{data.percentage}%</span>
                           <span className="text-xs text-gray-500">Score</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                     <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                        <div className="text-2xl font-bold text-gray-900">{data.score}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Correct</div>
                     </div>
                     <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                        <div className="text-2xl font-bold text-gray-900">{data.total - data.score}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Wrong</div>
                     </div>
                     <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                        <div className="text-2xl font-bold text-gray-900">{data.total}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Total</div>
                     </div>
                  </div>

                  {data.overallAccuracy && (
                     <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-gray-600" />
                              <div>
                                 <div className="text-sm font-medium text-gray-900">Overall Accuracy</div>
                                 <div className="text-xs text-gray-500">{data.overallAccuracy.totalTestsTaken} tests taken</div>
                              </div>
                           </div>
                           <div className="text-2xl font-bold text-gray-900">{data.overallAccuracy.score}%</div>
                        </div>
                     </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                     <button 
                        onClick={() => navigate('/dashboard')} 
                        className="flex-1 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm text-gray-700"
                     >
                        Dashboard
                     </button>
                  </div>
               </div>
            </motion.div>
         </div>
      </motion.div>
   )
}

export default Results