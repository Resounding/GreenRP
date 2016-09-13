import {Zone} from "../../../models/zone";
import {Order, OrderDocument, OrderZone} from "../../../models/order";
import {CalculatorWeek} from "./calculator-week";
import {Customer} from "../../../models/customer";
import {Plant} from "../../../models/plant";

export class CalculatorOrder implements Order {
    _id:string;
    _rev:string;
    type:string;
    arrivalDate:Date = null;
    flowerDate:Date = null;
    lightsOutDate:Date = null;
    stickDate:Date = null;
    quantity:number = 0;
    customer:Customer = null;
    plant:Plant = null;
    zone:Zone = null;

    constructor(args?:any) {
        if(args) {
            _.extend(this, args);
        }
    }

    toOrderDocument(weeks:CalculatorWeek[]):OrderDocument {
        const zone:OrderZone = {
            name: this.zone.name,
            tables: this.zone.tables,
            autoSpace: this.zone.autoSpace,
            weeks: weeks.map((w:CalculatorWeek) => {
                return {
                    year: w.week.year,
                    week: w.week.week,
                    available: this.zone.tables - w.tables,
                    tables: w.tables
                };
            })
        };

        return {
            _id: this._id,
            _rev: this._rev,
            type: OrderDocument.OrderDocumentType,
            arrivalDate: this.arrivalDate,
            flowerDate: this.flowerDate,
            lightsOutDate: this.lightsOutDate,
            stickDate: this.stickDate,
            quantity: this.quantity,
            customer: this.customer,
            plant: this.plant,
            zone: zone
        }
    }
}
