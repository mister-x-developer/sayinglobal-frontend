#!/bin/bash

# Setup Admin App (Admin SA)
echo "🚀 Setting up Admin App: Admin SA"

# Build with admin mode
echo "📦 Building Next.js app in export mode..."
NEXT_PUBLIC_APP_MODE=admin npm run build

# Initialize Capacitor if not already initialized
if [ ! -d "android-admin" ] && [ ! -d "ios-admin" ]; then
    echo "🔧 Initializing Capacitor..."
    npx cap init "Admin SA" "com.sayinglobal.admin" --web-dir=out
fi

# Copy capacitor config
echo "📋 Copying Capacitor config..."
cp capacitor.config.admin.ts capacitor.config.ts

# Add platforms if not exists (with different names to avoid conflicts)
if [ ! -d "android-admin" ]; then
    echo "🤖 Adding Android platform..."
    npx cap add android
    # Rename to avoid conflict with user app
    if [ -d "android" ]; then
        mv android android-admin
    fi
fi

if [ ! -d "ios-admin" ]; then
    echo "🍎 Adding iOS platform..."
    npx cap add ios
    # Rename to avoid conflict with user app
    if [ -d "ios" ]; then
        mv ios ios-admin
    fi
fi

# Copy resources
echo "🎨 Copying app resources..."

# Android resources
if [ -d "android-admin" ]; then
    # Copy icons
    mkdir -p android-admin/app/src/main/res/mipmap-hdpi
    mkdir -p android-admin/app/src/main/res/mipmap-xhdpi
    mkdir -p android-admin/app/src/main/res/mipmap-xxhdpi
    mkdir -p android-admin/app/src/main/res/mipmap-xxxhdpi
    
    cp public/icons/admin/drawable-hdpi-icon.png android-admin/app/src/main/res/mipmap-hdpi/ic_launcher.png
    cp public/icons/admin/drawable-xhdpi-icon.png android-admin/app/src/main/res/mipmap-xhdpi/ic_launcher.png
    cp public/icons/admin/drawable-xxhdpi-icon.png android-admin/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
    cp public/icons/admin/drawable-xxxhdpi-icon.png android-admin/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
    
    # Copy splash screens
    mkdir -p android-admin/app/src/main/res/drawable
    mkdir -p android-admin/app/src/main/res/drawable-land-mdpi
    mkdir -p android-admin/app/src/main/res/drawable-land-hdpi
    mkdir -p android-admin/app/src/main/res/drawable-land-xhdpi
    mkdir -p android-admin/app/src/main/res/drawable-land-xxhdpi
    mkdir -p android-admin/app/src/main/res/drawable-land-xxxhdpi
    mkdir -p android-admin/app/src/main/res/drawable-port-mdpi
    mkdir -p android-admin/app/src/main/res/drawable-port-hdpi
    mkdir -p android-admin/app/src/main/res/drawable-port-xhdpi
    mkdir -p android-admin/app/src/main/res/drawable-port-xxhdpi
    mkdir -p android-admin/app/src/main/res/drawable-port-xxxhdpi
    
    cp public/splash/admin/drawable-land-mdpi-screen.png android-admin/app/src/main/res/drawable-land-mdpi/splash.png
    cp public/splash/admin/drawable-land-hdpi-screen.png android-admin/app/src/main/res/drawable-land-hdpi/splash.png
    cp public/splash/admin/drawable-land-xhdpi-screen.png android-admin/app/src/main/res/drawable-land-xhdpi/splash.png
    cp public/splash/admin/drawable-land-xxhdpi-screen.png android-admin/app/src/main/res/drawable-land-xxhdpi/splash.png
    cp public/splash/admin/drawable-land-xxxhdpi-screen.png android-admin/app/src/main/res/drawable-land-xxxhdpi/splash.png
    cp public/splash/admin/drawable-port-mdpi-screen.png android-admin/app/src/main/res/drawable-port-mdpi/splash.png
    cp public/splash/admin/drawable-port-hdpi-screen.png android-admin/app/src/main/res/drawable-port-hdpi/splash.png
    cp public/splash/admin/drawable-port-xhdpi-screen.png android-admin/app/src/main/res/drawable-port-xhdpi/splash.png
    cp public/splash/admin/drawable-port-xxhdpi-screen.png android-admin/app/src/main/res/drawable-port-xxhdpi/splash.png
    cp public/splash/admin/drawable-port-xxxhdpi-screen.png android-admin/app/src/main/res/drawable-port-xxxhdpi/splash.png
    
    echo "✅ Android resources copied"
fi

# iOS resources
if [ -d "ios-admin" ]; then
    # Copy icons
    mkdir -p "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset"
    
    cp public/icons/admin/icon-20.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@1x.png"
    cp public/icons/admin/icon-20@2x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@2x.png"
    cp public/icons/admin/icon-20@3x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@3x.png"
    cp public/icons/admin/icon-29.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@1x.png"
    cp public/icons/admin/icon-29@2x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@2x.png"
    cp public/icons/admin/icon-29@3x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@3x.png"
    cp public/icons/admin/icon-40.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@1x.png"
    cp public/icons/admin/icon-40@2x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@2x.png"
    cp public/icons/admin/icon-40@3x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@3x.png"
    cp public/icons/admin/icon-60@2x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-60x60@2x.png"
    cp public/icons/admin/icon-60@3x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-60x60@3x.png"
    cp public/icons/admin/icon-76.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-76x76@1x.png"
    cp public/icons/admin/icon-76@2x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-76x76@2x.png"
    cp public/icons/admin/icon-83.5@2x.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-83.5x83.5@2x.png"
    cp public/icons/admin/icon-1024.png "ios-admin/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024x1024@1x.png"
    
    # Copy splash screens
    mkdir -p "ios-admin/App/App/Assets.xcassets/Splash.imageset"
    cp public/splash/admin/Default-2436h.png "ios-admin/App/App/Assets.xcassets/Splash.imageset/"
    
    echo "✅ iOS resources copied"
fi

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync

echo "✅ Admin App setup complete!"
echo ""
echo "Next steps:"
echo "  • For Android: npx cap open android-admin"
echo "  • For iOS: npx cap open ios-admin"
