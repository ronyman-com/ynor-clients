const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class ShortcutGenerator {
  constructor() {
    this.iconSizes = {
      android: [{ size: 192, name: 'icon-192x192.png' }],
      ios: [
        { size: 180, name: 'apple-touch-icon-180x180.png' }
      ],
      desktop: [
        { size: 64, name: 'icon-64x64.png' },
        { size: 128, name: 'icon-128x128.png' }
      ]
    };
  }

  async generateManifest(shortcutData) {
    const manifest = {
      name: shortcutData.name,
      short_name: shortcutData.shortName || shortcutData.name,
      start_url: shortcutData.url,
      display: 'standalone',
      background_color: shortcutData.backgroundColor || '#ffffff',
      theme_color: shortcutData.themeColor || '#000000',
      icons: []
    };

    // Generate icons for all platforms
    const iconDir = path.join('public', 'icons', shortcutData.shortcutId);
    await fs.promises.mkdir(iconDir, { recursive: true });

    for (const platform in this.iconSizes) {
      for (const icon of this.iconSizes[platform]) {
        const iconPath = path.join(iconDir, icon.name);
        await this.resizeImage(shortcutData.icon.path, iconPath, icon.size);
        manifest.icons.push({
          src: `/icons/${shortcutData.shortcutId}/${icon.name}`,
          sizes: `${icon.size}x${icon.size}`,
          type: 'image/png'
        });
      }
    }

    return manifest;
  }

  async resizeImage(inputPath, outputPath, size) {
    await sharp(inputPath)
      .resize(size, size)
      .toFile(outputPath);
  }

  generateHTML(shortcutData) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${shortcutData.name}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="manifest" href="/manifest.json">
          <meta name="theme-color" content="${shortcutData.themeColor || '#000000'}">
          <meta name="apple-mobile-web-app-capable" content="yes">
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
          <meta http-equiv="refresh" content="0; url=${shortcutData.url}">
        </head>
        <body>
          <script>
            window.location.href = "${shortcutData.url}";
          </script>
        </body>
      </html>
    `;
  }
}

module.exports = new ShortcutGenerator();