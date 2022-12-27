"use strict";

import path from "path";
import gulp from "gulp";
import babel from "gulp-babel";

const buildJs = () => {
  const src = path.resolve("src");
  const dist = path.resolve("dist");

  return gulp
    .src(path.join(src, "**", "*.es"))
    .pipe(babel())
    .pipe(gulp.dest(dist));
};

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
