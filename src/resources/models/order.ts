import {Plant, Customer} from '../services/data/reference';

export interface Order {
    arrivalDate:Date;
    quantity:number;
    customer:Customer;
    plant:Plant;
}

export class OrderDocument implements Order {
    arrivalDate:Date = null;
    quantity:number = 0;
    customer:Customer = null;
    plant:Plant = null;

    constructor(args?:Order) {
        if(args) {
            _.extend(this, args);
        }
    }
}
