import * as gulp from 'gulp';
import build from './build';
import * as project from '../aurelia.json';
import {CLIOptions} from 'aurelia-cli';

export default gulp.series(
    report
    //build,
    //deploy
)

function report(done) {
    console.log('Environment:', CLIOptions.getEnvironment());
    CLIOptions.args = ['--env', 'prod']
    console.log('Environment:', CLIOptions.getEnvironment());
    done();
}

function deploy() {
    return gulp.src(['./index.html', './package.json','./scripts/*.*'])
        .pipe(gulp.dest(project.paths.deploy));
}