var gulp = require('gulp');
var concat = require('gulp-concat');
var typescript = require('gulp-typescript');
var merge2 = require('merge2');

var paths = {
  app: ['./src/app.ts'],
  scripts: ['./src/www/*.ts'],
  controllers: ['./src/www/controllers/**/*.ts'],
  services: ['./src/www/services/**/*.ts']
};

gulp.task('default', ['app', 'scripts', 'controllers', 'services']);

gulp.task('app', function () {
    var tsResult = gulp.src(paths.app)
        .pipe(typescript({}));
 
    return merge2([
        tsResult.js
        .pipe(concat('app.js'))
        .pipe(gulp.dest('./'))
    ]);
});

gulp.task('scripts', function () {
    var tsResult = gulp.src(paths.scripts)
        .pipe(typescript({}));
 
    return tsResult.js
        .pipe(gulp.dest('./www/js/'));
});

gulp.task('controllers', function () {
    var tsResult = gulp.src(paths.controllers)
        .pipe(typescript({}));
 
    return merge2([
        tsResult.js
        .pipe(concat('controllers.all.js'))
        .pipe(gulp.dest('./www/js/'))
    ]);
});

gulp.task('services', function () {
    var tsResult = gulp.src(paths.services)
        .pipe(typescript({}));
 
    return merge2([
        tsResult.js
        .pipe(concat('services.all.js'))
        .pipe(gulp.dest('./www/js/'))
    ]);
});

gulp.task('watch', function() {
  gulp.watch(paths.app, ['app']);
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.controllers, ['controllers']);
  gulp.watch(paths.services, ['services']);
});
