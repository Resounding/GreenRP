import {autoinject} from 'aurelia-framework';
import {Order, OrderDocument} from '../../models/order';
import {Database} from '../database';

@autoinject()
export class OrdersService {

    constructor(private database:Database) { }

    create(order:Order):Promise<Order> {
        const orderDoc = new OrderDocument(order);

        return new Promise((resolve, reject) => {
        return this.database.db.put(orderDoc)
            .then((result:PouchUpdateResponse) => {
                if(result.ok) {
                    orderDoc.rev = result.rev;
                    resolve(orderDoc);
                } else {
                    reject(new Error('Order was not saved.'));
                }
            })
            .catch(reject);
        });
    }
}
