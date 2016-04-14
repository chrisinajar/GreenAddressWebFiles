var gulp = require('gulp');
var clean = require('gulp-clean');

gulp.task('clean-assets', function () {
  return gulp.src([
      'dist/static/fonts/',
      'dist/static/img/',
      'dist/static/sound/'
    ], {read: false})
    .pipe(clean());
});

gulp.task('assets', ['clean-assets'], function () {
  return gulp.src([
      'static/fonts/**/*',
      'static/img/**/*',
      'static/sound/**/*'
    ], {base: '.'})
    .pipe(gulp.dest('dist/'));
});
