const { src, dest, watch, series, parallel } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const rename = require('gulp-rename');
const server = require('browser-sync').create();
const imageMin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgstore = require('gulp-svgstore');
const pipeline = require('readable-stream').pipeline;
const uglify = require('gulp-uglify-es').default;
const del = require('del');


// add task HTML-include
function html() {
    return src('source/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(dest('build/'))
}

function css() {
    return src('source/scss/style.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(csso())
        .pipe(rename('style.min.css'))
        .pipe(sourcemaps.write('./'))
        .pipe(dest('build/css'))
}

function cssNomin() {
    return src('source/scss/style.scss')
        .pipe(plumber())
        .pipe(sass())
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(dest('build/css'))
}

function serve() {
    server.init({
        server: "build/",
        notify: false,
        open: true,
        cors: true,
        ui: false
    });

    watch("source/scss/**/*.scss", series(css, cssNomin, refresh));
    watch("source/*.html", series(html, refresh));
    watch("source/js/*.js", series(js, refresh));
    watch("source/img/icon-*.svg", series(sprite, refresh));
    watch("source/img/**/*.{png,jpeg,jpg}", series(images, getWebp, refresh));

}

function refresh(done) {
    server.reload();
    done();
}

function images() {
    return src('source/img/**/*.{png,jpeg,jpg}')
        .pipe(imageMin([
            imageMin.optipng({ optimizationLevel: 3 }),
            imageMin.mozjpeg({ progressive: true })
        ]))
        .pipe(dest('build/img'))
}

function getWebp() {
    return src('build/img/**/*.{png,jpeg,jpg}')
        .pipe(webp({ quality: 90 }))
        .pipe(dest('build/img'))
}

// add task AVIF

function sprite() {
    return src('source/img/icon-*.svg')
        .pipe(imageMin([imageMin.svgo()]))
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename('sprite.svg'))
        .pipe(dest('build/img'))
}

function copy() {
    return src([
        "source/fonts/**/*",
        "source/js/vendors/*",
        "!source/img/*",
        "!source/img/icon-*.svg",
        "source/bg/*",
        "source/*.ico*"
    ], {
        base: "source"
    })
        .pipe(dest('build'))
}

function js() {
    return pipeline(
        src('source/js/*.js'),
        sourcemaps.init(),
        uglify(),
        sourcemaps.write("."),
        rename({ suffix: ".min" }),
        dest("build/js")
    )
}

function clean() {
    return del('build')
}

exports.build = series(
    clean,
    images,
    getWebp,
    parallel(
        copy,
        html,
        css,
        cssNomin,
        sprite,
        js
    )
);
exports.start = series(
    series(
        clean,
        images,
        getWebp,
        parallel(
            copy,
            html,
            css,
            cssNomin,
            sprite,
            js
        )
    ),
    serve
);
// exports.serve = serve;
// exports.images = images;
// exports.getWebp = getWebp;
// exports.sprite = sprite;
// exports.copy = copy;
// exports.js = js;
// exports.html = html;
// exports.css = css;
// exports['css-nomin'] = cssNomin;
// exports.refresh = refresh;