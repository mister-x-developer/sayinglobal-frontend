#!/bin/bash

# 🎨 SAYIN GLOBAL - Mobil Ilovalarni Yaratish
# Bu script ikkala ilovani ham yaratadi: User va Admin

set -e  # Xatolikda to'xtatish

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 SAYIN GLOBAL - Mobil Ilovalar Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Rang kodlar
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Dependencies tekshirish
echo -e "${YELLOW}📋 1. Dependencies tekshirilmoqda...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js topilmadi! Iltimos o'rnating."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm topilmadi! Iltimos o'rnating."
    exit 1
fi

echo -e "${GREEN}✅ Node.js va npm topildi${NC}"
echo ""

# 2. Node modules o'rnatish
echo -e "${YELLOW}📦 2. Dependencies o'rnatilmoqda...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ node_modules allaqachon mavjud"
fi
echo ""

# 3. Assetlar yaratish
echo -e "${YELLOW}🎨 3. Ikonlar va splash screenlar yaratilmoqda...${NC}"
npm run generate:assets
echo -e "${GREEN}✅ Barcha assetlar yaratildi${NC}"
echo ""

# 4. User App yaratish
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📱 4. USER APP - Sayin Global${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npm run setup:user-app
echo -e "${GREEN}✅ User App tayyor!${NC}"
echo ""

# 5. Admin App yaratish
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}👨‍💼 5. ADMIN APP - Admin SA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npm run setup:admin-app
echo -e "${GREEN}✅ Admin App tayyor!${NC}"
echo ""

# 6. Yakuniy ma'lumot
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 BARCHA ILOVALAR TAYYOR!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 USER APP (Sayin Global):"
echo "   • Package: com.sayinglobal.user"
echo "   • Android: npm run android:user"
echo "   • iOS: npm run ios:user"
echo ""
echo "👨‍💼 ADMIN APP (Admin SA):"
echo "   • Package: com.sayinglobal.admin"
echo "   • Android: npm run android:admin"
echo "   • iOS: npm run ios:admin"
echo ""
echo "📚 To'liq qo'llanma:"
echo "   • MOBILE_APPS.md - Ishlab chiqish"
echo "   • ../MOBILE_DEPLOYMENT_GUIDE.md - Deploy qilish"
echo ""
echo -e "${GREEN}✨ Omad tilaymiz!${NC}"
