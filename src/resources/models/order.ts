import {Plant, Customer} from '../services/data/reference';
import {Zone} from "./zone";

export interface Order {
    arrivalDate;
    flowerDate:Date;
    lightsOutDate:Date;
    stickDate:Date;
    quantity:number;
    customer:Customer;
    plant:Plant;
    zone:Zone;
}

export class OrderDocument implements Order {
    arrivalDate:Date = null;
    flowerDate:Date = null;
    lightsOutDate:Date = null;
    stickDate:Date = null;
    quantity:number = 0;
    customer:Customer = null;
    plant:Plant = null;
    zone:Zone = null;

    _id:string;
    rev:string;

    constructor(args?:Order) {
        if(args) {
            _.extend(this, args);
        }

        if(!this._id && this.customer && this.plant && this.arrivalDate) {
            const arrival = moment(this.arrivalDate),
                weekNumber = arrival.isoWeek(),
                year = arrival.isoWeekYear();
            this._id = `order:${year}:${this.plant.size}${this.customer.abbreviation}${weekNumber}`;
        }
    }
}
