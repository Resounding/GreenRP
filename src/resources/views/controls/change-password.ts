import {autoinject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {Authentication, ChangePasswordResult} from '../../services/authentication';
import {Notifications} from "../../services/notifications";

@autoinject
export class ChangePassword {
    newPassword:string;
    confirmPassword:string;
    errors:string[];    

    constructor(private controller:DialogController, private auth:Authentication) { }

    save() {
        if(!this.validate()) return;

        this.auth.changePassword(this.newPassword)
            .then(result => {
                this.controller.ok(result);
            })
            .catch((result:ChangePasswordResult) => {
                if(result && Array.isArray(result.errors) && result.errors.length) {
                    this.errors = result.errors;
                } else {
                    Notifications.error(result);
                }
            });
    }

    private validate():boolean {
        this.errors = [];

        if(!this.newPassword) {
            this.errors.push('Please enter the new password.');
            return false;
        }
        if(!this.confirmPassword) {
            this.errors.push('Please re-enter the new password.');
            return false;
        }
        if(this.newPassword !== this.confirmPassword) {
            this.errors.push('The new password does not match the confirmation.');
            return false;
        }

        return true;
    }
}