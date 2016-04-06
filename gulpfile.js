/// <reference path="./typings/bundle.d.ts" />

const fs = require('fs');
const gulp = require('gulp');
const glob = require('glob');
const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const es = require('event-stream');
const stylus = require('gulp-stylus');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');

gulp.task('build', [
	'build:ts',
	'copy:bower_components',
	'build:frontside-scripts',
	'build:frontside-styles',
	'build-copy'
]);

const project = ts.createProject('tsconfig.json', {
	typescript: require('typescript')
});

function buildTypeScript() {
	return project.src().pipe(ts(project));
}

gulp.task('build:ts', () =>
	buildTypeScript()
		.pipe(gulp.dest('./built/'))
);

gulp.task('build:public-config', ['build:ts'], done => {
	const config = require('./built/config').default;
	fs.mkdir('./built/_', e => {
		if (!e || (e && e.code === 'EEXIST')) {
			fs.writeFile('./built/_/config.json', JSON.stringify(config.public), done);
		} else {
			console.error(e);
		}
	});
});

gulp.task('copy:bower_components', () => {
	return gulp.src('./bower_components/**/*')
		.pipe(gulp.dest('./built/resources/bower_components/'));
});

gulp.task('build:frontside-scripts', ['build:public-config'], done => {
	glob('./src/web/**/*.ls', (err, files) => {
		const tasks = files.map(entry => {
			return browserify({
				entries: [entry],
				paths: [
					__dirname + '/built/_'
				]
			})
				.bundle()
				.pipe(source(entry.replace('src/web', 'resources').replace('.ls', '.js')))
				.pipe(buffer())
				.pipe(uglify())
				.pipe(gulp.dest('./built'));
		});
		es.merge(tasks).on('end', done);
	});
});

gulp.task('build:frontside-styles', ['copy:bower_components'], () => {
	return gulp.src('./src/web/**/*.styl')
		.pipe(stylus())
		.pipe(cssnano({
			safe: true // 高度な圧縮は無効にする (一部デザインが不適切になる場合があるため)
		}))
		.pipe(gulp.dest('./built/resources/'));
});

gulp.task('build-copy', ['build:ts', 'build:frontside-scripts', 'build:frontside-styles'], () => {
	return es.merge(
		gulp.src([
			'./src/web/**/*.jade'
		]).pipe(gulp.dest('./built/web/')),
		gulp.src('./src/resources/**/*').pipe(gulp.dest('./built/resources/')),
		gulp.src([
			'./src/web/**/*',
			'!./src/web/**/*.js',
			'!./src/web/**/*.ts',
			'!./src/web/**/*.ls'
		]).pipe(gulp.dest('./built/resources/'))
	);
});

gulp.task('lint', () =>
	gulp.src('./src/**/*.ts')
		.pipe(tslint({
			tslint: require('tslint')
		}))
		.pipe(tslint.report('verbose'))
);
