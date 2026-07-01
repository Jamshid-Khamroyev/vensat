import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GroupWord } from './types';
import PasteWord from './components/paste-word';
import Navbar from './components/navbar';
import TestingPage from './pages/testing';
import api from "./services/api"
import HistoryDetail from './components/history';
import GNewsReader from './components/article';
import { Routes, Route, useNavigate } from 'react-router-dom';
import MockTest from './pages/mock-test';
import { useUserStore } from './states/user.state';
import Feedback from './pages/feedback';
import Users from './pages/users';

// Lazy loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/landing'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const ManualTest = lazy(() => import('./components/manual-test'));
const AiPracticeGenerator = lazy(() => import('./components/ai-practice-generator'));
const StoryReading = lazy(() => import('./pages/story-reading'));
const StoryGen = lazy(() => import('./components/story-gen'));
const Stories = lazy(() => import('./pages/stories'));
const Profile = lazy(() => import('./pages/profile'));
const Results = lazy(() => import('./components/results'));
const WordGroupView = lazy(() => import('./pages/word-group'));

// --- App ---
export default function App() {
  const { login, user } = useUserStore()
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [userWords, setUserWords] = useState<GroupWord[]>([]);
  

  

  const loadingTsx = <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>


  // Restore from URL params (legacy support)
  useEffect(() => {
    const init = async () => {
      if(!localStorage.getItem("aero_token")) return navigate('/');
      setLoading(true)
      try {
        const { data } = await api.get("/api/auth/me")
        login(data.user)
      } catch (error) {
        navigate('/')
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);
  

 

  if (loading) return <div className="h-screen flex items-center justify-center"><RotateCcw className="animate-spin" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-bluebook-bg font-sans selection:bg-blue-100">
      {/* Navbar - using legacy view for navbar logic */}
      <Navbar />

      <main className="flex-1 overflow-x-hidden">
        {/* React Router Routes */}
        <Routes>
          <Route path="/" element={
            <Suspense fallback={loadingTsx}>
              <LandingPage />
            </Suspense>
          } />

          <Route path="/dashboard" element={
            <Suspense fallback={loadingTsx}>
              {user?.role === 'owner' ? (
                <Users />
              ) : (
                <Dashboard  />
              )}
            </Suspense>
          } />

          {user && user?.role === "admin" ? (
            <Route path="/create" element={
              <Suspense fallback={loadingTsx}>
                <ManualTest />
              </Suspense>
            } />
          ) : (
            <>
             <Route path="/ai-generator" element={
              <Suspense fallback={loadingTsx}>
                <AiPracticeGenerator  />
              </Suspense>
            } />

            <Route path="/testing/:id" element={
              <TestingPage  />
            } />

              <Route path="/stories" element={
                <Suspense fallback={loadingTsx}>
                  <Stories />
                </Suspense>
              } />

              <Route path="/profile" element={
                <Suspense fallback={loadingTsx}>
                  <Profile />
                </Suspense>
              } />

              <Route path="/words" element={
                <motion.div key="words" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="focus-mode space-y-8">
                  <PasteWord  />
                </motion.div>
              } />

              <Route path="/results" element={
                <Results  />
              } />

              <Route path="/history/:id" element={
                <HistoryDetail  />
              } />

              <Route path="/story-generator" element={
                <Suspense fallback={loadingTsx}>
                  <StoryGen userWords={userWords}  />
                </Suspense>
              } />
              <Route path="/story-reader/:id" element={
                <StoryReading setUserWords={setUserWords} userWords={userWords} /> 
              } />

              <Route path="/word-group/:groupId" element={
                <Suspense fallback={loadingTsx}>
                  <WordGroupView />
                </Suspense>
              } />
              
              <Route path="/article" element={
                <GNewsReader /> 
              } />

            </>
          )}

          <Route path="/mock-test" element={
            <Suspense fallback={loadingTsx}>
              <MockTest />
            </Suspense>
          } />
          
          <Route path="/feedback" element={
                <Suspense fallback={loadingTsx}>
                  <Feedback />
                </Suspense>
          } />
        </Routes>
      </main>
    </div>
  );
}