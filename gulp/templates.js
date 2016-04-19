var gulp = require('gulp');
var run = require('gulp-run');
var clean = require('gulp-clean');

gulp.task('clean-templates', function () {
  return gulp.src([
      'dist/templates',
      'dist/cordova-templates'
    ], {read: false})
    .pipe(clean());
});

gulp.task('templates', ['clean-templates', 'cordova-templates'], function () {
  return run('python render_templates.py dist/templates').exec();
});
gulp.task('cordova-templates', ['clean-templates'], function () {
  return run('python render_templates.py -a dist/cordova-templates').exec();
});
