var gulp = require('gulp');

gulp.task('listen', function () {
  ignoreENOENT(gulp.watch('static/css/**/*.css', ['css']));
  ignoreENOENT(gulp.watch('static/js/**/*.js', ['js']));
  ignoreENOENT(gulp.watch('templates/**/*.html', ['templates']));
});

function ignoreENOENT (gw) {
  gw.on('error', function(error) {
    // silently catch 'ENOENT' error typically caused by renaming watched folders
    if (error.code === 'ENOENT') {
      return;
    }
  })
}
