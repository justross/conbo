const gulp = require('gulp');
const eslint = require('gulp-eslint');

// Create an electron-connect server to enable reloading
const electron = require('electron-connect').server.create();

gulp.task('lint', () => {
  return gulp.src('./app/js/*.js').pipe(eslint({
    'extends': 'eslint:recommended',
    'rules': {
      'quotes': [1, 'single'],
      'semi': [1, 'always']
    }
  }))
    .pipe(eslint.format())
});

gulp.task('start', () => {
  electron.start();
  //Watch js files and restart Electron if they change
  gulp.watch(['./app/js/*.js'], electron.restart);
  gulp.watch(['./app/js/*.js'], ['lint']);
  //watch css files, but only reload (no restart necessary)
  gulp.watch(['./app/css/*.css'], electron.reload);
  //watch html
  gulp.watch(['./index.html'], electron.reload);
});