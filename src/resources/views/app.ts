import {autoinject} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import { Authentication, AuthorizeStep, Roles } from '../services/authentication';
import * as data from 'text!../../../package.json';

@autoinject()
export class App {
    router:Router;
    footerText:string;

    constructor(private auth:Authentication, private element:Element) { }

    activate() {
        this.addFooter();
        //this.auth.refreshProfile();
    }

    configureRouter(config:RouterConfiguration, router:Router) {
        config.addAuthorizeStep(AuthorizeStep);
        config.title = 'Boekestyn Greenhouses Resource Planning app';

        if(this.auth.isInRole(Roles.ProductionManager) || this.auth.isInRole(Roles.Administrator)) {
            config.map([
                {route: ['', 'home/:year'], name: 'home', moduleId: 'resources/views/home/index', title: 'Home', nav: true, settings: { auth: true }},
                {route: 'plants', name: 'plants', moduleId: 'resources/views/plants/index', title: 'Plants', nav: true, settings: { auth: true, roles: [Roles.ProductionManager, Roles.Administrator] }}
            ]);
        }

        if(this.auth.isInRole(Roles.Grower) || this.auth.isInRole(Roles.LabourSupervisor)) {
            const route = {route: ['activities'], name: 'activities', moduleId: 'resources/views/activities/index', title: 'Activities', nav: true, settings: { auth: true }};
            // if there aren't any routes defined, make this the default as well.
            if(!config.instructions.length) {
                route.route.push('');
            }
            config.map([route]);
        }

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
