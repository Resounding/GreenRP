import {autoinject} from 'aurelia-framework';
import {ReferenceData} from '../reference-data';
import {Plant} from "../../models/plant";
import {Order} from "../../models/order";
import {Zone} from "../../models/zone";

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

    createModel(plants:Plant[], orders:Order[], year:number, zone:Zone):ZoneDetailModel {

        const sortedPlants = plants.sort(p => p.name.toLowerCase() + p.size),
            plantNames = _.pluck(sortedPlants, 'name'),
            weeks =  this.referenceData.weeks
                .filter(w => w.year === year)
                .sort(w => w.week)
                .map(w => {
                    return {
                        weekNumber: w.week,
                        plants: sortedPlants.map(p => 0),
                        available: 0
                    };
                });

        const model = {
            plants: plantNames,
            weeks: weeks
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
