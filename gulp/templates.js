var gulp = require('gulp');
var run = require('gulp-run');
var clean = require('gulp-clean');

gulp.task('clean-templates', function () {
  return gulp.src('dist/templates', {read: false})
    .pipe(clean());
});

gulp.task('templates', ['clean-templates'], function () {
  return run('python render_templates.py dist/templates').exec();
});
