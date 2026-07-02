import { useState } from 'react';
import { 
  Send, 
  Star, 
  MessageCircle, 
  ThumbsUp,
  Loader2,
} from 'lucide-react';
import api from '../services/api';



const Feedback = () => {
  const [formData, setFormData] = useState({
    experience: '',
    features: '',
    improvement: '',
    rating: 0,
    recommendation: '',
    email: '',
    problem: '',
    frequency: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api.post(`/api/feedback`, formData);
      setSubmitted(true);
      setFormData({
        rating: 0,
        experience: '',
        problem: '',
        features: '',
        improvement: '',
        frequency: '',
        email: '',
        recommendation: ''
      });
    } catch (error) {
      console.error('Xatolik:', error);
      alert('Xatolik yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ThumbsUp className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Rahmat!</h2>
          <p className="text-gray-600 mb-6">Sizning fikringiz biz uchun muhim.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors"
          >
            Yana feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
            <MessageCircle className="w-4 h-4" />
            <span>Fikringiz muhim</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Mahsulot haqida fikringiz</h1>
          <p className="text-gray-500 mt-1 text-sm">Startapni rivojlantirishda yordam bering</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Reyting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Baholang
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({...formData, rating: star})}
                  className="p-1 focus:outline-none"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= formData.rating 
                        ? 'text-yellow-300 fill-yellow-300' 
                        : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Muammo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qanday muammoni hal qiladi?
            </label>
            <textarea
              value={formData.problem}
              onChange={(e) => setFormData({...formData, problem: e.target.value})}
              placeholder="Mahsulot qanday muammoingizni yechdi?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>

          {/* Tajriba */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foydalanish tajribangiz
            </label>
            <select
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
              required
            >
              <option value="">Tanlang</option>
              <option value="Birinchi marta">Birinchi marta</option>
              <option value="Bir necha kun">Bir necha kun</option>
              <option value="Bir hafta">Bir hafta</option>
              <option value="Bir oydan ko'p">Bir oydan ko'p</option>
              <option value="Hali sinab ko'rmadim">Hali sinab ko'rmadim</option>
            </select>
          </div>

          {/* Foydalanish chastotasi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qanchalik tez-tez?
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
              required
            >
              <option value="">Tanlang</option>
              <option value="Kuniga bir necha marta">Kuniga bir necha marta</option>
              <option value="Kuniga bir marta">Kuniga bir marta</option>
              <option value="Haftada 2-3 marta">Haftada 2-3 marta</option>
              <option value="Haftada bir marta">Haftada bir marta</option>
              <option value="Kamdan-kam">Kamdan-kam</option>
            </select>
          </div>

          {/* Yoqadigan jihatlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nima yoqdi?
            </label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData({...formData, features: e.target.value})}
              placeholder="Eng ko'p nima yoqdi?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>

          {/* Takliflar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Takliflaringiz
            </label>
            <textarea
              value={formData.improvement}
              onChange={(e) => setFormData({...formData, improvement: e.target.value})}
              placeholder="Nimalarni yaxshilash mumkin?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>

          {/* Tavsiya */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do'stingizga tavsiya qilasizmi?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Albatta', 'Ehtimol', 'Bilmayman', "Yo'q"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({...formData, recommendation: option})}
                  className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                    formData.recommendation === option
                      ? 'border text-white bg-emerald-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (ixtiyoriy)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Email manzilingiz"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Yuborilmoqda...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Yuborish
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;