import {autoinject, Aurelia} from 'aurelia-framework';
import {Authentication} from '../services/authentication';
import {Configuration} from "../services/configuration";

@autoinject()
export class Login {
    username:string;
    password:string;
    errorMessage:string;

    constructor(private auth:Authentication, private app:Aurelia, private config:Configuration) { }

    login() {
        this.errorMessage = '';

        if(!this.password) this.errorMessage = 'Please enter your password';
        if(!this.username) this.errorMessage = 'Please enter your username';

        if(!this.errorMessage) {
            this.auth.login(this.username, this.password)
                .then(() => {
                    this.app.setRoot(this.config.app_root);
                })
                .catch(err => {
                    this.errorMessage = err.message;
                });
        }
    }
}
