import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, LayoutDashboard, Languages, BookOpen, FileQuestion, BarChart3, MessageSquareQuote, FilePlus2, Database, Users as UsersIcon, Sun, Moon, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../states/user.state";
import { useThemeStore } from "../states/theme.state";
import type { LucideIcon } from "lucide-react";
import logo from "../public/image.png";

type NavItem = { key: string; label: string; short: string; icon: LucideIcon };

const USER_ITEMS: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
    { key: 'words', label: 'Words', short: 'Words', icon: Languages },
    { key: 'stories', label: 'Stories', short: 'Stories', icon: BookOpen },
    { key: 'mock-test', label: 'Mock Test', short: 'Mock', icon: FileQuestion },
    { key: 'profile', label: 'Analyze', short: 'Analyze', icon: BarChart3 },
];

const ADMIN_ITEMS: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
    { key: 'mock-test', label: 'Mock Test', short: 'Mock', icon: FileQuestion },
    { key: 'create', label: 'Import', short: 'Import', icon: FilePlus2 },
    { key: 'sources', label: 'Sources', short: 'Sources', icon: Database },
];

const OWNER_ITEMS: NavItem[] = [
    { key: 'dashboard', label: 'Users', short: 'Users', icon: UsersIcon },
    { key: 'mock-test', label: 'Mock Test', short: 'Mock', icon: FileQuestion },
];

const FEEDBACK_ITEM: NavItem = { key: 'feedback', label: 'Feedback', short: 'Feedback', icon: MessageSquareQuote };

export const getNavItems = (role?: string): NavItem[] =>
    role === 'owner' ? OWNER_ITEMS : role === 'admin' ? ADMIN_ITEMS : USER_ITEMS;

/** Screens that own the whole viewport and must not show app navigation. */
export const useIsChromeless = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === '/' || location.pathname.startsWith('/testing') || searchParams.get('mode') === 'testing';
};

export const Logo = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none" onClick={onClick}>
        <img src={logo} alt="VenSAT logo" className="md:h-12 h-8" />
    </div>
);

export const ThemeToggle = ({ className = "" }: { className?: string }) => {
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';
    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className={`w-10 h-10 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className}`}
        >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
};

const Navbar = () => {
    const location = useLocation();
    const currentPath = location.pathname.split("/")[1];
    const { user, logout } = useUserStore();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const chromeless = useIsChromeless();

    const navItems = user?.role === 'user' || !user?.role ? [...USER_ITEMS, FEEDBACK_ITEM] : getNavItems(user?.role);

    useEffect(() => setMenuOpen(false), [location.pathname]);

    const handleLogout = useCallback(() => {
        logout();
        localStorage.removeItem('aero_token');
        navigate('/');
        setOpen(false);
    }, []);

    const handleLogoClick = useCallback(() => {
        if (user && !chromeless) navigate('/dashboard');
    }, [user, chromeless]);

    if (location.pathname === '/') return null;

    return (
        <>
            <header className="h-16 px-4 sm:px-8 lg:px-12 bg-background/90 backdrop-blur-xl border-b border-border flex items-center justify-between sticky top-0 z-50">
                <Logo onClick={handleLogoClick} />

                {user && !chromeless && (
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = currentPath === item.key;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => navigate(`/${item.key}`)}
                                    aria-current={isActive ? 'page' : undefined}
                                    title={item.label}
                                    className={`flex items-center gap-2 px-2.5 lg:px-3.5 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                                        isActive
                                            ? 'bg-accent text-accent-foreground font-extrabold'
                                            : 'font-semibold text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                                    <span className="hidden lg:inline">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                )}

                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    {user && !chromeless && (
                        <>
                            <button
                                onClick={() => setOpen(true)}
                                title="Sign Out"
                                className="hidden md:flex items-center gap-2 px-3 h-10 rounded-md whitespace-nowrap text-sm font-semibold text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden xl:inline">Sign Out</span>
                            </button>
                            <div className="relative md:hidden">
                                <button
                                    onClick={() => setMenuOpen((v) => !v)}
                                    aria-label="More"
                                    aria-expanded={menuOpen}
                                    className="w-10 h-10 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                <AnimatePresence>
                                    {menuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                transition={{ duration: 0.12 }}
                                                className="absolute right-0 top-12 z-50 w-52 rounded-lg border border-border bg-popover py-1.5 shadow-xl origin-top-right"
                                            >
                                                {(user.role === 'user' || !user.role) && (
                                                    <button onClick={() => navigate('/feedback')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                                                        <MessageSquareQuote className="w-5 h-5 text-muted-foreground" /> Feedback
                                                    </button>
                                                )}
                                                <button onClick={() => { setMenuOpen(false); setOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-destructive hover:bg-muted">
                                                    <LogOut className="w-5 h-5" /> Sign Out
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>
            </header>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="w-full h-28 flex items-center justify-center p-1 mb-2">
                            <img src={logo} alt="VenSAT logo" className="w-full h-full object-contain" />
                        </div>
                        <DialogTitle className="font-serif text-2xl font-extrabold">Confirm Logout</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to log out? You'll need to sign in again to access your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
                        <Button variant="destructive" onClick={handleLogout} className="flex-1">Logout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

/** Android-style navigation bar, shown below md. */
export const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const chromeless = useIsChromeless();
    if (!user || chromeless) return null;

    const currentPath = location.pathname.split("/")[1];
    const items = getNavItems(user.role);

    return (
        <>
            <div aria-hidden className="md:hidden h-[calc(80px+env(safe-area-inset-bottom))]" />
            <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-secondary border-t border-border pb-[env(safe-area-inset-bottom)]">
                <ul className="flex h-20 items-start pt-3 px-2">
                    {items.map((item) => {
                        const isActive = currentPath === item.key;
                        const Icon = item.icon;
                        return (
                            <li key={item.key} className="flex-1">
                                <button
                                    onClick={() => navigate(`/${item.key}`)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className="w-full flex flex-col items-center gap-1"
                                >
                                    <span className={`h-8 w-16 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-accent' : ''}`}>
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </span>
                                    <span className={`text-xs ${isActive ? 'font-extrabold text-foreground' : 'font-semibold text-muted-foreground'}`}>
                                        {item.short}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </>
    );
};

export default Navbar;
