import * as gulp from 'gulp';
import transpile from './transpile';
import processMarkup from './process-markup';
import processCSS from './process-css';
import * as del from 'del';
import * as vinylPaths from 'vinyl-paths';
import * as rev from 'gulp-rev';
import * as revReplace from 'gulp-rev-replace';
import * as uglify from 'gulp-uglify';
import * as minifyHtml from 'gulp-minify-html';
import * as usemin from 'gulp-usemin';
import {build, CLIOptions} from 'aurelia-cli';
import * as project from '../aurelia.json';

const env = CLIOptions.getEnvironment();

export default gulp.series(
    readProjectConfiguration,
    gulp.parallel(
        transpile,
        processMarkup,
        processCSS
    ),
    writeBundles,
    cleanExport,
    copyImages,
    copyTheme,
    copyMisc,
    revAppBundle,
    revVendorBundle,
    //replaceAppBundleRef
);

function readProjectConfiguration() {
    return build.src(project);
}

function writeBundles() {
    return build.dest();
}

function cleanExport() {
    if(env !== 'prod') {
        console.log(`Clean not required for ${env}.`);
        return Promise.resolve();
    }

    console.log('Clean complete');

    return gulp.src([project.paths.export])
        .pipe(vinylPaths(del));
}
function copyImages() {
    return gulp.src(project.paths.assets.images)
        .pipe(gulp.dest(project.paths.export + 'images/'));
}

function copyTheme() {
    return gulp.src(project.paths.assets.theme)
        .pipe(gulp.dest(project.paths.export + 'themes/'));
}

function copyMisc() {
    return gulp.src(project.paths.assets.misc)
        .pipe(gulp.dest(project.paths.export))
}

function revAppBundle() {
    // how do I use the 'stage & prod' values from the
    if(env !== 'prod') {
        console.log(`Rev not required for ${env}.`);
        return Promise.resolve();
    }

    return gulp.src(project.paths['app-bundle'])
        .pipe(rev())
        // .pipe(gulp.dest(project.paths.export + 'scripts/'))
        // .pipe(rev.manifest())
        .pipe(gulp.dest(project.paths.export + 'scripts/'));
}

function replaceAppBundleRef() {
    const manifest = gulp.src(project.paths.export + 'scripts/rev-manifest.json');
    //manifest["app-bundle"] = manifest["app-bundle.js"].replace('.js', '');

    console.log(manifest);
    //console.log("app-bundle new" + manifest["app-bundle"]);

    return gulp.src(project.paths.export + 'index.html')
        .pipe(revReplace({manifest: manifest}))
        .pipe(gulp.dest(project.paths.export));
}

function revVendorBundle() {
    // how do I use the 'stage & prod' values from the
    if(env !== 'prod') {
        console.log(`Rev not required for ${env}.`);
        return Promise.resolve();
    }

    console.log('Running rev');

    return gulp.src('./index.html')
        .pipe(usemin({
            //html: [minifyHtml({empty: true})],
            jsAttributes: {
                'data-main': [project.build.options['requirejs-main']]
            },
            js: [uglify({ outSourceMap: true }), rev()],
            inlinejs: [uglify({ outSourceMap: true })]
        }))
        .pipe(gulp.dest(project.paths.export));
}
