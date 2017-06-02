import {autoinject} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import {AuthorizeStep} from '../services/authentication';
import * as data from 'text!../../../package.json';

@autoinject()
export class App {
    router:Router;
    footerText:string;

    constructor(private element:Element) { }

    configureRouter(config:RouterConfiguration, router:Router) {
        config.addAuthorizeStep(AuthorizeStep);
        config.title = 'Boekestyn Greenhouses Resource Planning app';
        config.map([
            {route: ['', 'home/:year'], name: 'home', moduleId: 'resources/views/home/index', title: 'Home', nav: true, settings: { auth: true }},
            {route: 'plants', name: 'plants', moduleId: 'resources/views/plants/index', title: 'Plants', nav: true, settings: { auth: true, roles: ['grower', 'administrator'] }},
            {route: 'activities', name: 'activities', moduleId: 'resources/views/activities/index', title: 'Activities', nav: true, settings: { auth: true, roles: ['grower', 'administrator'] }}
        ]);

        this.router = router;
    }

    closeSidebar() {
        $('.sidebar', this.element).sidebar('close');
    }

    addFooter() {
        const pkg = JSON.parse(data);
        this.footerText = `&copy; ${new Date().getFullYear()} ${pkg.publisher} v${pkg.version}`;
    }
}
