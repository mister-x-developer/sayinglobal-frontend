const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes for different platforms
const iconSizes = {
  android: [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 72, name: 'drawable-hdpi-icon.png' },
    { size: 96, name: 'drawable-xhdpi-icon.png' },
    { size: 144, name: 'drawable-xxhdpi-icon.png' },
    { size: 192, name: 'drawable-xxxhdpi-icon.png' },
  ],
  ios: [
    { size: 20, name: 'icon-20.png' },
    { size: 40, name: 'icon-20@2x.png' },
    { size: 60, name: 'icon-20@3x.png' },
    { size: 29, name: 'icon-29.png' },
    { size: 58, name: 'icon-29@2x.png' },
    { size: 87, name: 'icon-29@3x.png' },
    { size: 40, name: 'icon-40.png' },
    { size: 80, name: 'icon-40@2x.png' },
    { size: 120, name: 'icon-40@3x.png' },
    { size: 50, name: 'icon-50.png' },
    { size: 100, name: 'icon-50@2x.png' },
    { size: 60, name: 'icon-60.png' },
    { size: 120, name: 'icon-60@2x.png' },
    { size: 180, name: 'icon-60@3x.png' },
    { size: 72, name: 'icon-72.png' },
    { size: 144, name: 'icon-72@2x.png' },
    { size: 76, name: 'icon-76.png' },
    { size: 152, name: 'icon-76@2x.png' },
    { size: 167, name: 'icon-83.5@2x.png' },
    { size: 1024, name: 'icon-1024.png' },
  ],
};

// Splash screen sizes
const splashSizes = {
  android: [
    { width: 480, height: 800, name: 'drawable-port-mdpi-screen.png' },
    { width: 800, height: 480, name: 'drawable-land-mdpi-screen.png' },
    { width: 720, height: 1280, name: 'drawable-port-hdpi-screen.png' },
    { width: 1280, height: 720, name: 'drawable-land-hdpi-screen.png' },
    { width: 1080, height: 1920, name: 'drawable-port-xhdpi-screen.png' },
    { width: 1920, height: 1080, name: 'drawable-land-xhdpi-screen.png' },
    { width: 1440, height: 2560, name: 'drawable-port-xxhdpi-screen.png' },
    { width: 2560, height: 1440, name: 'drawable-land-xxhdpi-screen.png' },
    { width: 1920, height: 3840, name: 'drawable-port-xxxhdpi-screen.png' },
    { width: 3840, height: 1920, name: 'drawable-land-xxxhdpi-screen.png' },
  ],
  ios: [
    { width: 640, height: 1136, name: 'Default-568h@2x~iphone.png' },
    { width: 750, height: 1334, name: 'Default-667h.png' },
    { width: 1242, height: 2208, name: 'Default-736h.png' },
    { width: 2208, height: 1242, name: 'Default-Landscape-736h.png' },
    { width: 1125, height: 2436, name: 'Default-2436h.png' },
    { width: 1242, height: 2688, name: 'Default-2688h.png' },
    { width: 828, height: 1792, name: 'Default-1792h.png' },
    { width: 1536, height: 2048, name: 'Default-Portrait@2x~ipad.png' },
    { width: 2048, height: 1536, name: 'Default-Landscape@2x~ipad.png' },
  ],
};

async function generateIcons(logoPath, outputDir, backgroundColor = '#10b981') {
  console.log(`Generating icons in ${outputDir}...`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const logo = sharp(logoPath);

  // Generate Android icons
  for (const icon of iconSizes.android) {
    await logo
      .resize(icon.size, icon.size, { fit: 'contain', background: { r: 16, g: 185, b: 129, alpha: 1 } })
      .png()
      .toFile(path.join(outputDir, icon.name));
    console.log(`✓ ${icon.name}`);
  }

  // Generate iOS icons
  for (const icon of iconSizes.ios) {
    await logo
      .resize(icon.size, icon.size, { fit: 'contain', background: { r: 16, g: 185, b: 129, alpha: 1 } })
      .png()
      .toFile(path.join(outputDir, icon.name));
    console.log(`✓ ${icon.name}`);
  }
}

async function generateSplashScreens(logoPath, outputDir, backgroundColor = '#10b981') {
  console.log(`Generating splash screens in ${outputDir}...`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const logo = sharp(logoPath);
  const logoBuffer = await logo.toBuffer();
  const logoMetadata = await sharp(logoBuffer).metadata();

  // Parse background color
  const bgColor = backgroundColor;
  let bgRgb = { r: 16, g: 185, b: 129 };
  if (bgColor.startsWith('#')) {
    const hex = bgColor.slice(1);
    bgRgb = {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // Generate Android splash screens
  for (const splash of splashSizes.android) {
    const logoSize = Math.min(splash.width, splash.height) * 0.4;
    const resizedLogo = await sharp(logoBuffer)
      .resize(Math.round(logoSize), Math.round(logoSize), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 3,
        background: bgRgb,
      },
    })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(outputDir, splash.name));
    console.log(`✓ ${splash.name}`);
  }

  // Generate iOS splash screens
  for (const splash of splashSizes.ios) {
    const logoSize = Math.min(splash.width, splash.height) * 0.4;
    const resizedLogo = await sharp(logoBuffer)
      .resize(Math.round(logoSize), Math.round(logoSize), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 3,
        background: bgRgb,
      },
    })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(outputDir, splash.name));
    console.log(`✓ ${splash.name}`);
  }
}

async function generatePWAIcons(logoPath, outputDir) {
  console.log(`Generating PWA icons in ${outputDir}...`);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const logo = sharp(logoPath);
  
  const pwaIconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  for (const size of pwaIconSizes) {
    await logo
      .resize(size, size, { fit: 'contain', background: { r: 16, g: 185, b: 129, alpha: 1 } })
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`✓ icon-${size}x${size}.png`);
  }
}

async function main() {
  const logoPath = path.join(__dirname, '../../logo.png');
  
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Logo file not found at:', logoPath);
    process.exit(1);
  }

  console.log('🎨 Starting mobile asset generation...\n');

  // Generate user app assets
  console.log('📱 User App (Sayin Global)');
  await generateIcons(logoPath, path.join(__dirname, '../public/icons/user'), '#10b981');
  await generateSplashScreens(logoPath, path.join(__dirname, '../public/splash/user'), '#10b981');

  // Generate PWA icons
  console.log('\n🌐 PWA Icons');
  await generatePWAIcons(logoPath, path.join(__dirname, '../public/icons/pwa'));

  console.log('\n✅ All assets generated successfully!');
}

main().catch(console.error);
