require('dotenv').config();

const gulp = require('gulp');

const cssnano = require('gulp-cssnano');
const clean = require('gulp-clean');
const eslint = require('gulp-eslint');
const gulpIf = require('gulp-if');
const header = require('gulp-header');
const ngAnnotate = require('gulp-ng-annotate');
const ngTemplate = require('gulp-angular-embed-templates');
const replace = require('gulp-replace');
const runSequence = require('run-sequence');
const uglify = require('gulp-uglify');
const useref = require('gulp-useref');

// define the directory paths
const developDir = './client/src';
const releaseDir = './client/dist';


const pkg = require('./package.json');
const banner = [
  '/**',
  ' * <%= pkg.title || pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' * @copyright (c) <%= new Date().getFullYear() %> <%= pkg.author %>',
  ' */',
  ''
].join('\n');


/**
 * Utility function that returns a boolean indicating if a linted file was fixed
 */
const eslintIsFixed = function (file) {
  return file.eslint && file.eslint.fixed;
}

gulp.task('lint', function () {
  return gulp.src(developDir + '/**/*.js')
    .pipe(eslint({
      fix: true
    }))
    .pipe(eslint.format())

    // Attempt to automatically fix errors - on success, overwrite existing files
    .pipe(gulpIf(eslintIsFixed, gulp.dest(developDir)))

    // Stop processing on lint error(s)
    .pipe(eslint.failAfterError())
});

gulp.task('assets:css', function () {
  return gulp.src([
    developDir + '/css/**/*'
  ])

    .pipe(gulp.dest(releaseDir + '/css'))
});

gulp.task('assets:images', function () {
  return gulp.src([
    developDir + '/img/**/*'
  ])

    .pipe(gulp.dest(releaseDir + '/img'))
});

gulp.task('assets:favicons', function () {
  return gulp.src([
    developDir + '/favicon.*'
  ])

    .pipe(gulp.dest(releaseDir))
});

gulp.task('assets', ['assets:css', 'assets:images', 'assets:favicons']);

gulp.task('useref', function () {
  return gulp.src(developDir + '/index.html')

    .pipe(replace(
      "ga('create', 'UA-XXXXX-Y', 'auto');",
      `ga('create', '${process.env.GA_TRACKING_ID}', '${process.env.GA_COOKIE_DOMAIN}');`
    ))

    // gather and build the CSS and JS files
    .pipe(useref({
      searchPath: ['node_modules', developDir]
    }))

    // minify the built CSS files
    .pipe(gulpIf('*.css', cssnano()))

    // minify the built JS files
    .pipe(gulpIf('*.js', uglify({ mangle: false })))

    // move the output to the release directory
    .pipe(gulp.dest(releaseDir))
});

gulp.task('ng:app', function () {
  return gulp.src(releaseDir + '/js/managerisms.min.js')

    // embed the HTML templates directly into the compiled app JS file
    .pipe(ngTemplate({ basePath: developDir + '/' }))

    // inject angular dependencies
    .pipe(ngAnnotate())

    // insert the banner at the top of the file
    .pipe(header(banner, { pkg: pkg }))

    // move the output to the release directory
    .pipe(gulp.dest(releaseDir + '/js'))
});

gulp.task('watch', function () {
  // re-lint on configuration changes
  gulp.watch('./.eslintrc.js', ['lint']);

  // recompile
  gulp.watch(developDir + '/**/*', ['build'])
});

gulp.task('clean', function () {
  return gulp.src(releaseDir + '/**/*', { read: false })

    .pipe(clean())
});

gulp.task('default', function (callback) {
  runSequence('build', callback);
});

gulp.task('build', ['clean'], function (callback) {
  runSequence('lint', 'useref', 'ng:app', 'assets', callback);
});

gulp.task('build-watch', function (callback) {
  runSequence('watch', 'build', callback);
});
