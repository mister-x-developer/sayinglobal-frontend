'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, Search, ShieldCheck, Tag, MapPin, Heart, Star, MessageCircle, AlertCircle } from 'lucide-react';
import { AppNav } from '@/components/layout/AppNav';
import { LandingFooter } from '@/components/layout/LandingFooter';

export default function UserGuidePage() {
  const t = useTranslations();

  const sections = [
    {
      title: t('Guide.sections.login.title'),
      icon: <ShieldCheck className="w-8 h-8 text-brand-primary" />,
      content: t('Guide.sections.login.content')
    },
    {
      title: t('Guide.sections.search.title'),
      icon: <Search className="w-8 h-8 text-indigo-500" />,
      content: t('Guide.sections.search.content')
    },
    {
      title: t('Guide.sections.post.title'),
      icon: <Tag className="w-8 h-8 text-emerald-500" />,
      content: t('Guide.sections.post.content')
    },
    {
      title: t('Guide.sections.security.title'),
      icon: <Star className="w-8 h-8 text-amber-500" />,
      content: t('Guide.sections.security.content')
    },
    {
      title: t('Guide.sections.contact.title'),
      icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
      content: t('Guide.sections.contact.content')
    },
    {
      title: t('Guide.sections.report.title'),
      icon: <AlertCircle className="w-8 h-8 text-red-500" />,
      content: t('Guide.sections.report.content')
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      <AppNav />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-primary/10 text-brand-primary mb-4">
            <BookOpen className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-fg">{t('Guide.title')}</h1>
          <p className="text-lg text-fg-muted max-w-2xl mx-auto">{t('Guide.subtitle')}</p>
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
          <h4 className="text-xl font-bold text-fg mb-2">{t('Guide.footer.title')}</h4>
          <p className="text-fg-muted mb-6">{t('Guide.footer.subtitle')}</p>
          <a href="https://t.me/sayinglobal_support" target="_blank" rel="noopener noreferrer">
            <button className="px-8 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/25">
              {t('Guide.footer.button')}
            </button>
          </a>
        </motion.div>
      </div>
      </main>
      <LandingFooter />
    </div>
  );
}
