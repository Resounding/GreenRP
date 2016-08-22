import {autoinject, Aurelia} from 'aurelia-framework';
import {Router, NavigationInstruction, Next, Redirect} from 'aurelia-router';
import {Configuration} from './configuration';

let user_info: UserInfo = null;

interface UserInfo {
    name:string;
    password:string;
    roles:string[];
    basicAuth:string;
}

@autoinject()
export class Authentication {

    constructor(private app:Aurelia, private config: Configuration, private router:Router) { }

    login(user:string, password:string):Promise<UserInfo> {

        user_info = {
            name: user,
            password: password,
            roles: [],
            basicAuth: `${window.btoa(user + password)}`
        };

        this.app.setRoot(this.config.app_root);

        return Promise.resolve(user_info);
    }

    logout():Promise {
        user_info = null;
        this.app.setRoot(this.config.login_root);
        this.router.navigateToRoute('login');
        return Promise.resolve();
    }

    isAuthenticated():boolean {
        return user_info !== null;
    }

    get userInfo():UserInfo {
        return user_info;
    }

    static isLoggedIn():boolean {
        return user_info !== null;
    }
}

export class AuthorizeStep {
    run(navigationInstruction:NavigationInstruction, next: Next) {
        if(navigationInstruction.getAllInstructions().some(i => i.config.settings.auth )) {
            var loggedIn = Authentication.isLoggedIn();
            if(!loggedIn) {
                return next.cancel(new Redirect('login'));
            }
        }

        return next();
    }
}
