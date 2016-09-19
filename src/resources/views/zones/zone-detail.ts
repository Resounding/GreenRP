import {autoinject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {Zone} from "../../models/zone";

@autoinject()
export class ZoneDetail {
    year:number;
    zone:Zone;

    constructor(private controller:DialogController) { }

    activate(model:ZoneDetailModel) {
        this.zone = model.zone;
        this.year = model.year;
    }
}

export interface ZoneDetailModel {
    zone:Zone;
    year:number;
}
