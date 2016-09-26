import {Week} from "../../models/week";
import {OrderDocument, Order} from "../../models/order";

export class WeekDetailFilter {
    startDate:Date = null;
    endDate:Date = null;
    zone:string = null;

    constructor(week?:Week) {
        if(week) {
            const start = moment().isoWeekYear(week.year).isoWeek(week.week).startOf('isoWeek'),
                end = start.clone().endOf('isoWeek');

            this.startDate = start.toDate();
            this.endDate = end.toDate();
        } else {

        }
    }

    get weekNumber():number {
        if(!this.endDate) return 0;
        return moment(this.endDate).isoWeek();
    }

    get yearNumber():number {
        if(!this.endDate) return 0;
        return moment(this.endDate).isoWeekYear();
    }
}

export class WeekDetailOrder {
    batch:string;
    plant:string;
    pots:number;
    cases:number;
    tables:number;
    shipWeek:number;
    isShippingThisWeek:boolean;
    isFloweringThisWeek:boolean;

    constructor(order:OrderDocument, filter:WeekDetailFilter) {
        this.batch = order._id.replace(/^order:/, '');
        this.plant = order.plant.name;
        this.pots = order.quantity;
        this.shipWeek = moment(order.arrivalDate).isoWeek();

        const filterWeek = filter.weekNumber,
            filterYear = filter.yearNumber,
            week = _.find(order.zone.weeks, week => {
                return week.week === filterWeek && week.year === filterYear;
            }),
            tables = week ? week.tables : 0;
        this.tables = tables;

        const shippingDate = moment(order.arrivalDate),
            shippingWeek = shippingDate.isoWeek(),
            shippingYear = shippingDate.isoWeekYear();
        this.isShippingThisWeek = (shippingWeek === filterWeek && shippingYear === filterYear);

        const flowerDate = moment(order.flowerDate),
            flowerWeek = flowerDate.isoWeek(),
            flowerYear = flowerDate.isoWeekYear();
        this.isFloweringThisWeek = (flowerWeek == filterWeek && flowerYear === filterYear);

    }
}

export class WeekDetailService {

    constructor(private orders:OrderDocument[]) { }

    filter(filter:WeekDetailFilter):WeekDetailOrder[] {

        const filterStart = moment(filter.startDate).startOf('isoweek'),
            filterEnd = moment(filter.endDate).endOf('isoweek');

        return this.orders
            .filter(zones)
            .filter(dates)
            .map(o => new WeekDetailOrder(o, filter));

        function dates(order:OrderDocument):boolean {
            if(filter.startDate == null) return true;

            return moment(order.stickDate).startOf('isoweek').isSameOrBefore(filterEnd) &&
                (moment(order.arrivalDate).endOf('isoweek').isSameOrAfter(filterStart));
        }

        function zones(order:OrderDocument):boolean {
            if(!filter.zone) return true;

            return filter.zone === order.zone.name;
        }
    }
}
