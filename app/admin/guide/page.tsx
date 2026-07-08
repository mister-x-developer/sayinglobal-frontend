'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { BookOpen, ShieldAlert, Flag, Megaphone, Activity, Users, Settings, Database } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminGuidePage() {
  const t = useTranslations();

  const sections = [
    {
      title: t('AdminGuide.sections.dashboard.title'),
      icon: <Activity className="w-8 h-8 text-brand-primary" />,
      content: t('AdminGuide.sections.dashboard.content')
    },
    {
      title: t('AdminGuide.sections.moderation.title'),
      icon: <Flag className="w-8 h-8 text-red-500" />,
      content: t('AdminGuide.sections.moderation.content')
    },
    {
      title: t('AdminGuide.sections.users.title'),
      icon: <Users className="w-8 h-8 text-blue-500" />,
      content: t('AdminGuide.sections.users.content')
    },
    {
      title: t('AdminGuide.sections.broadcasts.title'),
      icon: <Megaphone className="w-8 h-8 text-amber-500" />,
      content: t('AdminGuide.sections.broadcasts.content')
    },
    {
      title: t('AdminGuide.sections.security.title'),
      icon: <ShieldAlert className="w-8 h-8 text-indigo-500" />,
      content: t('AdminGuide.sections.security.content')
    },
    {
      title: t('AdminGuide.sections.categories.title'),
      icon: <Database className="w-8 h-8 text-emerald-500" />,
      content: t('AdminGuide.sections.categories.content')
    }
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center space-y-4 pt-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-brand-primary/10 text-brand-primary mb-2 shadow-inner">
            <BookOpen className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-fg">{t('AdminGuide.title')}</h1>
          <p className="text-lg text-fg-muted max-w-2xl mx-auto">{t('AdminGuide.subtitle')}</p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-bg-elevated border border-border/50 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-700" />
              <div className="relative z-10">
                 <div className="flex flex-col gap-4 mb-4">
                   <div className="p-4 bg-bg-subtle rounded-2xl w-fit group-hover:bg-bg transition-colors shadow-sm">
                     {section.icon}
                   </div>
                   <h3 className="text-xl font-black text-fg">{section.title}</h3>
                 </div>
                 <p className="text-fg-subtle leading-relaxed font-medium">{section.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}
