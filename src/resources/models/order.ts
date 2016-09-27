import {Zone} from "./zone";
import {Customer} from "./customer";
import {Plant} from "./plant";

export interface OrderWeek {
    year:number;
    week:number;
    tables:number;
    available:number;
}

export interface OrderZone extends Zone {
    weeks:OrderWeek[];
}

export interface Order {
    _id:string;
    _rev:string;
    type:string;
    arrivalDate:Date;
    flowerDate:Date;
    lightsOutDate:Date;
    stickDate:Date;
    quantity:number;
    customer:Customer;
    plant:Plant;
    zone:Zone;
}

export class OrderDocument implements Order {
    _id:string;
    _rev:string;
    type:string;
    arrivalDate:Date;
    flowerDate:Date;
    lightsOutDate:Date;
    stickDate:Date;
    quantity:number;
    customer:Customer;
    plant:Plant;
    zone:OrderZone;

    constructor(args?:Order){
        if(args) {
            _.extend(this, args);
        }

        if(!this._id && this.customer && this.plant && this.arrivalDate) {
            const arrival = moment(this.arrivalDate),
                week = arrival.isoWeek(),
                year = arrival.isoWeekYear(),
                day = arrival.isoWeekday();
            this._id = `${this.plant.abbreviation}${this.customer.abbreviation}${year}-${week}-${day}`;
        }

        if(!this.type) {
            this.type = OrderDocument.OrderDocumentType;
        }

        if(this.arrivalDate) {
            const arrivalDate = moment(this.arrivalDate);
            if(arrivalDate.isValid()) {
                this.arrivalDate = arrivalDate.toDate();
            }
        }

        if(this.flowerDate) {
            const flowerDate = moment(this.flowerDate);
            if(flowerDate.isValid()) {
                this.flowerDate = flowerDate.toDate();
            }
        }

        if(this.lightsOutDate) {
            const lightsOutDate = moment(this.lightsOutDate);
            if(lightsOutDate.isValid()) {
                this.lightsOutDate = lightsOutDate.toDate();
            }
        }

        if(this.stickDate) {
            const stickDate = moment(this.stickDate);
            if(stickDate.isValid()) {
                this.stickDate = stickDate.toDate();
            }
        }
    }

    static OrderDocumentType:string = 'order';
}
