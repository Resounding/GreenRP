export class Configuration {

    app_root:string = 'resources/views/app';
    login_root:string = 'resources/views/login';

    static isDebug():boolean {
        return window.location.hostname === 'localhost';
    }
}
