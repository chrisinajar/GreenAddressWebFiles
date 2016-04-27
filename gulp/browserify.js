var gulp = require('gulp');
var merge = require('merge-stream');
var browserify = require('gulp-browserify');
var clean = require('gulp-clean');
var rename = require('gulp-rename');

gulp.task('clean-js', function () {
  return gulp.src(['build/static/js/'], {read: false})
    .pipe(clean());
});

gulp.task('browserify', ['clean-js'], function () {
  // Single entry point to browserify
  var browserified = gulp.src('static/js/index.js')
    .pipe(browserify({
      insertGlobals: true
    }))
    .pipe(gulp.dest('build/static/js/'));

  var external = gulp.src('static/external/**/*')
    .pipe(gulp.dest('build/static/js/'));

  var mnonic = gulp.src(['static/js/greenwallet/mnemonics/**/*'])
    .pipe(gulp.dest('build/static/js/greenwallet/mnemonics/'));
    
  var signupWorker = gulp.src(['static/js/greenwallet/signup/**/*'])
    .pipe(gulp.dest('build/static/js/greenwallet/signup/'));

  return merge(browserified, external, mnonic, signupWorker);
});
