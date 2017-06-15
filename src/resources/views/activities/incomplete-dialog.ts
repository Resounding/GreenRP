import {autoinject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';

@autoinject
export class IncompleteDialog {
    reason:string;
    errors:string[];

    constructor(private controller:DialogController) { }

    save() {
        this.errors = [];

        if(!this.reason) {
            this.errors.push('Please enter the reason.');
        }

        if(!this.errors.length) {
            this.controller.ok(this.reason);
        }
    }
}