import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Clock, LogOut } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";

interface NavbarProps {
    view: string;
    setView: Dispatch<SetStateAction<"landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader">>
    setUser: Dispatch<SetStateAction<{ _id: string; displayName: string; email: string } | null>>;
    user: { _id: string; displayName: string; email: string } | null;
    handleCompleteTest?: () => void;
    formatTime?: (seconds: number) => string;
    timeLeft?: number;
}

const Navbar = ({ setUser, setView, view, user, handleCompleteTest, formatTime, timeLeft }: NavbarProps) => {
    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('aero_user');
        setView('landing');
        setOpen(false)
    };

    const [open, setOpen] = useState(false);
  return (
    <header className="h-14 sm:h-16 px-1 sm:px-8 bg-bluebook-navy text-white flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => user && setView('dashboard')}>
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">AeroTest</h1>
        </div>
        
        {user && view === 'testing' && (
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-md border border-white/20">
              <Clock className="w-4 h-4 text-blue-300" />
              <span className="font-mono text-base sm:text-lg tabular-nums">{formatTime(timeLeft)}</span>
            </div>
            <button onClick={handleCompleteTest} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm font-bold transition-all">Finish</button>
          </div>
        )}

        {user && view !== 'testing' && (
          <div className="flex items-center gap-1 sm:gap-2 no-scrollbar">
                <button onClick={() => setView('dashboard')}
                  className={`md:px-3 px-1 max-sm:m-0 py-1.5 rounded-lg text-[10px] sm:text-xs transition-all ${
                    view === 'dashboard' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  Dashboard
                </button>
              
                <button onClick={() => setView('words')}
                  className={`md:px-3 px-1 max-sm:m-0 py-1.5 rounded-lg text-[10px] sm:text-xs transition-all ${
                    view === 'words' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                    So'zlar
                </button>
              
                <button onClick={() => setView('stories')}
                  className={`md:px-3 px-1 max-sm:m-0 py-1.5 rounded-lg text-[10px] sm:text-xs transition-all ${
                    view === 'stories' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  Stories
                </button>
              
                <button onClick={() => setView('profile')}
                  className={`md:px-3 px-1 max-sm:m-0 py-1.5 rounded-lg text-[10px] sm:text-xs transition-all ${
                    view === 'profile' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  Tahlil
                </button>
              
                <div className="w-[1px] h-4 bg-white/10 mx-2 hidden sm:block" />
              
                <button onClick={() => setOpen(true)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-red-400"
                  title="Sign Out">
                  <LogOut className="w-4 h-4 sm:w-5 h-5" />
                </button>
          </div>
        )}

        {/* Confirmation modal with shadcn ui */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to log out?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
  )
}

export default Navbar