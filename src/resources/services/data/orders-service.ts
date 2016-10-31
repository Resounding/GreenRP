import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Order, OrderDocument} from '../../models/order';
import {Database} from '../database';

@autoinject()
export class OrdersService {

    static OrdersChangedEvent:string = 'Order Changed';

    constructor(private database:Database, private events:EventAggregator) { }

    create(order:Order):Promise<Order> {
        const orderDoc = new OrderDocument(order).toJSON();

        if(!orderDoc.customer) {
            return Promise.reject(Error('Please choose a customer.'));
        } else if(!orderDoc.quantity) {
            return Promise.reject(Error('Please enter the quantity for the order.'));
        } else if(!orderDoc.plant) {
            return Promise.reject(Error('Please choose a plant for the order.'));
        } else if(!orderDoc._id) {
            return Promise.reject(Error('There was a problem creating the order. Please verify all fields have been entered.'));
        }

        return new Promise((resolve, reject) => {
            return this.database.db.put(orderDoc)
                .then((result:PouchDB.Core.Response) => {
                    if(result.ok) {
                        orderDoc._rev = result.rev;
                        this.events.publish(OrdersService.OrdersChangedEvent);
                        resolve(orderDoc);
                    } else {
                        reject(new Error('Order was not saved.'));
                    }
                })
                .catch(reject);
        });
    }

    getAll():Promise<OrderDocument[]> {

        return new Promise((resolve, reject) => {
            this.database.db.find({ selector: {
                type: { '$eq': OrderDocument.OrderDocumentType }
            }})
            .then((result) => {
                const docs = result.docs.map(doc => new OrderDocument(doc));
                resolve(docs);
            })
            .catch(reject);
        });
    }

    edit(doc:OrderDocument):Promise<OrderDocument> {
        return new Promise((resolve, reject) => {
            this.database.db.put(doc)
                .then((value:PouchDB.Core.Response) => {
                    if(!value.ok) {
                        return reject(Error('Editing the Order failed.'))
                    }
                    
                    doc._rev = value.rev;
                    this.events.publish(OrdersService.OrdersChangedEvent, doc);
                    return resolve(doc);
                })
                .catch(reject);
        });
    }

    cancel(id:string):Promise<OrderDocument> {
        return new Promise((resolve, reject) => {
            this.database.db.get(id)
                .then((doc:OrderDocument) => {
                    this.database.db.remove(doc)
                        .then((delDoc) => {
                            this.events.publish(OrdersService.OrdersChangedEvent);
                            resolve(delDoc);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }
}
