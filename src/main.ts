import {Aurelia} from 'aurelia-framework'
import {Authentication} from './resources/services/authentication';
import {Configuration} from './resources/services/configuration'

//Configure Bluebird Promises.
(<any>Promise).config({
    warnings: {
        wForgottenReturn: false
    }
});

export function configure(aurelia: Aurelia) {
    aurelia.use
        .standardConfiguration()
        .plugin('aurelia-dialog')
        .globalResources([
            './resources/views/controls/date-format-value-converter',
            './resources/views/controls/numeric-format-value-converter',
            './resources/views/controls/keys-value-converter'
        ]);

    if (Configuration.isDebug()) {
        aurelia.use.developmentLogging();
        aurelia.use.plugin('aurelia-testing');
    }

    return aurelia.start().then(() => {
        const auth = aurelia.container.get(Authentication),
            config = aurelia.container.get(Configuration),
            root = auth.isAuthenticated() ? config.app_root : config.login_root;
        return aurelia.setRoot(root)
    });
}
