const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');
const chokidar = require('chokidar');

// Path configurations
const PATHS = {
  templates: path.join(__dirname, '../../../templates'),
  distTemplates: path.join(__dirname, '../../../dist/templates'), // Added dist templates path
  public: path.join(__dirname, '../../../public'),
  distPublic: path.join(__dirname, '../../../dist/public'), // Added dist public path
  contents: path.join(__dirname, '../../../templates/contents.json')
};

// Default content structure
const DEFAULT_CONTENTS = {
  routes: [],
  assets: {
    layoutsCss: [],
    publicCss: [],
    layoutsJs: [],
    publicJs: [],
    images: []
  },
  lastUpdated: new Date().toISOString()
};

// Helper function to scan files
async function scanFiles(pattern, basePath) {
  try {
    const files = (await glob(pattern, { 
      cwd: basePath,
      nodir: true,
      absolute: false
    })) || [];

    if (!Array.isArray(files)) {
      console.warn(`Expected array but got ${typeof files} for pattern ${pattern}`);
      return [];
    }

    return files.map(file => {
      try {
        const relativePath = path.relative(basePath, path.join(basePath, file));
        return `/${relativePath.replace(/\\/g, '/')}`;
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error(`Error scanning ${pattern}:`, error);
    return [];
  }
}

// Scan all assets - modified to check both src and dist
async function scanAssets() {
  const isProduction = process.env.NODE_ENV === 'production';
  const assetsPath = isProduction ? PATHS.distPublic : PATHS.public;
  const templatesPath = isProduction ? PATHS.distTemplates : PATHS.templates;

  return {
    layoutsCss: await scanFiles('layouts/**/inc/css/*.css', templatesPath),
    publicCss: await scanFiles('assets/css/*.css', assetsPath),
    layoutsJs: await scanFiles('layouts/**/inc/js/*.js', templatesPath),
    publicJs: await scanFiles('js/*.js', assetsPath),
    images: await scanFiles('assets/images/*.{png,jpg,jpeg,gif,svg}', assetsPath)
  };
}
// Improved template scanner that handles all layouts
// In scanTemplates(), ensure paths are consistent
async function scanTemplates() {
  const isProduction = process.env.NODE_ENV === 'production';
  const templatesPath = isProduction ? PATHS.distTemplates : PATHS.templates;
  const extension = isProduction ? 'html' : 'ejs';
  const routes = [];
  const layoutsPath = path.join(templatesPath, 'layouts');
  
  if (!await fs.pathExists(layoutsPath)) {
    console.warn(`⚠️ Layouts directory not found: ${layoutsPath}`);
    return routes;
  }

  try {
    const layouts = await fs.readdir(layoutsPath);
    
    for (const layout of layouts) {
      const pagesPath = path.join(layoutsPath, layout, 'pages');
      
      if (await fs.pathExists(pagesPath)) {
        const pages = await fs.readdir(pagesPath);
        
        for (const page of pages) {
          if (page.endsWith(`.${extension}`)) {
            const routeName = page.replace(`.${extension}`, '');
            const templatePath = path.join('layouts', layout, 'pages', routeName);
            
            routes.push({
              path: `/${routeName}`,
              layout: layout,
              template: templatePath.replace(/\\/g, '/'),
              metadata: { requiresAuth: false }
            });

            // Special case for index.html in production
            if (isProduction && routeName === 'index') {
              routes.push({
                path: '/',
                layout: layout,
                template: templatePath.replace(/\\/g, '/'),
                metadata: { requiresAuth: false }
              });
            }
          }
        }
      }
    }
    
    return routes;
  } catch (error) {
    console.error('❌ Error scanning templates:', error);
    return [];
  }
}

// Main content generator
async function generateContents() {
  try {
    console.log('🔄 Generating contents...');
    
    const [routes, assets] = await Promise.all([
      scanTemplates(),
      scanAssets()
    ]);

    // Add root path that points to default layout
    const defaultRoute = routes.find(r => r.path === '/default');
    if (defaultRoute) {
      routes.unshift({
        path: '/',
        layout: 'default',
        template: defaultRoute.template,
        metadata: { requiresAuth: false }
      });
    } else if (routes.length > 0) {
      // Fallback to first route if no /default exists
      routes.unshift({
        path: '/',
        layout: routes[0].layout,
        template: routes[0].template,
        metadata: { requiresAuth: false }
      });
    }

    const contents = {
      routes,
      assets,
      lastUpdated: new Date().toISOString()
    };

    await fs.writeJson(PATHS.contents, contents, { spaces: 2 });
    console.log('✅ Contents generated successfully');
    return contents;
  } catch (error) {
    console.error('❌ Contents generation failed:', error);
    return DEFAULT_CONTENTS;
  }
}

// File watcher with enhanced logging
function watchForChanges() {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('👀 Watching for template changes...');
  
  const watcher = chokidar.watch([
    path.join(PATHS.templates, '**/*.ejs'),
    path.join(PATHS.public, '**/*.{css,js,png,jpg,jpeg,gif,svg}')
  ], {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  const debouncedGenerate = debounce(generateContents, 1000);
  
  watcher
    .on('add', path => {
      console.log(`➕ File added: ${path}`);
      debouncedGenerate();
    })
    .on('change', path => {
      console.log(`🔄 File changed: ${path}`);
      debouncedGenerate();
    })
    .on('unlink', path => {
      console.log(`➖ File removed: ${path}`);
      debouncedGenerate();
    })
    .on('error', error => console.error(`❌ Watcher error: ${error}`))
    .on('ready', () => console.log('✔️ File watcher ready'));

  return watcher;
}

// Helper functions
function debounce(func, wait) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
}

const getCacheBustingUrl = (url) => `${url}?v=${Date.now()}`;

// Initialize
generateContents();

// Production updates
if (process.env.NODE_ENV === 'production') {
  setInterval(generateContents, 15 * 60 * 1000); // Update every 15 minutes
}

module.exports = {
  generateContents,
  watchForChanges,
  DEFAULT_CONTENTS,
  getCacheBustingUrl
};