import {Zone} from "./zone";
import {Customer} from "./customer";
import {Plant} from "./plant";

export interface WeekInHouse {
    zone:string;
    tables:number;
    year:number;
    week:number;
}

export interface OrderWeeksInHouse {
    [index:string]: WeekInHouse;
}

export interface Order {
    _id:string;
    _rev:string;
    type:string;
    orderNumber:string;
    arrivalDate:Date;
    flowerDate:Date;
    lightsOutDate:Date;
    stickDate:Date;
    quantity:number;
    customer:Customer;
    plant:Plant;
    zone:Zone;
    weeksInHouse:OrderWeeksInHouse;
    partialSpace:boolean;
}

export class OrderDocument implements Order {
    _id:string;
    _rev:string;
    type:string;
    orderNumber:string;
    arrivalDate:Date;
    flowerDate:Date;
    lightsOutDate:Date;
    stickDate:Date;
    quantity:number;
    customer:Customer;
    plant:Plant;
    zone:Zone;
    weeksInHouse:OrderWeeksInHouse;
    rootInPropArea:boolean;
    partialSpace:boolean;

    constructor(args?:Order){
        if(args) {
            _.extend(this, args);
        }

        this.orderNumber = this.orderNumber || this.createOrderNumber();

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

    createOrderNumber():string {
        const plant = this.plant ? this.plant.abbreviation : '',
            customer = this.customer ? this.customer.abbreviation : '',
            arrival = moment(this.arrivalDate),
            week = this.arrivalDate ? arrival.isoWeek() : '',
            year = arrival.isoWeekYear(),
            day = arrival.isoWeekday(),
            orderNumber = `${plant}${customer}${year}-${week}-${day}`;

        return orderNumber;
    }

    toJSON() {
        return {
            _id: this._id,
            _rev: this._rev,
            type: this.type,
            orderNumber: this.createOrderNumber(),
            arrivalDate: moment(this.arrivalDate).format('YYYY-MM-DD'),
            flowerDate: moment(this.flowerDate).format('YYYY-MM-DD'),
            lightsOutDate: moment(this.lightsOutDate).format('YYYY-MM-DD'),
            stickDate: moment(this.stickDate).format('YYYY-MM-DD'),
            quantity: numeral(this.quantity).value(),
            customer: this.customer,
            plant: this.plant,
            zone: this.zone,
            weeksInHouse: this.weeksInHouse,
            rootInPropArea: !!this.rootInPropArea,
            partialSpace: !!this.partialSpace
        };
    }

    static OrderDocumentType:string = 'order';
}
