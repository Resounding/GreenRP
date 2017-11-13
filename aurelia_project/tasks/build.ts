import * as gulp from 'gulp';
import lint from './lint';
import transpile from './transpile';
import processMarkup from './process-markup';
import processCSS from './process-css';
import {build, CLIOptions} from 'aurelia-cli';
//@ts-ignore
import * as project from '../aurelia.json';

export default gulp.series(
    readProjectConfiguration,
    gulp.parallel(
        transpile,
        lint,
        processMarkup,
        processCSS
    ),
    copyTheme,
    writeBundles
);

function readProjectConfiguration() {
    return build.src(project);
}

function writeBundles() {
    return build.dest();
}

function copyTheme() {
    return gulp.src(project.paths.theme)
        .pipe(gulp.dest('styles/themes/'));
}
