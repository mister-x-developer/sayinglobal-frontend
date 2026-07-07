'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { BookOpen, Search, ShieldCheck, Tag, MapPin, Heart, Star, MessageCircle, AlertCircle } from 'lucide-react';

export default function UserGuidePage() {
  const t = useTranslations();

  const sections = [
    {
      title: "Platformaga Kirish",
      icon: <ShieldCheck className="w-8 h-8 text-brand-primary" />,
      content: "Sayin Global platformasi sizga qishloq xo'jaligi hayvonlarini ishonchli sotib olish va sotish imkonini beradi. Ro'yxatdan o'tish uchun telefon raqamingizdan foydalaning va profilingizni to'ldiring."
    },
    {
      title: "E'lonlar Qidirish",
      icon: <Search className="w-8 h-8 text-indigo-500" />,
      content: "Asosiy sahifadagi qidiruv orqali yoki toifalar (Qoramol, Qo'y, Echki va h.k.) bo'yicha hayvonlarni izlashingiz mumkin. Filtrlar yordamida narx, viloyat va zotini tanlang."
    },
    {
      title: "E'lon Joylash",
      icon: <Tag className="w-8 h-8 text-emerald-500" />,
      content: "O'z hayvoningizni sotish uchun 'E'lon berish' tugmasini bosing. Sifatli rasm yuklang, aniq narx va ma'lumotlarni kiriting. Bu xaridorlar e'tiborini tez tortadi."
    },
    {
      title: "Xavfsizlik va Ishonch",
      icon: <Star className="w-8 h-8 text-amber-500" />,
      content: "Boshqa foydalanuvchilar bilan muomala qilganda, ularning reytingiga va sharhlariga e'tibor bering. To'lovlarni faqat ishonch hosil qilgandan so'ng amalga oshiring."
    },
    {
      title: "Sotuvchi bilan Bog'lanish",
      icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
      content: "Sotuvchi bilan bevosita platformamizdagi chat orqali yozishishingiz yoki ko'rsatilgan telefon raqamiga qo'ng'iroq qilishingiz mumkin."
    },
    {
      title: "Shikoyat Qilish",
      icon: <AlertCircle className="w-8 h-8 text-red-500" />,
      content: "Agar e'lon yoki sotuvchi qoidalarni buzsa, sahifadagi 'Shikoyat qilish' tugmasi orqali adminga xabar bering. Biz darhol chora ko'ramiz."
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-fg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-primary/10 text-brand-primary mb-4">
            <BookOpen className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-fg">Platformadan Foydalanish Qo&apos;llanmasi</h1>
          <p className="text-lg text-fg-muted max-w-2xl mx-auto">Sayin Global platformasida qanday qilib to&apos;g&apos;ri, xavfsiz va samarali savdo qilish bo&apos;yicha to&apos;liq ma&apos;lumot.</p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-bg-elevated border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-bg-subtle rounded-xl group-hover:scale-110 transition-transform">
                  {section.icon}
                </div>
                <h3 className="text-xl font-bold text-fg">{section.title}</h3>
              </div>
              <p className="text-fg-subtle leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer info */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-12 p-8 bg-brand-primary/5 border border-brand-primary/20 rounded-3xl text-center"
        >
          <h4 className="text-xl font-bold text-fg mb-2">Qo&apos;shimcha savollaringiz bormi?</h4>
          <p className="text-fg-muted mb-6">Bizning qo&apos;llab-quvvatlash xizmatimiz sizga doim yordam berishga tayyor.</p>
          <button className="px-8 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/25">
            Admin bilan bog&apos;lanish
          </button>
        </motion.div>
      </div>
    </div>
  );
}
