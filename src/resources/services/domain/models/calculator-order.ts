import {Zone} from "../../../models/zone";
import {Order, OrderDocument, OrderWeeksInHouse} from "../../../models/order";
import {CalculatorZone} from "./calculator-zone";
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
    zone:CalculatorZone = null;
    weeksInHouse:OrderWeeksInHouse;
    rootInPropArea:boolean = false;
    partialSpace: boolean = false;

    constructor(args?:any) {
        if(args) {
            _.extend(this, args);
        }
    }

    toOrderDocument(weeks:CalculatorWeek[], zones:Zone[]):OrderDocument {
        let lightsOutDate, lightsOutWeek, lightsOutYear;

        if(this.lightsOutDate && this.rootInPropArea) {
            lightsOutDate = moment(this.lightsOutDate);
            lightsOutWeek = lightsOutDate.isoWeek();
            lightsOutYear = lightsOutDate.isoWeekYear();
        }

        const propZone = _.find(zones, z => z.isPropagationZone),
            zone = _.clone(_.find(zones, z => z.name === this.zone.name));


        //noinspection TypeScriptUnresolvedVariable
        delete zone.__metadata__;
        delete zone.weeks;

        const weeksInHouse = weeks.reduce((memo: OrderWeeksInHouse, w:CalculatorWeek):OrderWeeksInHouse => {
            let zoneName:string;
            // TODO: this isn't right. need to find the actual zone
            if(lightsOutDate) {
                if (w.week.year < lightsOutYear || lightsOutYear === w.week.year && w.week.week < lightsOutWeek) {
                    if(propZone) {
                        zoneName = propZone.name;
                    }
                }
            }
            if(!zoneName) zoneName = this.zone.name;

            memo[w.week._id] = { zone: zoneName, tables: w.tables, week: w.week.week, year: w.week.year };
            return memo;
        }, <OrderWeeksInHouse>{});

        return new OrderDocument({
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
            zone: zone,
            weeksInHouse: weeksInHouse,
            rootInPropArea: this.rootInPropArea,
            partialSpace: this.partialSpace
        });
    }
}
