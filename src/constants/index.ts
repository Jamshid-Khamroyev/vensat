import { Brain, Target, Zap, Award, TrendingUp, Users, Layers, PenTool, BookOpen } from 'lucide-react';
import { CategoryConfig } from '../types';

export const features = [
        { icon: Brain, title: "AI Tahlil", desc: "Gemini AI sizning zaif tomonlaringizni aniqlaydi va maqsadli mashqlar taklif etadi." },
        { icon: Target, title: "Aniq Maqsad", desc: "Har bir o'quv sessiyasi sizning hozirgi darajangizga moslashtiriladi." },
        { icon: TrendingUp, title: "O'sish Grafigi", desc: "Real vaqtda natijalaringizni kuzating va yaxshilanishni ko'ring." },
        { icon: Zap, title: "Tez Natija", desc: "4-6 hafta ichida sezilarli o'sish ko'rgan talabalar 95% ni tashkil etadi." },
        { icon: Award, title: "Expert Strategiya", desc: "Top natija ko'rsatgan o'quvchilarning sirlari va texnikalarini o'rganing." },
        { icon: Users, title: "Jamoa", desc: "Do'stlaringiz bilan raqobat qiling va birgalikda o'sing." },
    ];

export const stats = [
        { n: "95%", l: "Ball o'sishi" },
        { n: "10K+", l: "Faol talabalar" },
        { n: "+320", l: "O'rtacha o'sish" },
        { n: "50+", l: "Amaliy testlar" },
    ];

export const testimonials = [
        { name: "Sarah Johnson", role: "Harvard talabasi", text: "AeroTest yordamida SAT ballim 320 punktga oshdi. AI tavsiyalari juda aniq ishladi!", stars: 5 },
        { name: "Michael Chen", role: "Stanford nomzodi", text: "Tizimli yondashuv va batafsil tahlil hamma narsani o'zgartirdi. Jiddiy tayyorlanuvchilar uchun tavsiya etaman.", stars: 5 },
        { name: "Emily Rodriguez", role: "Yale talabasi", text: "3 oyda 1350 dan 1520 ga chiqdim! Shaxsiy o'quv rejasi aynan kerakli narsa edi.", stars: 5 },
    ];

export const faqs = [
        { q: "AI qanday ishlaydi?", a: "Gemini AI sizning natijalaringizni tahlil qilib, real vaqtda qiyinlik darajasini moslashtiradi va zaif tomonlaringizni aniqlaydi." },
        { q: "Qaysi SAT bo'limlari qamrab olingan?", a: "Barcha bo'limlar: O'qish va Yozish, Matematika (kalkulyatorsiz va bilan) hamda Esse qamrab olingan." },
        { q: "Qancha vaqtda natija ko'raman?", a: "Ko'pchilik talabalar 4-6 hafta muntazam mashq qilgandan so'ng sezilarli o'sishni his qiladi." },
        { q: "Mobil qurilmada ishlaydi?", a: "Ha, platforma barcha qurilmalarda — kompyuter, planshet va telefonlarda mukammal ishlaydi." },
    ];

export const categories: CategoryConfig[] = [
    { 
      id: 'information-ideas',
      name: 'Information and Ideas',
      shortName: 'Info & Ideas',
      icon: Target,
      description: 'Central ideas, details, inferences, claims',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      id: 'craft-structure',
      name: 'Craft and Structure',
      shortName: 'Craft & Structure',
      icon: Layers,
      description: 'Word choice, text structure, purpose',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      id: 'expression-ideas',
      name: 'Expression of Ideas',
      shortName: 'Expression',
      icon: PenTool,
      description: 'Development, organization, effective language',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      id: 'standard-conventions',
      name: 'Standard Conventions',
      shortName: 'Conventions',
      icon: BookOpen,
      description: 'Grammar, punctuation, sentence structure',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];