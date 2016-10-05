import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Order, OrderDocument} from '../../models/order';
import {Database} from '../database';

@autoinject()
export class OrdersService {

    static OrderCreatedEvent:string = 'Order Created';
    static OrderUpdatedEvent:string = 'Order Updated';
    static OrderDeletedEvent:string = 'Order Deleted';

    constructor(private database:Database, private events:EventAggregator) { }

    create(order:Order):Promise<Order> {
        const orderDoc = new OrderDocument(order);

        return new Promise((resolve, reject) => {
        return this.database.db.put(orderDoc)
            .then((result:PouchDB.Core.Response) => {
                if(result.ok) {
                    orderDoc._rev = result.rev;
                    this.events.publish(OrdersService.OrderCreatedEvent);
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
                type: { '$eq': OrderDocument.OrderDocumentType },
                isCancelled: { '$ne': true }
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
                    this.events.publish(OrdersService.OrderUpdatedEvent, doc);
                    return resolve(doc);
                })
                .catch(reject);
        });
    }

    cancel(id:string):Promise<OrderDocument> {
        return new Promise((resolve, reject) => {
            this.database.db.get(id)
                .then((doc:OrderDocument) => {
                    doc.isCancelled = true;
                    this.database.db.put(doc)
                        .then((delDoc) => {
                            this.events.publish(OrdersService.OrderDeletedEvent);
                            resolve(delDoc);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }
}
