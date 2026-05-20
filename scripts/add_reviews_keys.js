const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'messages');

const ADD = {
  uz: {
    reviews: {
      writeReview: 'Sharh yozish',
      editYourReview: 'Sharhingizni tahrirlash',
      placeholder: 'Tajribangizni boshqalar bilan boʻlishing',
      post: 'Yuborish',
      posted: 'Sharh yuborildi',
      cannotRateSelf: 'Oʻzingizga sharh qoldira olmaysiz',
      reportPrompt: 'Sabab: spam / abuse / off_topic / false_info / other',
      reportSent: 'Shikoyat yuborildi',
      replyPrompt: 'Javobingiz',
      reply: 'Javob',
      helpful: 'Foydali',
      edited: 'tahrirlangan',
      sellerBadge: 'Sotuvchi',
      viewAll: 'Barcha sharhlarni koʻrish',
      sort_newest: 'Yangi',
      sort_highest: 'Yuqori baho',
      sort_lowest: 'Past baho',
      sort_most_useful: 'Eng foydali',
    },
    sellers: {
      reviews: 'Sharhlar',
      totalReviews: 'sharh',
    },
    success: { deleted: 'Oʻchirildi' },
  },
  'uz-cyrl': {
    reviews: {
      writeReview: 'Шарҳ ёзиш',
      editYourReview: 'Шарҳингизни таҳрирлаш',
      placeholder: 'Тажрибангизни бошқалар билан бўлишинг',
      post: 'Юбориш',
      posted: 'Шарҳ юборилди',
      cannotRateSelf: 'Ўзингизга шарҳ қолдира олмайсиз',
      reportPrompt: 'Сабаб: spam / abuse / off_topic / false_info / other',
      reportSent: 'Шикоят юборилди',
      replyPrompt: 'Жавобингиз',
      reply: 'Жавоб',
      helpful: 'Фойдали',
      edited: 'таҳрирланган',
      sellerBadge: 'Сотувчи',
      viewAll: 'Барча шарҳларни кўриш',
      sort_newest: 'Янги',
      sort_highest: 'Юқори баҳо',
      sort_lowest: 'Паст баҳо',
      sort_most_useful: 'Энг фойдали',
    },
    sellers: { reviews: 'Шарҳлар', totalReviews: 'шарҳ' },
    success: { deleted: 'Ўчирилди' },
  },
  ru: {
    reviews: {
      writeReview: 'Написать отзыв',
      editYourReview: 'Редактировать отзыв',
      placeholder: 'Поделитесь своим опытом',
      post: 'Отправить',
      posted: 'Отзыв опубликован',
      cannotRateSelf: 'Нельзя оставлять отзыв самому себе',
      reportPrompt: 'Причина: spam / abuse / off_topic / false_info / other',
      reportSent: 'Жалоба отправлена',
      replyPrompt: 'Ваш ответ',
      reply: 'Ответ',
      helpful: 'Полезно',
      edited: 'отредактировано',
      sellerBadge: 'Продавец',
      viewAll: 'Все отзывы',
      sort_newest: 'Новые',
      sort_highest: 'Высокая оценка',
      sort_lowest: 'Низкая оценка',
      sort_most_useful: 'Самые полезные',
    },
    sellers: { reviews: 'Отзывы', totalReviews: 'отзывов' },
    success: { deleted: 'Удалено' },
  },
  en: {
    reviews: {
      writeReview: 'Write a review',
      editYourReview: 'Edit your review',
      placeholder: 'Share your experience',
      post: 'Post',
      posted: 'Review posted',
      cannotRateSelf: 'You cannot review yourself',
      reportPrompt: 'Reason: spam / abuse / off_topic / false_info / other',
      reportSent: 'Reported',
      replyPrompt: 'Your reply',
      reply: 'Reply',
      helpful: 'Helpful',
      edited: 'edited',
      sellerBadge: 'Seller',
      viewAll: 'View all reviews',
      sort_newest: 'Newest',
      sort_highest: 'Highest',
      sort_lowest: 'Lowest',
      sort_most_useful: 'Most useful',
    },
    sellers: { reviews: 'Reviews', totalReviews: 'reviews' },
    success: { deleted: 'Deleted' },
  },
};

function deepMerge(a, b) {
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
      a[k] = a[k] && typeof a[k] === 'object' ? a[k] : {};
      deepMerge(a[k], b[k]);
    } else {
      a[k] = b[k];
    }
  }
  return a;
}

for (const code of Object.keys(ADD)) {
  const file = path.join(ROOT, `${code}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  deepMerge(data, ADD[code]);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`updated ${file}`);
}
