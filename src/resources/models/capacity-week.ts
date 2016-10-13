import {Week} from "./week";
import {OrderDocument, OrderWeek} from "./order";
import {Zone} from "./zone";

interface CapacityWeekZone {
    zone:Zone;
    tables:number;
    available:number;
}

export interface CapacityWeekZones {
    [index:string]: CapacityWeekZone;
}

export class CapacityWeek implements Week {
    _id:string;
    year:number;
    week:number;
    zones:CapacityWeekZones = { };

    constructor(week:Week) {
        this._id = `week:${week.year}.${week.week}`;
        this.year = week.year;
        this.week = week.week;

        const keys:string[] = Object.keys(week.zones);

        keys.forEach((key:string) => {
            const zone =  week.zones[key].zone,
                tables = zone.tables;

            this.zones[key] = {
                zone: zone,
                tables: tables,
                available: tables
            };
        });
    }

    addOrder(order:OrderDocument, week:OrderWeek):void {
        const zone = this.getZone(order, week);
        zone.available -= week.tables;
    }

    removeOrder(order:OrderDocument) {
        order.zone.weeks.forEach(w => {
            const key = `week:${w.year}.${w.week}`;

            const zone = this.getZone(order, w);

            if(key === this._id && zone.zone.name in this.zones) {
                zone.available += w.tables;
            }
        });
    }

    getZone(order:OrderDocument, week:OrderWeek):CapacityWeekZone {

        if(order.lightsOutDate && order.rootInPropArea) {

        const lightsOutDate = moment(order.lightsOutDate),
            lightsOutWeek = lightsOutDate.isoWeek(),
            lightsOutYear = lightsOutDate.isoWeekYear();

            if(lightsOutYear < week.year || lightsOutYear === week.year && week.week < lightsOutWeek) {
                const zoneValues = _.values(this.zones),
                    propZone = _.find(zoneValues, z => z.zone.isPropagationZone);

                if(propZone) return propZone;
            }
        }

        return this.zones[order.zone.name];
    }
}
