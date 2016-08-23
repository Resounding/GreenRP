import {Zone} from '../models/zone';

export class OrderCalculator {
    zones:Zone[];
    arrivalDate:Date;

    constructor(zones:Zone[]) {
        this.zones = _.sortBy(zones, z => z.name.toLowerCase());
    }

    setArrivalDate(arrivalDate:Date) {

    }
}
