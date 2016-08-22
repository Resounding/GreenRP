import {Router, RouterConfiguration} from 'aurelia-router';
import {AuthorizeStep} from '../services/authentication';

export class App {
    router:Router;

    configureRouter(config:RouterConfiguration, router:Router) {
        config.addAuthorizeStep(AuthorizeStep);
        config.title = 'Boekestyn Greenhouses Resource Planning app';
        config.map([
            {route: ['', 'home'], name: 'home', moduleId: 'resources/views/home/index', title: 'Home', nav: true, settings: { auth: true }}
        ]);

        this.router = router;
    }
}
