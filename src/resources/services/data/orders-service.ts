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

    getForZone(zone:Zone, year:number):Promise<Map<string, ZoneWeek>> {
        return new Promise((resolve, reject) => {
            this.database.db.find({ selector: { type: OrderDocument.OrderDocumentType, 'zone.name': zone.name}})
                .then(result => {
                    const weeks = this.referenceData.weeks.filter(w => w.year === year);

                    let returnValue = new Map<string,ZoneWeek>();

                    result.docs.forEach((doc:OrderDocument) => {
                        const stickDate = moment(doc.stickDate),
                            weekId = stickDate.toWeekNumberId(),
                            stickWeek = stickDate.isoWeek(),
                            stickYear = stickDate.isoWeekYear(),
                            plantName = doc.plant.name;

                        if(stickYear === year) {

                            let week:ZoneWeek,
                                plant:ZoneWeekPlant,
                                plants:Map<string,ZoneWeekPlant>;

                            if (returnValue.has(weekId)) {
                                week = returnValue.get(weekId);
                            } else {
                                plants = new Map<string, ZoneWeekPlant>();
                                week = {weekNumber: stickWeek, plants: plants, available: zone.tables};
                                returnValue.set(weekId, week);
                            }

                            if (week.plants.has(plantName)) {
                                plant = week.plants.get(plantName);
                            } else {
                                plant = {name: plantName, tables: 0};
                                week.plants.set(plantName, plant);
                            }

                            const orderWeek = doc.zone.weeks.find(w => w.year === year && w.week === stickWeek);
                            if (orderWeek) {
                                week.available -= orderWeek.tables;
                                plant.tables += orderWeek.tables;
                            }
                        }
                    });

                    resolve(returnValue);
                })
                .catch(reject);
        });
    }
}
