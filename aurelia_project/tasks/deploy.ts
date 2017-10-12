import * as console from 'console';
import * as gulp from 'gulp';
import build from './build';
import * as project from '../aurelia.json';
import {CLIOptions} from 'aurelia-cli';

export default gulp.series(
    buildProd,
    deployRootFiles,
    deployScriptFiles
)

function buildProd(done) {
    CLIOptions.instance.args = ['--env', 'prod']

    return build(done);
}

function deploy() {
    return gulp.parallel(
        deployRootFiles,
        deployScriptFiles
    );
}

function deployRootFiles() {
    return gulp.src(['./index.html', './package.json'])
        .pipe(gulp.dest(project.paths.deploy, { overwrite: true }))
}

function deployScriptFiles() {
    return gulp.src('./scripts/*.*', { base: './scripts' })
        .pipe(gulp.dest(`${project.paths.deploy}/scripts`))
}