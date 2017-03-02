import gulp from 'gulp';
import i18n from 'aurelia-cli-i18n-oneskly-task';
import project from '../aurelia.json';
import {CLIOptions} from 'aurelia-cli';

export default gulp.series(
  () => i18n(project.i18n, CLIOptions.instance.args[0])
);
