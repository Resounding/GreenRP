import {autoinject} from 'aurelia-framework';
import {Order, OrderDocument} from '../../models/order';
import {Database} from '../database';
import {Zone} from "../../models/zone";
import {ReferenceData} from "../reference-data";

export interface ZoneWeekPlant {
    name: string;
    tables:number;
}

export interface ZoneWeek {
    weekNumber:number;
    available:number;
    plants:Map<string,ZoneWeekPlant>;
}

@autoinject()
export class OrdersService {

    constructor(private database:Database, private referenceData:ReferenceData) { }

    create(order:Order):Promise<Order> {
        const orderDoc = new OrderDocument(order);

        return new Promise((resolve, reject) => {
        return this.database.db.put(orderDoc)
            .then((result:PouchUpdateResponse) => {
                if(result.ok) {
                    orderDoc._rev = result.rev;
                    resolve(orderDoc);
                } else {
                    reject(new Error('Order was not saved.'));
                }
            })
            .catch(reject);
        });
    }

    getAll():Promise<Order[]> {

        return new Promise((resolve, reject) => {
            this.database.db.find({ selector: { type: { '$eq': OrderDocument.OrderDocumentType }}})
            .then((result) => {
                const docs = result.docs.map(doc => new OrderDocument(doc));
                resolve(docs);
            })
            .catch(reject);
        });
    }
}
