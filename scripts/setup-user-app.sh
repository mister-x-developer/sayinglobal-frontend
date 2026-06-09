#!/bin/bash

# Setup User App (Sayin Global)
echo "🚀 Setting up User App: Sayin Global"

# Build with user mode
echo "📦 Building Next.js app in export mode..."
NEXT_PUBLIC_APP_MODE=user npm run build

# Initialize Capacitor if not already initialized
if [ ! -d "android" ] && [ ! -d "ios" ]; then
    echo "🔧 Initializing Capacitor..."
    npx cap init "Sayin Global" "com.sayinglobal.user" --web-dir=out
fi

# Copy capacitor config
echo "📋 Copying Capacitor config..."
cp capacitor.config.user.ts capacitor.config.ts

# Add platforms if not exists
if [ ! -d "android" ]; then
    echo "🤖 Adding Android platform..."
    npx cap add android
fi

if [ ! -d "ios" ]; then
    echo "🍎 Adding iOS platform..."
    npx cap add ios
fi

# Copy resources
echo "🎨 Copying app resources..."

# Android resources
if [ -d "android" ]; then
    # Copy icons
    mkdir -p android/app/src/main/res/mipmap-hdpi
    mkdir -p android/app/src/main/res/mipmap-xhdpi
    mkdir -p android/app/src/main/res/mipmap-xxhdpi
    mkdir -p android/app/src/main/res/mipmap-xxxhdpi
    
    cp public/icons/user/drawable-hdpi-icon.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
    cp public/icons/user/drawable-xhdpi-icon.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
    cp public/icons/user/drawable-xxhdpi-icon.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
    cp public/icons/user/drawable-xxxhdpi-icon.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
    
    # Copy splash screens
    mkdir -p android/app/src/main/res/drawable
    mkdir -p android/app/src/main/res/drawable-land-mdpi
    mkdir -p android/app/src/main/res/drawable-land-hdpi
    mkdir -p android/app/src/main/res/drawable-land-xhdpi
    mkdir -p android/app/src/main/res/drawable-land-xxhdpi
    mkdir -p android/app/src/main/res/drawable-land-xxxhdpi
    mkdir -p android/app/src/main/res/drawable-port-mdpi
    mkdir -p android/app/src/main/res/drawable-port-hdpi
    mkdir -p android/app/src/main/res/drawable-port-xhdpi
    mkdir -p android/app/src/main/res/drawable-port-xxhdpi
    mkdir -p android/app/src/main/res/drawable-port-xxxhdpi
    
    cp public/splash/user/drawable-land-mdpi-screen.png android/app/src/main/res/drawable-land-mdpi/splash.png
    cp public/splash/user/drawable-land-hdpi-screen.png android/app/src/main/res/drawable-land-hdpi/splash.png
    cp public/splash/user/drawable-land-xhdpi-screen.png android/app/src/main/res/drawable-land-xhdpi/splash.png
    cp public/splash/user/drawable-land-xxhdpi-screen.png android/app/src/main/res/drawable-land-xxhdpi/splash.png
    cp public/splash/user/drawable-land-xxxhdpi-screen.png android/app/src/main/res/drawable-land-xxxhdpi/splash.png
    cp public/splash/user/drawable-port-mdpi-screen.png android/app/src/main/res/drawable-port-mdpi/splash.png
    cp public/splash/user/drawable-port-hdpi-screen.png android/app/src/main/res/drawable-port-hdpi/splash.png
    cp public/splash/user/drawable-port-xhdpi-screen.png android/app/src/main/res/drawable-port-xhdpi/splash.png
    cp public/splash/user/drawable-port-xxhdpi-screen.png android/app/src/main/res/drawable-port-xxhdpi/splash.png
    cp public/splash/user/drawable-port-xxxhdpi-screen.png android/app/src/main/res/drawable-port-xxxhdpi/splash.png
    
    echo "✅ Android resources copied"
fi

# iOS resources
if [ -d "ios" ]; then
    # Copy icons
    mkdir -p "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    
    cp public/icons/user/icon-20.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@1x.png"
    cp public/icons/user/icon-20@2x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@2x.png"
    cp public/icons/user/icon-20@3x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@3x.png"
    cp public/icons/user/icon-29.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@1x.png"
    cp public/icons/user/icon-29@2x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@2x.png"
    cp public/icons/user/icon-29@3x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@3x.png"
    cp public/icons/user/icon-40.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@1x.png"
    cp public/icons/user/icon-40@2x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@2x.png"
    cp public/icons/user/icon-40@3x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@3x.png"
    cp public/icons/user/icon-60@2x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-60x60@2x.png"
    cp public/icons/user/icon-60@3x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-60x60@3x.png"
    cp public/icons/user/icon-76.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-76x76@1x.png"
    cp public/icons/user/icon-76@2x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-76x76@2x.png"
    cp public/icons/user/icon-83.5@2x.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-83.5x83.5@2x.png"
    cp public/icons/user/icon-1024.png "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024x1024@1x.png"
    
    # Copy splash screens
    mkdir -p "ios/App/App/Assets.xcassets/Splash.imageset"
    cp public/splash/user/Default-2436h.png "ios/App/App/Assets.xcassets/Splash.imageset/"
    
    echo "✅ iOS resources copied"
fi

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync

echo "✅ User App setup complete!"
echo ""
echo "Next steps:"
echo "  • For Android: npm run cap:open:android"
echo "  • For iOS: npm run cap:open:ios"
