import {log} from './log';

toastr.options.positionClass = 'toast-bottom-right';
toastr.options.closeButton = true;

export class Notifications {

    static success(message:string, title?:string) {
        toastr.success(message, title);
    }

    static error(error:Error | string | any, title?:string) {
        let message:string;

        log.error('Error', error);

        if(error instanceof Error) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        } else {
            if(error.message) {
                message = error.message;
            } else {
                message = JSON.stringify(error);
            }
        }

        toastr.error(message, title);
    }
}