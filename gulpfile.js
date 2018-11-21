'use strict';

// Increase max listeners for event emitters
require('events').EventEmitter.defaultMaxListeners = 100;

const gulp = require('gulp');
const util = require('./build/lib/util');
const path = require('path');
const compilation = require('./build/lib/compilation');

const outDir = "dist";

// Fast compile for development time
gulp.task('clean-client', util.rimraf(outDir));
gulp.task('compile-client', ['clean-client'], compilation.compileTask('src', outDir, false));
gulp.task('watch-client', ['clean-client'], compilation.watchTask(outDir, false));



// Load all the gulpfiles only if running tasks other than the editor tasks
const build = path.join(__dirname, 'build');
require('glob').sync('gulpfile.*.js', { cwd: build })
	.forEach(f => require(`./build/${f}`));
