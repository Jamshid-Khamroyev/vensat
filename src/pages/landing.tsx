import { motion } from 'framer-motion';
import { Lock, RotateCcw, Sparkles, BookOpen, Brain, Target, Trophy, Users, Clock, Star, ChevronDown, CheckCircle, Zap, TrendingUp, Award } from 'lucide-react';

interface landingProps {
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    setAuthEmail: React.Dispatch<React.SetStateAction<string>>;
    authEmail: string;
    setUser: React.Dispatch<React.SetStateAction<any>>;
    setView: React.Dispatch<React.SetStateAction<string>>;
    fetchAll: (userId: string) => void;
    isProcessing: boolean;
}

const LandingPage = ({ authEmail, fetchAll, setAuthEmail, setIsProcessing, setUser, setView, isProcessing  }: landingProps) => {

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!authEmail) return;
        setIsProcessing(true);
        try {
           const res = await fetch("/api/auth/login", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ email: authEmail })
           });
           const userData = await res.json();
           setUser(userData);
           localStorage.setItem('aero_user', JSON.stringify(userData));
           fetchAll(userData._id);
           setView('dashboard');
           setAuthEmail('');
        } catch (e) { alert("Login failed."); }
        finally { setIsProcessing(false); }
      };

      const features = [
        {
          icon: <Brain className="w-8 h-8" />,
          title: "AI-Powered Learning",
          description: "Advanced Gemini AI technology provides personalized learning paths and adaptive difficulty matching."
        },
        {
          icon: <BookOpen className="w-8 h-8" />,
          title: "Comprehensive Content",
          description: "Extensive library of SAT materials, practice tests, and interactive lessons covering all subjects."
        },
        {
          icon: <Target className="w-8 h-8" />,
          title: "Progress Tracking",
          description: "Real-time analytics and detailed performance metrics to monitor your improvement."
        },
        {
          icon: <Zap className="w-8 h-8" />,
          title: "Rapid Improvement",
          description: "Optimized study schedules and targeted practice for faster score enhancement."
        },
        {
          icon: <Award className="w-8 h-8" />,
          title: "Expert Strategies",
          description: "Proven test-taking techniques and time management strategies from top performers."
        },
        {
          icon: <Users className="w-8 h-8" />,
          title: "Community Support",
          description: "Connect with peers, share study tips, and participate in group challenges."
        }
      ];

      const stats = [
        { number: "95%", label: "Score Improvement", description: "Average score increase" },
        { number: "10K+", label: "Active Students", description: "Currently learning" },
        { number: "4.9/5", label: "User Rating", description: "Student satisfaction" },
        { number: "50+", label: "Practice Tests", description: "Full-length simulations" }
      ];

      const testimonials = [
        {
          name: "Sarah Johnson",
          role: "Harvard Student",
          content: "AeroTest helped me improve my SAT score by 320 points. The AI-powered recommendations were spot-on!",
          rating: 5
        },
        {
          name: "Michael Chen",
          role: "Stanford Applicant",
          content: "The structured approach and detailed analytics made all the difference. Highly recommend for serious test takers.",
          rating: 5
        },
        {
          name: "Emily Rodriguez",
          role: "Yale Student",
          content: "From 1350 to 1520 in just 3 months! The personalized study plan was exactly what I needed.",
          rating: 5
        }
      ];

      const faqs = [
        {
          question: "How does the AI-powered learning work?",
          answer: "Our Gemini AI analyzes your performance patterns, learning style, and pace to create customized study plans and adapt difficulty levels in real-time."
        },
        {
          question: "What SAT subjects are covered?",
          answer: "We cover all SAT sections: Evidence-Based Reading and Writing, Math (with and without calculator), and the Essay section with comprehensive practice materials."
        },
        {
          question: "How long does it take to see improvement?",
          answer: "Most students see noticeable improvement within 4-6 weeks with consistent practice. Our analytics show an average 150-point increase in the first month."
        },
        {
          question: "Can I track my progress over time?",
          answer: "Yes! We provide detailed progress tracking, performance analytics, and visual reports showing your improvement across all subject areas."
        },
        {
          question: "Is there mobile access?",
          answer: "Yes, our platform is fully responsive and works seamlessly on all devices - desktop, tablet, and mobile for learning on the go."
        }
      ];

  return (
    <div className="min-h-screen bg-bluebook-bg md:pt-12 pt-20 font-sans">
      {/* Hero Section */}
      <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="focus-mode h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="inline-flex p-4 bg-white rounded-2xl shadow-xl transform rotate-3 mb-8"
          >
            <Sparkles className="w-12 h-12 text-blue-600" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-bluebook-navy"
          >
            Master the SAT with
            <br />
            <span className="text-blue-600">AI-Powered Excellence</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
          >
            Join thousands of students achieving their dream scores. Personalized learning paths, 
            advanced AI analytics, and comprehensive SAT preparation—all in one platform.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
          >
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Free trial available</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
          
          <motion.form 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.6 }}
            onSubmit={handleLogin} 
            className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-2xl border border-slate-100 space-y-4"
          >
             <div className="space-y-3 text-left">
                <label className="text-xs uppercase font-black tracking-widest text-slate-400 ml-1">Start Your Journey</label>
                <input 
                  type="email" 
                  required 
                  value={authEmail} 
                  onChange={e => setAuthEmail(e.target.value)} 
                  placeholder="Enter your email address" 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bluebook-input"
                />
             </div>
             <button 
               type="submit" 
               disabled={isProcessing}
               className="w-full bluebook-button py-4 px-8 rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
             >
               {isProcessing ? (
                 <div className="flex items-center gap-2">
                   <RotateCcw className="w-5 h-5 animate-spin" />
                   <span>Getting Started...</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-3">
                   <Zap className="w-5 h-5" />
                   <span>Start Free Trial</span>
                 </div>
               )}
             </button>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8 }}
            className="flex justify-center"
          >
            <ChevronDown className="w-8 h-8 text-slate-400 animate-bounce" />
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-bluebook-navy mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-1">{stat.label}</div>
                <div className="text-sm text-slate-500">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-bluebook-navy">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our comprehensive platform combines cutting-edge AI technology with proven learning methodologies 
              to deliver the most effective SAT preparation experience.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-slate-100"
              >
                <div className="w-16 h-16 bg-bluebook-navy rounded-xl flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-bluebook-navy">
              Success Stories from Our Students
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Join thousands of students who've transformed their SAT scores and college prospects with AeroTest.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 p-8 rounded-2xl border border-slate-100"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-slate-800">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-bluebook-navy">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to know about getting started with AeroTest
            </p>
          </motion.div>
          
          <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl border border-slate-200"
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-3">{faq.question}</h3>
                <p className="text-slate-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage