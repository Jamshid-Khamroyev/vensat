<div align="center">
<img width="1200" height="475" alt="AeroTest Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎓 AeroTest - AI-powered SAT Preparation Platform

AeroTest - sun'iy intellekt asosida ishlaydigan SAT imtihoniga tayyorgarlik ko'rish platformasi. Bu platforma talabalarga o'z bilimlarini sinash, so'z boyligini oshirish va AI yordamida shaxsiy mashqlar yaratish imkonini beradi.

## 📋 Loyiha haqida

AeroTest zamonaviy texnologiyalar asosida qurilgan ta'lim platformasi bo'lib, SAT imtihoniga tayyorgarlik ko'rayotgan talabalar uchun mo'ljallangan. Platformada AI yordamida avtomatik ravishda testlar yaratish, so'zlar o'rganish, hikoyalar o'qish va bilimlarni kuzatib borish imkoniyatlari mavjud.

## 🎯 Kimlar uchun

- **SAT imtihoniga tayyorgarlik ko'rayotgan talabalar**
- **Ingliz tili grammatikasi va vocabulariyasini oshirmoqchi bo'lganlar**
- **O'qituvchilar va tutorlar** (shaxsiy testlar yaratish uchun)
- **Ta'lim texnologiyalari bilan shug'ullanadigan dasturchilar**

## ✨ Asosiy Xususiyatlar

