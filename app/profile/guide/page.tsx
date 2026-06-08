/* eslint-disable react/no-unescaped-entities */
'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, AlertTriangle, ShieldAlert, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <main className="flex-1 container-page py-6 pb-20">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-fg mb-6">
          <ArrowLeft className="h-4 w-4" />
          Profilga qaytish
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-elevated p-6 lg:p-10 max-w-4xl mx-auto rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-brand-primary" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-fg">Platforma Yo'riqnomasi</h1>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 text-fg">
                <ShieldCheck className="h-5 w-5 text-success" />
                100-ballik Sog'lomlik Tizimi (Health Score)
              </h2>
              <p className="text-fg-muted leading-relaxed text-sm sm:text-base">
                Platformamizda barcha sotuvchilar <strong>100 ball</strong> bilan o'z faoliyatini boshlaydi. Bu ball sizning platformadagi ishonchlilikingizni va qoidalarga qanchalik rioya qilishingizni bildiradi. Ballingizga qarab hisobingiz holati belgilanadi.
              </p>
            </section>

            <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="font-bold text-success mb-1 text-sm sm:text-base">Good (Yaxshi)</p>
                <p className="text-xl sm:text-2xl font-black text-success">80 - 100</p>
                <p className="text-[10px] sm:text-xs text-success/80 mt-2">Hech qanday cheklovlar yo'q</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <p className="font-bold text-warning mb-1 text-sm sm:text-base">Warning</p>
                <p className="text-xl sm:text-2xl font-black text-warning">50 - 79</p>
                <p className="text-[10px] sm:text-xs text-warning/80 mt-2">Kichik cheklovlar bo'lishi mumkin</p>
              </div>
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
                <p className="font-bold text-danger mb-1 text-sm sm:text-base">Restricted</p>
                <p className="text-xl sm:text-2xl font-black text-danger">20 - 49</p>
                <p className="text-[10px] sm:text-xs text-danger/80 mt-2">E'lon va chat cheklanadi</p>
              </div>
              <div className="p-4 rounded-xl bg-bg-subtle border border-border">
                <p className="font-bold text-fg mb-1 text-sm sm:text-base">Blocked</p>
                <p className="text-xl sm:text-2xl font-black text-fg">0 - 19</p>
                <p className="text-[10px] sm:text-xs text-fg-muted mt-2">Hisob to'liq muzlatiladi</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 text-fg mt-8">
                <AlertTriangle className="h-5 w-5 text-danger" />
                Ball ayirilishi (Jazolar)
              </h2>
              <p className="text-fg-muted mb-4 text-sm sm:text-base">
                Xaridorlar tomonidan qilingan shikoyatlar moderatorlar tomonidan o'rganib chiqiladi. Agar shikoyat o'rinli deb topilsa, uning jiddiyligiga qarab ball ayiriladi:
              </p>
              <ul className="space-y-3 bg-bg-subtle p-5 rounded-xl text-sm">
                <li className="flex justify-between border-b border-border pb-2">
                  <span className="text-fg">Kichik qoidabuzarlik (Low)</span>
                  <span className="font-bold text-danger">-5 ball</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span className="text-fg">O'rta darajadagi xato (Medium)</span>
                  <span className="font-bold text-danger">-10 ball</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span className="text-fg">Jiddiy qoidabuzarlik (High)</span>
                  <span className="font-bold text-danger">-20 ball</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-fg">O'ta og'ir holat, firibgarlik (Critical)</span>
                  <span className="font-bold text-danger">-50 ball</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 text-fg mt-8">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                Ball qo'shilishi (Tiklanish)
              </h2>
              <p className="text-fg-muted mb-4 text-sm sm:text-base">
                Yo'qotilgan ballarni faqat halol savdo qilish orqali qayta tiklash mumkin. Buning uchun tizim qalloblikni oldini oluvchi maxsus mexanizmga ega.
              </p>
              <div className="space-y-4">
                <div className="p-4 sm:p-5 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                  <h3 className="font-bold text-brand-primary mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Tasdiqlangan savdo (+5 ball)
                  </h3>
                  <p className="text-sm text-fg-muted leading-relaxed">
                    Siz e'loningizni "Sotildi" deb belgilaganingizda, tizim sizga maxsus yashirin kod (confirmation code) beradi. Bu kodni xaridorga berasiz. Xaridor u kodni tizimga kiritgach, savdo tasdiqlanadi va sizga <strong>avtomatik +5 ball qo'shiladi</strong>.
                  </p>
                </div>
                <div className="p-4 sm:p-5 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                  <h3 className="font-bold text-brand-primary mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Yaxshi reyting (+2 ball)
                  </h3>
                  <p className="text-sm text-fg-muted leading-relaxed">
                    Xaridor xaridni tasdiqlayotgan vaqtda sizga 4 yoki 5 yulduzli a'lo baho bersa, qo'shimcha <strong>+2 ball</strong> (jami +7 ball) yoziladi. (Ballaringiz 100 dan oshmaydi).
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 text-fg mt-8">
                <ShieldAlert className="h-5 w-5 text-fg" />
                Bloklanish va Murojaat
              </h2>
              <p className="text-fg-muted text-sm sm:text-base leading-relaxed">
                Agar sizning ballingiz 19 yoki undan pasayib ketsa, hisobingiz <strong>avtomatik tarzda to'liq bloklanadi</strong> va barcha e'lonlaringiz o'chiriladi (yashiriladi). Bloklangan holatdan mustaqil ravishda chiqish imkonsiz. Bunday holatda, siz faqat Adminlar qarorini kutishingiz yoki qo'llab-quvvatlash xizmatiga murojaat qilishingiz kerak bo'ladi.
              </p>
            </section>

          </div>
        </motion.div>
      </main>
    </div>
  );
}
