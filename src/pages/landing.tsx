import { Lock, Sparkles, BookOpen, Star, CheckCircle, X, Eye, EyeOff, Mail, User, ArrowRight, Loader2, ChevronRight, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { faqs, features, stats, testimonials } from '../constants';
import api from '../services/api';
import { AppUser } from '../types';

interface landingProps {
    setUser: React.Dispatch<React.SetStateAction<any>>;
    setView: React.Dispatch<React.SetStateAction<string>>;
    user: AppUser | null;
}

const LandingPage = ({ setUser, user, setView }: landingProps) => {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', displayName: '' });
    const [localLoading, setLocalLoading] = useState(false);

    const openAuthModal = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setAuthModalOpen(true);
        setFormData({ email: '', password: '', displayName: '' });
        setShowPassword(false);
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.email || !formData.password) return toast.error("Barcha maydonlarni to'ldiring");
      if (authMode === "register" && !formData.displayName) return toast.error("Ismingizni kiriting");

      setLocalLoading(true);

      try {
        const res = await api.post(authMode === "login" ? "/api/auth/login" : "/api/auth/register", 
          authMode === "login"
            ? { email: formData.email, password: formData.password }
            : { email: formData.email, password: formData.password, displayName: formData.displayName }
        );

        const data = res.data;

        setUser(data.user);
        localStorage.setItem("aero_user", JSON.stringify(data.user));
        localStorage.setItem("aero_token", data.token);

        toast.success(authMode === "login" ? "Xush kelibsiz!" : "Hisob yaratildi!");
        setAuthModalOpen(false);
        setView("dashboard");        
      } catch {
        toast.error("Ulanish xatosi. Qayta urinib ko'ring.");
      } finally {
        setLocalLoading(false);
      }
    };

    useEffect(() => {
        if(user) {
            setView("dashboard");
        }
    })
    

    return (
        <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Sora', 'Plus Jakarta Sans', sans-serif" }}>

            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 px-2 lg:px-12 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="h-full flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-950 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-blue-950text-xl max-md:hidden tracking-tight">AeroTest</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        {["Imkoniyatlar", "Natijalar", "Narxlar", "FAQ"].map(n => (
                            <a key={n} href="#" className="text-sm font-medium text-gray-500 hover:text-blue-950 transition-colors">{n}</a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-2">
                        <button onClick={() => openAuthModal('login')} className="md:px-4 px-2 cursor-pointer py-2 text-sm text-blue-950 border border-blue-950 hover:bg-blue-950 hover:text-white rounded-lg transition-colors">
                            Kirish
                        </button>
                        <button onClick={() => openAuthModal('register')} className="md:px-4 px-2 cursor-pointer py-2 text-sm bg-blue-950 text-white rounded-lg hover:bg-white hover:text-blue-950 border hover:border-blue-950 transition-colors">
                            Boshlash →
                        </button>
                    </div>
                </div>
            </header>

            {/* Auth Modal */}
            {authModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center md:p-4 p-2 bg-slate-950/70 backdrop-blur-sm" onClick={() => setAuthModalOpen(false)}>
                  <div onClick={e => e.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">

                    <div className="relative bg-blue-950 px-5 py-5">
                      <button onClick={() => setAuthModalOpen(false)} className="absolute right-4 top-4 rounded-lg p-1.5 text-blue-300 hover:bg-white/10 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                      </button>

                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>

                      <h2 className="text-xl font-black text-white">{authMode === "login" ? "Xush kelibsiz" : "Hisob yaratish"}</h2>
                      <p className="mt-1 text-sm text-blue-300">{authMode === "login" ? "O'z hisobingizga kiring" : "Minglab talabalar qatoriga qo'shiling"}</p>
                    </div>

                    <div className="p-5">
                      <form onSubmit={handleAuthSubmit} className="space-y-4">

                        {authMode === "register" && (
                          <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Ism Familiya</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <input type="text" value={formData.displayName} onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))} placeholder="Abdulloh Karimov" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-blue-950" />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="siz@example.com" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-blue-950" />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Parol</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-11 text-sm text-gray-800 outline-none focus:border-blue-950" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <button type="submit" disabled={localLoading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white hover:bg-blue-900 disabled:bg-gray-300">
                          {localLoading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Kuting...</span></> : <><span>{authMode === "login" ? "Kirish" : "Hisob yaratish"}</span><ArrowRight className="h-4 w-4" /></>}
                        </button>
                      </form>
                      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                          <p className="text-sm text-gray-500">
                              {authMode === 'login' ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"}
                              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                                  className="ml-1.5 font-bold text-blue-950 hover:underline transition-colors">
                                  {authMode === 'login' ? 'Ro\'yxatdan o\'ting' : 'Kirish'}
                              </button>
                          </p>
                      </div>
                    </div>
                  </div>
                </div>
                )}

            {/* ── HERO ── */}
            <section className="pt-16 min-h-screen flex flex-col">
                <div className="flex-1 flex flex-col lg:flex-row items-center max-w-7xl mx-auto px-2 lg:px-12 py-20 gap-16">
                    {/* Left */}
                    <div className="flex-1 space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                            <Sparkles className="w-3.5 h-3.5 text-blue-950" />
                            <span className="text-xs font-bold text-blue-950 tracking-wide">AI-POWERED SAT PREP</span>
                        </div>
                        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-blue-950 leading-[1.05] tracking-tight">
                            SAT ballini<br />
                            <span className="relative">
                                katta oshiring
                                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                                    <path d="M2 9 C75 3, 150 3, 298 9" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            </span>
                        </h1>
                        <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
                            AI tahlili, shaxsiy o'quv rejasi va minglab amaliy savollar bilan 3 oyda orzuingizga erishing.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => openAuthModal('register')}
                                className="flex items-center justify-center gap-2 px-7 py-4 bg-blue-950 text-white font-bold rounded-xl hover:bg-blue-900 transition-all text-sm shadow-lg shadow-blue-950/20">
                                Bepul boshlash <ArrowRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => openAuthModal('login')}
                                className="flex items-center justify-center gap-2 px-7 py-4 bg-white text-blue-950 font-bold rounded-xl border-2 border-blue-950/10 hover:border-blue-950/30 transition-all text-sm">
                                Kirish <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-6 pt-2">
                            {[["Kredit karta shart emas", true], ["Bepul sinov", true], ["Istalgan vaqt bekor qilish", true]].map(([t, ok]) => (
                                <div key={t as string} className="flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-blue-950" />
                                    <span className="text-xs text-gray-500 font-medium">{t as string}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — visual card stack */}
                    <div className="flex-1 flex justify-center">
                        <div className="relative w-72 h-80">
                            {/* Back card */}
                            <div className="absolute top-6 right-0 w-64 h-72 bg-blue-100 rounded-2xl rotate-6" />
                            {/* Middle card */}
                            <div className="absolute top-3 left-4 w-64 h-72 bg-blue-200 rounded-2xl -rotate-2" />
                            {/* Front card */}
                            <div className="absolute top-0 left-0 w-64 h-72 bg-blue-950 rounded-2xl shadow-2xl p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs text-blue-300 font-semibold">AeroTest</span>
                                    </div>
                                    <p className="text-blue-300 text-xs font-medium mb-1">Umumiy ball</p>
                                    <p className="text-5xl font-black text-white">1520</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                                        <span className="text-green-400 text-xs font-bold">+320 o'sish</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {[["O'qish", 790, 800], ["Matematika", 730, 800]].map(([l, v, max]) => (
                                        <div key={l as string}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs text-blue-300">{l as string}</span>
                                                <span className="text-xs text-white font-bold">{v}/{max}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/10 rounded-full">
                                                <div className="h-1.5 bg-white rounded-full" style={{ width: `${(v as number) / (max as number) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="bg-blue-950 py-8">
                    <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-black text-white mb-0.5">{s.n}</div>
                                <div className="text-xs font-medium text-blue-300 uppercase tracking-wider">{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-2 lg:px-12">
                    <div className="mb-16">
                        <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-3">Nima beradi?</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-blue-950 max-w-xl leading-tight">Muvaffaqiyat uchun hamma narsa bir joyda</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <div key={i}
                                className="group p-7 rounded-2xl border border-gray-100 hover:border-blue-950/20 hover:shadow-lg transition-all duration-300 bg-white">
                                <div className="w-11 h-11 rounded-xl bg-blue-950 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <f.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-base font-black text-blue-950 mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-5xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-3">Qanday ishlaydi?</p>
                        <h2 className="text-4xl font-black text-blue-950">3 qadam — muvaffaqiyat</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { n: "01", t: "Ro'yxatdan o'ting", d: "Bepul hisob oching va dastlabki diagnostika testini topshiring." },
                            { n: "02", t: "Shaxsiy reja oling", d: "AI zaif tomonlaringizni aniqlab, maqsadli o'quv rejasi tuzadi." },
                            { n: "03", t: "Muvaffaqiyatga erishing", d: "Muntazam mashq va tahlil bilan ballini oshiring va universitetga kiring." },
                        ].map((s, i) => (
                            <div key={i} className="relative">
                                {i < 2 && <div className="hidden md:block absolute top-8 left-full w-full h-px bg-blue-950/10 -translate-x-8" />}
                                <div className="text-5xl font-black text-blue-950/10 mb-4">{s.n}</div>
                                <h3 className="text-lg font-black text-blue-950 mb-2">{s.t}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <button onClick={() => openAuthModal('register')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-950 text-white font-bold rounded-xl hover:bg-blue-900 transition-all shadow-lg shadow-blue-950/20">
                            Hoziroq boshlash <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-2 lg:px-12">
                    <div className="mb-16">
                        <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-3">Fikrlar</p>
                        <h2 className="text-4xl font-black text-blue-950">Talabalar nima deydi?</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <div key={i}
                                className="p-7 rounded-2xl border border-gray-100 bg-white">
                                <div className="flex mb-4">
                                    {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 text-blue-950 fill-blue-950" />)}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed mb-6">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-950 flex items-center justify-center text-white text-xs font-black">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-blue-950">{t.name}</div>
                                        <div className="text-xs text-gray-400">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-4xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-3">FAQ</p>
                        <h2 className="text-4xl font-black text-blue-950">Ko'p so'raladigan savollar</h2>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <div key={i}
                                className="bg-white rounded-xl border border-gray-100 p-6">
                                <h3 className="text-base font-bold text-blue-950 mb-2">{f.q}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="bg-blue-950 py-20">
                <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
                    <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                        Orzuingizga<br />bugun bir qadam yaqinlashing
                    </h2>
                    <p className="text-blue-300 text-lg">Ro'yxatdan o'tish — bepul. Kredit karta talab etilmaydi.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button onClick={() => openAuthModal('register')}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-950 font-black rounded-xl hover:bg-gray-100 transition-all text-sm">
                            Bepul boshlash <ArrowRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => openAuthModal('login')}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all text-sm border border-white/20">
                            Kirish
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-blue-950 border-t border-white/5 py-12">
                <div className="max-w-7xl mx-auto px-2 lg:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-white font-black text-lg">AeroTest</span>
                            </div>
                            <p className="text-blue-300 text-sm leading-relaxed">AI yordamida SAT tayyorgarligida yangi standart.</p>
                        </div>
                        {[
                            { t: "Platforma", links: ["Imkoniyatlar", "Narxlar", "Demo", "Blog"] },
                            { t: "Kompaniya", links: ["Biz haqimizda", "Jamoamiz", "Karyera", "Yangiliklar"] },
                            { t: "Yordam", links: ["FAQ", "Qo'llab-quvvatlash", "Maxfiylik", "Shartlar"] },
                        ].map(col => (
                            <div key={col.t}>
                                <h4 className="text-white font-bold text-sm mb-4">{col.t}</h4>
                                <ul className="space-y-2">
                                    {col.links.map(l => (
                                        <li key={l}><a href="#" className="text-blue-300 text-sm hover:text-white transition-colors">{l}</a></li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t">
                        <p className="text-white text-sm">© 2025 AeroTest. Barcha huquqlar himoyalangan.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;