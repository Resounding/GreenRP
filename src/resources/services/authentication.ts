import {autoinject, Aurelia} from 'aurelia-framework';
import {Router, NavigationInstruction, Next, Redirect} from 'aurelia-router';
import {HttpClient, json} from 'aurelia-fetch-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import * as cryptoJS from 'crypto-js';
import {Configuration} from './configuration';
import {log} from './log';

const storage_key:string = 'auth_token';
let database:PouchDB = null;
let user_info: UserInfo = null;

interface UserInfo {
    name:string;
    password:string;
    roles:string[];
}

interface CouchUserDoc {
    _id:string;
    _rev:string;
    name:string;
    orgs:string[];
    roles:string[];
    type:string;
    password_sha:string;
    salt:string;
}

export interface ChangePasswordResult {
    success:boolean;
    errors:string[];
}

@autoinject()
export class Authentication {

    constructor(private app:Aurelia, private config: Configuration, private router:Router, private httpClient:HttpClient, private events:EventAggregator) {
        database = new PouchDB(this.config.remote_database_name, { skip_setup: true });
        user_info = JSON.parse(localStorage[storage_key] || null);
    }

    login(user:string, password:string):Promise<UserInfo> {

        return new Promise((resolve, reject) => {
            const url = `${this.config.remote_server}/_session`,
                method = 'post',
                body = `name=${encodeURI(user)}&password=${encodeURI(password)}`,
                authorization = getBasicAuth(user, password),
                headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': authorization };

            this.httpClient.fetch(
                url, { method, headers, body })
                .then(result => {
                    if(result.ok) {
                        log.debug('Login succeeded');
                        result.json().then(info => {
                            user_info = {
                                name: info.name,
                                password: password,
                                roles: info.roles
                            };

                            saveUserInfo();

                            this.app.setRoot(this.config.app_root);
                            this.events.publish(Authentication.AuthenticatedEvent);
                            return resolve(user_info);
                        });
                    } else {
                        log.debug('Login failed');
                        result.json().then(error => {
                            reject(new Error(`Login failed: ${error.reason}`));
                        });
                    }
                })
                .catch(reject);

        });
    }

    logout():Promise<any> {
        user_info = null;
        localStorage[storage_key] = null;
        this.app.setRoot(this.config.login_root);
        this.router.navigateToRoute('login');
        return Promise.resolve();
    }

    refreshProfile():Promise<UserInfo|Error> {
        if(!this.isAuthenticated()) {
            return Promise.reject<Error>(new Error('Not logged in'));
        }

        return this.login(this.userInfo.name, this.userInfo.password);
    }

    isAuthenticated():boolean {
        return Authentication.isLoggedIn();
    }

    isInRole(role:string):boolean {
        return Authentication.isInRole(role);
    }

    changePassword(password:string):Promise<ChangePasswordResult> {
        return new Promise((resolve, reject) => {
            const url = `${this.config.remote_server}/_users/org.couchdb.user:${this.userInfo.name}`,
                authorization = getBasicAuth(this.userInfo.name, this.userInfo.password),
                headers = { 'Authorization': authorization };

            this.httpClient.fetch(url, { headers })
                .then(result => {
                    if(result.ok) {
                        log.debug('Retrieved user profile');
                        return result.json().then((user:CouchUserDoc) => {

                            const salt = cryptoJS.lib.WordArray.random(16).toString(),
                                 hash = new cryptoJS.SHA1(`${password}${salt}`).toString();

                            user.salt = salt;
                            user.password_sha = hash;

                            const method = 'PUT',
                                body = json(user);

                            this.httpClient.fetch(url, { headers, method, body })
                                .then(updateResult => {
                                    if(updateResult.ok) {
                                        log.debug('Successfully changed password');

                                        user_info.password = password;
                                        saveUserInfo();

                                        return updateResult.json()
                                            .then(resolve)
                                            .catch(reject);
                                    }

                                    return updateResult.json()
                                        .then(reject)
                                        .catch(reject);
                                })
                        });
                    }

                    return result.json()
                        .then(reject)
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    get userInfo():UserInfo {
        return user_info;
    }

    static isLoggedIn():boolean {
        return user_info !== null;
    }

    static isInRole(role:string) {
        return Authentication.isLoggedIn() && user_info.roles.indexOf(role) !== -1;
    }

    static AuthenticatedEvent:string = 'authenticated';
}

export class AuthorizeStep {
    run(navigationInstruction:NavigationInstruction, next: Next) {
        const instructions:NavigationInstruction[] = navigationInstruction.getAllInstructions(); 
        if(instructions.some(i => i.config.settings.auth )) {
            var loggedIn = Authentication.isLoggedIn();
            if(!loggedIn) {
                return next.cancel(new Redirect('login'));
            }
        }
        // if this route is only accessible to some roles...
        if(instructions.some(i => Array.isArray(i.config.settings.roles))) {
            // and there are some 
            if(instructions.some(i => {
                // no roles requirement: no problem
                if(!Array.isArray(i.config.settings.roles)) return false;
                const roles:string[] = i.config.settings.roles;
                // if they're not in any of the roles, redirect home.
                if(roles.every(r => !Authentication.isInRole(r))) return true;
            })) {
                return next.cancel(new Redirect('home'));
            }
        }

        return next();
    }
}

export class Roles {
    static Grower:string = 'grower';
    static Sales:string = 'sales';
    static ProductionManager:string = 'production manager';
    static Administrator:string = 'administrator';
    static LabourSupervisor:string = 'labour supervisor';
}

function getBasicAuth(username:string, password:string) {
    const data = `${username}:${password}`,
        header = `Basic ${window.btoa(data)}`;

    return header;
}

function saveUserInfo() {
    localStorage[storage_key] = JSON.stringify(user_info);
}