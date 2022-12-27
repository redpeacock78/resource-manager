"use strict";

import gulp from "gulp";
import babel from "gulp-babel";

const buildJs = () =>
  gulp
    .src(["./src/**/*.es", "!./node_modules{,/**}", "!./gulpfile.babel.js"])
    .pipe(babel())
    .pipe(gulp.dest("./dist/"));

const build = gulp.task("build", buildJs);

const watchJs = (done) => {
  gulp.watch("src/**/*.es", buildJs);
  done();
};

const watchGulpfile = (done) => {
  gulp.watch("gulpfile.babel.js", buildJs);
  done();
};

const watch = (done) => {
  watchJs();
  watchGulpfile();
  done();
};

exports.build = build;
exports.buildJs = buildJs;
exports.watch = watch;
exports.watchJs = watchJs;
exports.watchGulpfile = watchGulpfile;
