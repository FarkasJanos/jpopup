var gulp = require('gulp'),
    del = require('del'),
    assetBuilder = require('asset-builder'),
    minimist = require('minimist'),
    gulpIf = require('gulp-if'),
    scss = require('postcss-scss'),
    sass= require('gulp-sass'),
    cssnano= require('cssnano'),
    plumber = require('gulp-plumber'),
    postcss = require('gulp-postcss'),
    styleLint= require('stylelint'),
    postcssReporter = require('postcss-reporter'),
    lazypipe = require('lazypipe'),
    sourceMaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    mergeStream = require('merge-stream'),
    jshint = require('gulp-jshint'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    runSequence = require('run-sequence'),
    gutil = require('gulp-util'),
    rename = require('gulp-rename');

cli = minimist(process.argv.slice(2));

manifest = assetBuilder('manifest.json');

// Command line option:
//  --fatal=[warning|error|off]
fatalError = cli.production || cli.fatal;

// Handle an error based on its severity level.
// Log all levels, and exit the process for fatal levels.
function handleError(error) {
    gutil.log(error.message);
    if (fatalError) {
        console.log('KILLING PROCESS, SORRY');
        process.exit(1);
    }
}

/**
 * CSS
 */
// Options
const $reporter_options = {
        clearReportedMessages: true
    },
    $postcss_options = {
        syntax: scss
    };

// ### Stylelint
// `gulp stylelint` - Run stylelint on scss
gulp.task('stylelint', function () {
    return gulp.src([manifest.paths.source + '*.scss'])
        .pipe(gulpIf(!cli.production,
            plumber()
        ))
        .pipe(postcss(
            [
                styleLint,
                postcssReporter($reporter_options)
            ],
            $postcss_options
        ));
});

// Options and build function
const $css_options = {
        cssnano: {
            safe: true
        },
        sass: {
            outputStyle: 'nested',
            precision: 5,
            includePaths: ['.'],
            errLogToConsole: !cli.production
        },
        autoPrefixer: {
            browsers: [
                'last 2 versions',
                'android 4'
            ]
        },
        reporter: {
            clearMessages: true
        }
    },
    cssTasks = function (filename) {
        return lazypipe()
            .pipe(function () {
                return gulpIf(!cli.production,
                    plumber()
                );
            })
            .pipe(function () {
                return gulpIf(!cli.production,
                    sourceMaps.init()
                );
            })
            .pipe(function () {
                return gulpIf('*.scss',
                    sass($css_options.sass)
                );
            })
            .pipe(concat, filename)
            .pipe(
                autoprefixer, $css_options.autoPrefixer
            )
            .pipe(function () {
                return gulpIf(cli.production,
                    postcss([
                            cssnano($css_options.cssnano)
                        ]
                    )
                );
            })
            .pipe(function () {
                return gulpIf(cli.production,
                    rename({suffix: '.min'})
                );
            })
            .pipe(postcss, [
                postcssReporter($css_options.reporter)
            ])
            .pipe(function () {
                return gulpIf(!cli.production,
                    sourceMaps.write('.')
                );
            })();
    };

// ### Styles
// `gulp styles` - Compiles, combines, and optimizes Bower CSS and project CSS.
// By default this task will only log a warning if a precompiler error is
// raised. If the `--production` flag is set: this task will fail outright.
gulp.task('styles', ['stylelint'], function () {
    const $merged = mergeStream();

    $merged.on('error', function () {
        this.emit('end');
    });

    manifest.forEachDependency('css', function (dep) {
        const cssTasksInstance = cssTasks(dep.name);

        if (!cli.production) {
            cssTasksInstance.on('error', handleError);
        }

        $merged.add(
            gulp.src(dep.globs)
                .pipe(cssTasksInstance)
        );
    });

    return $merged.pipe(writeToManifest());
});

// Write to rev manifest
// If there are any revisioned files then write them to the rev manifest.
// See https://github.com/sindresorhus/gulp-rev
function writeToManifest () {
    return lazypipe()
        .pipe(gulp.dest, manifest.paths.dist)();
}

/**
 * JS
 */
// Options
const sourceFiles = [
        'bower.json',
        'gulpfile.js'
    ],
    $jsHint_options = {
        esversion: 6
    };

// ### JSHint
// `gulp jshint` - Lints configuration JSON and project JS.
// Error: Cannot find module 'jshint/src/cli'
gulp.task('jshint', function () {
    return gulp.src(sourceFiles.concat(manifest.getProjectGlobs().js))
        .pipe(jshint($jsHint_options))
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(gulpIf(cli.production,
            jshint.reporter('fail')
            )
        );
});

// Build function
const jsTasks = function (filename) {
    return lazypipe()
        .pipe(function () {
            return gulpIf(!cli.production,
                sourceMaps.init()
            );
        })
        .pipe(babel)
        .pipe(concat, filename)
        .pipe(function () {
            return gulpIf(cli.production,
                uglify()
            );
        })
        .pipe(function () {
            return gulpIf(cli.production,
                rename({suffix: '.min'})
            );
        })
        .pipe(function () {
            return gulpIf(!cli.production,
                sourceMaps.write('.')
            );
        })();
};

// ### Scripts
// `gulp scripts` - Runs JSHint and then compiles, combines,
// and optimizes Bower JS and project JS.
gulp.task('scripts', ['jshint'], function () {
    const $merged = mergeStream();

    $merged.on('error', function () {
        this.emit('end');
    });

    manifest.forEachDependency('js', function (dep) {
        $merged.add(
            gulp.src(dep.globs)
                .pipe(jsTasks(dep.name))
                .on('error', handleError)
        );
    });
    return $merged.pipe(writeToManifest());
});

// ### Clean
// `gulp clean` - Deletes the dist folder entirely.
gulp.task('clean', function (callback) {
    return del(manifest.paths.dist, callback);
});

gulp.task('build', ['clean'], function (callback) {
    runSequence('styles', 'scripts', callback);
});

gulp.task('default', ['build'], function () {
});
