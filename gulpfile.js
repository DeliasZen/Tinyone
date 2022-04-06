const { src, dest, task, watch, series, parallel } = require('gulp')
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const postcss = require('gulp-postcss');
const csscomb = require('gulp-csscomb');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const sortCSSmq = require('sort-css-media-queries');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const del = require('del');

const PATH = {
  scssFile: './assets/scss/style.scss',
  scssFiles: './assets/scss/**/*.scss',
  scssFolder: './assets/scss',
  cssMinFiles: './assets/css/**/*.min.css',
  cssFolder: './assets/css',
  htmlFiles: './*.html',
  jsFiles: [
    './assets/js/**/*.js',
    '!./assets/js/**/*.min.js',
  ],
  jsMinFiles: './assets/js/**/*.min.js',
  jsFolder: './assets/js',
  jsBundleName: 'bundle.js',
  buildFolder: 'dist'
};

const PLUGINS = [
  autoprefixer({
    overrideBrowserslist: ['last 5 versions', '> 1%']
  }),
  mqpacker({ sort: sortCSSmq })
];

function scss() {
  return src(PATH.scssFile)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(PLUGINS))
    .pipe(csscomb())
    .pipe(dest(PATH.cssFolder))
    .pipe(browserSync.stream());
};

function scssDev() {
  return src(PATH.scssFile, { sourcemaps: true })
    .pipe(sass().on('error', sass.logError))
    .pipe(dest(PATH.cssFolder, { sourcemaps: true }))
    .pipe(browserSync.stream());
};

function scssMin() {
  const pluginsExtended = [...PLUGINS, cssnano({ preset: 'default' })]

  return src(PATH.scssFile)
    .pipe(sass().on('error', sass.logError))
    .pipe(csscomb())
    .pipe(postcss(pluginsExtended))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(PATH.cssFolder))
};

function comb() {
  return src(PATH.scssFiles)
    .pipe(csscomb())
    .pipe(dest(PATH.scssFolder))
};

function syncInit() {
  browserSync.init({
    server: './'
  });
};

async function sync() {
  browserSync.reload()
};

function watchFiles() {
  syncInit();
  watch(PATH.scssFiles, series(scss, scssMin));
  watch(PATH.htmlFiles, sync);
  watch(PATH.jsFiles, sync);
};

function uglifyJS() {
  return src(PATH.jsFiles)
    .pipe(terser({
      toplevel: true,
      output: { quote_style: 3 }
    }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(PATH.jsFolder))
};

function concatJS() {
  return src(PATH.jsFiles)
    .pipe(concat(PATH.jsBundleName))
    .pipe(dest(PATH.jsFolder))
};

function buildJS() {
  return src(PATH.jsMinFiles)
    .pipe(dest(PATH.buildFolder + '/js'))
};

function buildHTML() {
  return src(PATH.htmlFiles)
    .pipe(dest(PATH.buildFolder + '/templates'))
};

function buildCSS() {
  return src(PATH.cssMinFiles)
    .pipe(dest(PATH.buildFolder + '/css'))
}

async function clearFolder() {
  await del(PATH.buildFolder, { force: true })
  return true
};

task('scss', series(scss, scssMin));
task('min', scssMin);
task('dev', scssDev);
task('comb', comb);
task('watch', watchFiles);

task('uglify', uglifyJS);
task('concat', concatJS);

task('build', series(clearFolder, parallel(buildJS, buildHTML, buildCSS)));