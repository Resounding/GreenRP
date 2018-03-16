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
        return this.auth.refreshProfile();
    }

    configureRouter(config:RouterConfiguration, router:Router) {
        config.addAuthorizeStep(AuthorizeStep);
        config.title = 'Boekestyn Greenhouses Resource Planning app';

        if(this.auth.isInRole(Roles.ProductionManager) || this.auth.isInRole(Roles.Administrator)) {
            config.map([
                {route: ['', 'home/:year'], name: 'home', moduleId: 'resources/views/home/index', title: 'Home', nav: true, settings: { auth: true }},
                {route: 'plants', name: 'plants', moduleId: 'resources/views/plants/index', title: 'Plants', nav: true, settings: { auth: true, showInSettings: true, roles: [Roles.ProductionManager, Roles.Administrator] }},
                {route: 'zones', name: 'zones', moduleId: 'resources/views/zones/index', title: 'Zones', nav: true, settings: { auth: true, showInSettings: true, roles: [Roles.ProductionManager, Roles.Administrator] }},
                {route: 'task-categories', name: 'task-categories', moduleId: 'resources/views/task-categories/index', title: 'Task Categories', nav: true, settings: { auth: true, showInSettings: true }}
            ]);
        }

        if(this.auth.isInRole(Roles.Grower) || this.auth.isInRole(Roles.LabourSupervisor)) {
            const route = {route: ['activities'], name: 'activities', moduleId: 'resources/views/activities/index', title: 'Activities', nav: true, settings: { auth: true }};
            // if there aren't any routes defined, make this the default as well.
            if(!config.instructions.length) {
                route.route.push('');
            }
            config.map([
                route,
                {route: 'activities/:id', name: 'activity-detail', moduleId: 'resources/views/activities/activity-detail', nav: false, settings: { auth: true }},
                {route: 'activities/:id/journal', name: 'journal-detail', moduleId: 'resources/views/activities/journal-detail', nav: false, settings: { auth: true }},
                {route: 'activities/by-crop', name: 'activities-by-crop', moduleId: 'resources/views/activities/activities-by-crop', nav: false, settings: { auth: true }},
                {route: 'activities/by-recipe', name: 'activities-by-recipe', moduleId: 'resources/views/activities/activities-by-recipe', nav: false, settings: { auth: true }}                
            ]);
        }

        if(this.auth.isInRole(Roles.ProductionManager) || this.auth.isInRole(Roles.Administrator) || this.auth.isInRole(Roles.Grower)) {
            config.map([
                {route: 'recipes', name: 'recipes', moduleId: 'resources/views/recipes/index', title: 'Recipes', nav: true, settings: { auth: true }},
                {route: 'recipes/:id', name: 'recipe-detail', moduleId: 'resources/views/recipes/detail', settings: { auth: true }},
                {route: 'recipes/:id/tasks/:taskid', name: 'task-detail', moduleId: 'resources/views/recipes/task-detail', settings: { auth: true }},
                {route: 'task-categories', name: 'task-categories', moduleId: 'resources/views/task-categories/index', title: 'Task Categories', nav: true, settings: { auth: true, showInSettings: true }}
            ]);
        }

        if(this.auth.isInRole(Roles.Grower) || this.auth.isInRole(Roles.LabourSupervisor)) {
            config.map([
                {route: 'home/:year?', name: 'home', href: '#/home', moduleId: 'resources/views/home/index', title: 'Orders', nav: true, settings: { auth: true }}
            ]);
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
