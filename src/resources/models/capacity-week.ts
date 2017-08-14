import {Week} from "./week";
import {OrderDocument, WeekInHouse} from "./order";
import {Zone} from "./zone";

interface CapacityWeekZone {
    zone:Zone;
    tables:number;
    available:number;
    selected?:boolean;
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

    addOrder(week:WeekInHouse):void {
        const zone = this.zones[week.zone];
        zone.available -= week.tables;
    }
}
