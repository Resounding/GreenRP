import {autoinject} from 'aurelia-framework';
import {CapacityWeek} from '../../models/capacity-week';
import {Week} from '../../models/week';
import {ReferenceData} from '../reference-data';
import {OrderDocument, OrderWeek} from '../../models/order';
import {OrdersService} from '../data/orders-service';

@autoinject()
export class CapacityService {
    constructor(private referenceData:ReferenceData, private ordersService:OrdersService) { }

    getCapacityWeeks(year?:number):Promise<Map<string, CapacityWeek>> {

        return new Promise((resolve, reject) => {
            this.ordersService.getAll()
                .then((orders:OrderDocument[]) => {
                    const weeks:Week[] = this.referenceData.weeks,
                        capacityWeeks = new Map<string,CapacityWeek>();

                    weeks.forEach((w:Week) => {
                        if(!year || w.year === year) {
                            const key = makeKey(w),
                                value = new CapacityWeek(w);

                            capacityWeeks.set(key, value);
                        }
                    });

                    orders.forEach((order:OrderDocument) => {
                        order.zone.weeks.forEach((w:OrderWeek) => {
                            const key = makeKey(w);
                            if (capacityWeeks.has(key)) {
                                capacityWeeks.get(key).addOrder(order, w);
                            }
                        });
                    });

                    resolve(capacityWeeks);
                })
                .catch(reject);
        });
    }
}

function makeKey(week:Week|OrderWeek) {
    return `week:${week.year}.${week.week}`
}
