import {autoinject} from 'aurelia-framework';
import {ReferenceData} from '../reference-data';
import {Plant} from "../../models/plant";
import {Order, OrderDocument} from "../../models/order";
import {Zone} from "../../models/zone";
import {Week} from "../../models/week";

interface ZoneWeek {
    weekNumber:number;
    plants:number[];
    available:number;
}

export interface ZoneDetailModel {
    plants:string[];
    weeks:ZoneWeek[]
}

@autoinject()
export class ZoneDetailService {

    constructor(private referenceData:ReferenceData) { }

    createModel(plants:Plant[], orders:OrderDocument[], year:number, zone:Zone):ZoneDetailModel {

        const
            sortedPlants = _.sortBy(plants, p => p.name.toLowerCase() + p.size),
            plantNames = _.pluck(sortedPlants, 'name'),
            plantOrders = plantNames.reduce((memo:Map<string, Map<string,number>>, plantName:string) => {
                if(!memo.has(plantName)) {
                    memo.set(plantName, new Map<string,number>());
                }
                return memo;
            }, new Map<string, Map<string,number>>()),
            zoneOrders = orders
                .filter((o:OrderDocument) => o.zone.name === zone.name)
                .reduce((memo:Map<string, Map<string,number>>, o:OrderDocument) => {
                    o.zone.weeks.forEach(w => {
                        const id = `week:${w.year}.${w.week}`,
                            plantWeek = memo.get(o.plant.name);

                        if(!plantWeek.has(id)) {
                            plantWeek.set(id, 0);
                        }

                        const wasUsed = plantWeek.get(id),
                            isUsed = wasUsed + w.tables;

                        plantWeek.set(id, isUsed);
                    });
                    return memo;
                }, plantOrders),
            weeks =  this.referenceData.weeks
                .filter(w => w.year === year)
                .sort((a:Week, b:Week) => {
                    return a.week - b.week;
                })
                .map(w => {
                    let available:number = zone.tables;
                    return {
                        weekNumber: w.week,
                        plants: plantNames.map(p => {
                            const weeks = zoneOrders.get(p),
                                tables = weeks.has(w._id) ? weeks.get(w._id) : 0;

                            available -= tables;
                            return tables;
                        }),
                        available: available
                    };
                });

        const model = {
            plants: plantNames,
            weeks: weeks,
            zone: zone
        };

        return model;
    }
}

/* Something to start with
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
 */
