import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, LogOut, LayoutDashboard, Library, Newspaper, BarChart3, Menu, X, GraduationCap, FileQuestion } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dispatch, SetStateAction, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../states/user.state";

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500' },
  { key: 'words', label: "Words", icon: Library, color: 'from-emerald-500 to-teal-500' },
  { key: 'stories', label: 'Stories', icon: Newspaper, color: 'from-purple-500 to-pink-500' },
  { key: 'textbooks', label: 'TextBooks', icon: GraduationCap, color: 'from-indigo-500 to-blue-500' },
  { key: 'mock-test', label: 'Mock Test', icon: FileQuestion, color: 'from-rose-500 to-orange-500' },
  { key: 'profile', label: 'Analize', icon: BarChart3, color: 'from-orange-500 to-red-500' },
] as const;

const Navbar = () => {
    const currentPath = window.location.pathname.split("/")[1];
    const { user, logout } = useUserStore()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isTesting = searchParams.get('mode') === 'testing';

    const handleLogout = useCallback(() => {
        logout();
        navigate('/');
        setOpen(false);
        setMobileMenu(false);
    }, []);

    const handleNavigation = useCallback((key: string) => {
        navigate(key as any);
        setMobileMenu(false);
    }, []);

    const handleLogoClick = useCallback(() => {
        if (user && !isTesting) {
            navigate('/dashboard');
        }
    }, [user, isTesting]);

    return (
        <>
            <header className="relative h-16 px-4 sm:px-8 lg:px-12 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                {/* Logo */}
                <div 
                    className="flex items-center gap-3 cursor-pointer shrink-0"
                    onClick={handleLogoClick}
                >
                    <div className="relative">
                        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                            <BookOpen className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h1 className="text-xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent hidden sm:block">
                        AeroTest
                    </h1>
                </div>

                {/* Desktop Navigation */}
                {!isTesting && (
                    <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 backdrop-blur-sm rounded-2xl p-1 border border-slate-200/50">
                        {navItems.map((item) => {
                            const isActive = currentPath === item.key;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => handleNavigation(item.key)}
                                    className={`relative group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden ${
                                        isActive
                                            ? 'text-white shadow-lg sha dow-blue-500/25'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className={`absolute inset-0 bg-gradient-to-r ${item.color}`}
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <Icon className={`relative z-10 w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                                    }`} />
                                    <span className="relative z-10">{item.label}</span>
                                </button>
                            );
                        })}
                        
                        <div className="w-px h-6 bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-2" />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setOpen(true)}
                            className="relative group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 transition-all duration-300 overflow-hidden"
                        >
                            <LogOut className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                            <span className="relative z-10 hidden lg:inline">Sign Out</span>
                        </motion.button>
                    </nav>
                )}

                {/* Mobile Menu Toggle */}
                {user && !isTesting && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMobileMenu(!mobileMenu)}
                        className="md:hidden relative w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-md"
                    >
                        <AnimatePresence mode="wait">
                            {mobileMenu ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                >
                                    <Menu className="w-5 h-5 text-slate-600" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )}
            </header>

            {/* Mobile Navigation Sheet */}
            <AnimatePresence>
                {mobileMenu && user && !isTesting && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="md:hidden fixed inset-x-0 top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-2xl"
                    >
                        <div className="p-4 space-y-2">
                            {navItems.map((item, index) => {
                                const isActive = currentPath === item.key;
                                const Icon = item.icon;
                                return (
                                    <motion.button
                                        key={item.key}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleNavigation(item.key)}
                                        className={`w-full relative group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden ${
                                            isActive
                                                ? 'text-white shadow-lg'
                                                : 'text-slate-600 hover:text-slate-800'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="mobileActiveNav"
                                                className={`absolute inset-0 bg-gradient-to-r ${item.color}`}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={`relative z-10 w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                                            isActive ? 'text-white' : 'text-slate-400'
                                        }`} />
                                        <span className="relative z-10">{item.label}</span>
                                        {isActive && (
                                            <motion.div 
                                                className="relative z-10 ml-auto w-1.5 h-1.5 bg-white rounded-full"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                            
                            <motion.div 
                                className="pt-3 border-t border-slate-200/50 mt-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <button
                                    onClick={() => setOpen(true)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sign Out</span>
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logout Confirmation Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md overflow-hidden p-2">
                    <div className="relative">
                        <div className="absolute -top-2 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
                        <DialogHeader className="p-6 pb-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                                    <LogOut className="w-5 h-5 text-red-600" />
                                </div>
                                <DialogTitle className="text-xl font-bold">Confirm Logout</DialogTitle>
                            </div>
                            <DialogDescription className="text-slate-600">
                                Are you sure you want to log out? You'll need to sign in again to access your account.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="p-6 pt-2 gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => setOpen(false)}
                                className="flex-1 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleLogout}
                                className="flex-1 bg-gradient-to-r text-white from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/25 transition-all duration-300"
                            >
                                Logout
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Navbar;