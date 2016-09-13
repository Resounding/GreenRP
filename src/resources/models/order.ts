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
                weekNumber = arrival.isoWeek(),
                year = arrival.isoWeekYear();
            this._id = `${OrderDocument.OrderDocumentType}:${year}:${this.plant.size}${this.customer.abbreviation}${weekNumber}`;
        }

        if(!this.type) {
            this.type = OrderDocument.OrderDocumentType;
        }
    }

    static OrderDocumentType:string = 'order';
}