### 🧠 AI-powered Test Generation
- PDF fayllardan va veb-sahifalardan SAT testlari avtomatik yaratish
- RAG (Retrieval Augmented Generation) texnologiyasi asosida ishlaydi
- 4 ta asosiy SAT kategoriyasi bo'yicha savollar:
  - Information & Ideas (Ma'lumot va G'oyalar)
  - Craft & Structure (Mahorat va Tuzilma)
  - Expression of Ideas (G'oyalarni Ifodalash)
  - Standard Conventions (Standart Qoidalari)

### 📚 Test Tizimi
- Shaxsiy va global testlar yaratish
- Qiyinchilik darajasi (easy, medium, hard)
- Vaqt cheklovi bilan test yechish
- Natijalarni avtomatik hisoblash
- Test tarixini saqlash

### 🔤 So'z O'rganish Tizimi
- So'z guruhlarini yaratish va boshqarish
- AI yordamida so'zlar uchun misol jumlalar yaratish
- So'zlar uchun amaliy savollar avtomatik yaratish
- Tarjima xizmati (100 tagacha so'z)
- Rasmli so'z kartochkalari

### 📖 Hikoya O'qish
- AI yordamida hikoyalar yaratish (turli janrlar va mavzular)
- Hikoyalarni saqlash va o'qish
- Hikoyalar orqali yangi so'zlarni o'rganish

### 📊 Progress Tracking
- 4 ta asosiy skill bo'yicha progress kuzatish:
  - `iai_skill` - Information & Ideas
  - `cas_skill` - Craft & Structure  
  - `eoi_skill` - Expression of Ideas
  - `sec_skill` - Standard Conventions
- Umumiy aniqlik (accuracy) kuzatish
- Test tarixi va natijalar tahlili

### 🔐 Autentifikatsiya
- Ro'yxatdan o'tish va tizimga kirish
- JWT token asosida autentifikatsiya
- Foydalanuvchi profili boshqaruvi

### 📝 Feedback Tizimi
- Foydalanuvchi fikr-mulohazalarini to'plash
- Telegram bot orqali bildirishnomalar

## 🛠 Texnik Arxitektura

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool va dev server
- **TailwindCSS** - Styling
- **shadcn/ui** - UI komponentlar
- **React Router** - Routing
- **Zustand** - State management
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload
- **CORS** - Cross-origin resource sharing

### AI Services
- **Groq** - Chat completions
- **OpenRouter** - Embeddings
- **Google Gemini** - AI generation
- **LangChain** - AI framework
- **Qdrant** - Vector database (RAG uchun)

### Boshqa Xizmatlar
- **ImageKit** - Rasm yuklash
- **Mozilla Readability** - Veb-sahifa tarkibini ajratish
- **PDF Parse** - PDF fayllarni o'qish
- **Telegram Bot API** - Feedback bildirishnomalari

## 📁 Loyiha Tuzilishi

```
vensat/
├── backend/
│   ├── controller/          # API route handlers
│   │   ├── auth.controller.ts
│   │   ├── test.controller.ts
│   │   ├── words.controller.ts
│   │   ├── story.controller.ts
│   │   ├── rag.controller.ts
│   │   ├── ai.controller.ts
│   │   ├── history.controller.ts
│   │   └── practice-word.ts
│   ├── models/              # Mongoose schemas
│   │   ├── user.model.ts
│   │   ├── test.model.ts
│   │   ├── question.model.ts
│   │   ├── group.words.model.ts
│   │   ├── story.model.ts
│   │   ├── history.model.ts
│   │   └── practice-word.model.ts
│   ├── midlewere/           # Express middleware
│   │   ├── auth.midlewere.ts
│   │   └── rate-limit.ts
│   ├── services/            # Business logic
│   │   ├── geminiService.ts
│   │   └── qdrant.ts
│   └── utils/               # Utility functions
├── src/
│   ├── pages/               # React pages
│   │   ├── landing.tsx
│   │   ├── dashboard.tsx
│   │   ├── testing.tsx
│   │   ├── word-group.tsx
│   │   ├── stories.tsx
│   │   ├── story-reading.tsx
│   │   ├── profile.tsx
│   │   └── feedback.tsx
│   ├── components/          # Reusable components
│   │   ├── navbar.tsx
│   │   ├── manual-test.tsx
│   │   ├── story-gen.tsx
│   │   ├── words-cards.tsx
│   │   └── ...
│   ├── states/              # Zustand stores
│   ├── services/            # API client
│   └── types/               # TypeScript types
├── server.ts                # Express server entry
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
├── package.json             # Dependencies
├── .env.example             # Environment variables template
└── README.md                # This file
```

## 🚀 O'rnatish va Ishga Tushirish

### Talablar

- **Node.js** (v18 yoki undan yuqori)
- **MongoDB** (MongoDB Atlas yoki local)
- **API kalitlari** (quyidagi xizmatlar uchun)

### 1. Repositoryni klonlash

```bash
git clone <repository-url>
cd vensat
```

### 2. Dependenciyalarni o'rnatish

```bash
npm install
```

### 3. Environment Variables sozlash

`.env.example` faylini `.env` ga nusxalang va quyidagi kalitlarni to'ldiring:

```bash
cp .env.example .env
```

## 🔑 Environment Variables

`.env` faylida quyidagi o'zgaruvchilar bo'lishi kerak:

### Server Sozlamalari
```env
PORT=3000
NODE_ENV=development
```

### Database
```env
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database"
```
- **MongoDB Atlas** yoki local MongoDB connection string
- [MongoDB Atlas](https://www.mongodb.com/atlas) da bepul cluster yaratishingiz mumkin

### Autentifikatsiya
```env
JWT_SECRET="your-secret-key-change-in-production"
```
- JWT tokenlarni imzolash uchun maxfiy kalit
- Productionda kuchli va tasodifiy kalit ishlating

### AI Xizmatlari

#### Groq API (Chat completions)
```env
GROQ_API_KEY="your-groq-api-key"
```
- [Groq Console](https://console.groq.com/) da API key oling
- Asosan chat va text generation uchun ishlatiladi

#### OpenRouter API (Embeddings)
```env
OPEN_ROUTER_API_KEY="your-openrouter-api-key"
```
- [OpenRouter](https://openrouter.ai/) da API key oling
- Text embeddings uchun ishlatiladi (RAG systemda)

#### Google Gemini (Ixtiyoriy)
```env
GEMINI_API_KEY="your-gemini-api-key"
```
- [Google AI Studio](https://aistudio.google.com/) da API key oling
- Qo'shimcha AI generation uchun

### Vector Database (Qdrant)
```env
QDRANT_URL="https://your-cluster.qdrant.io"
QDRANT_API_KEY="your-qdrant-api-key"
```
- [Qdrant Cloud](https://cloud.qdrant.io/) da bepul cluster yaratishingiz mumkin
- RAG system uchun vektor ma'lumotlarini saqlash

### Translation Service
```env
RAPIDAPI_KEY="your-rapidapi-key"
```
- [RapidAPI](https://rapidapi.com/) da Deep Translate API uchun key oling
- So'z tarjimalari uchun ishlatiladi

### Image Upload (Ixtiyoriy)
```env
IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-id"
```
- [ImageKit](https://imagekit.io/) da bepul account yaratishingiz mumkin
- Test rasmlarini yuklash uchun ishlatiladi

### Frontend (Vite)
```env
VITE_API_URL="http://localhost:3000"
```
- Frontend API URL (faqat development uchun)

### Telegram Bot (Feedback uchun)
```env
BOT_TOKEN="your-bot-token"
BOT_CHAT_ID="your-chat-id"
```
- [@BotFather](https://t.me/botfather) orqali bot yaratib token oling
- Feedback bildirishnomalari uchun ishlatiladi

## 🎮 Ishga Tushirish

### Development rejim
```bash
npm run dev
```
Server `http://localhost:3000` da ishlaydi

### Production build
```bash
npm run build
npm start
```

### Preview production build
```bash
npm run build
npm run preview
```

## 🔒 Xavfsizlik

- Rate limiting (har endpoint uchun alohida)
- JWT token based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation
- File upload restrictions

## 🚀 Deployment

### Render (Recommended)
1. Repositoryni Render ga ulang
2. Environment variablesni sozlang
3. Automatic deployment

### Vercel (Frontend)
1. Frontendni Vercel ga deploy qiling
2. Backend URLni environment variablega qo'shing

### Docker (Alternative)
```bash
docker build -t aerotest .
docker run -p 3000:3000 aerotest
```

## 🤝 Contribution

Contribution qilmoqchi bo'lsangiz:

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/AmazingFeature`)
3. Commit qiling (`git commit -m 'Add some AmazingFeature'`)
4. Push qiling (`git push origin feature/AmazingFeature`)
5. Pull Request oching

## 📄 License

Bu loyiha [MIT License](LICENSE) ostida litsenziyalangan.

## 📞 Aloqa

Savollaringiz bo'lsa, issue yoki pull report qoldiring.

## 🙏 Acknowledgments

- SAT preparation resources
- AI service providers (Groq, OpenRouter, Google, Qdrant)
- Open source community 