import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Clock, LogOut, LayoutDashboard, Library, Newspaper, BarChart3, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { Dispatch, SetStateAction, useState } from "react";

interface NavbarProps {
    view: string;
    setView: Dispatch<SetStateAction<"landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group">>
    setUser: Dispatch<SetStateAction<{ _id: string; displayName: string; email: string } | null>>;
    user: { _id: string; displayName: string; email: string } | null;
    handleCompleteTest?: () => void;
    formatTime?: (seconds: number) => string;
    timeLeft?: number;
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'words', label: "So'zlar", icon: Library },
  { key: 'stories', label: 'Stories', icon: Newspaper },
  { key: 'profile', label: 'Tahlil', icon: BarChart3 },
] as const;

const Navbar = ({ setUser, setView, view, user, handleCompleteTest, formatTime, timeLeft }: NavbarProps) => {
    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('aero_user');
        setView('landing');
        setOpen(false);
        setMobileMenu(false);
    };

    const [open, setOpen] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);

    const isTesting = view === 'testing';
    const isLanding = view === 'landing';

    return (
      <>
        <header className={`h-14 sm:h-16 px-3 sm:px-6 lg:px-8 bg-white flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors duration-300 `}>
          {/* Logo */}
          <div className="flex items-center text-blue-950 gap-2.5 cursor-pointer shrink-0" onClick={() => user && !isTesting && setView('dashboard')}>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-blue-950`}>
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight hidden sm:block">AeroTest</h1>
          </div>

          {/* Desktop Navigation */}
          {user && !isTesting && !isLanding && (
            <nav className="hidden md:flex items-center gap-1 bg-white/5 border rounded-xl p-1">
              {navItems.map((item) => {
                const isActive = view === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setView(item.key as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-950 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-blue-950'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="w-[1px] h-5 bg-white/10 mx-1" />

              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-white/10 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </nav>
          )}

          {/* Mobile Menu Toggle */}
          {user && !isTesting && !isLanding && (
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300"
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </header>

        {/* Mobile Navigation Sheet */}
        {mobileMenu && user && !isTesting && !isLanding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden fixed inset-x-0 top-14 z-40 bg-bluebook-navy/98 backdrop-blur-xl border-b border-white/10 shadow-2xl"
          >
            <div className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = view === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setView(item.key as any); setMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isActive && <div className="ml-auto w-2 h-2 bg-blue-300 rounded-full" />}
                  </button>
                );
              })}
              <div className="pt-2 border-t border-white/10 mt-2">
                <button
                  onClick={() => setOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Logout Confirmation Modal */}
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
      </>
    );
};

export default Navbar