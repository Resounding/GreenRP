import {autoinject} from 'aurelia-framework';
import {CapacityWeek} from '../../models/capacity-week';
import {Week} from '../../models/week';
import {ReferenceService} from '../data/reference-service';
import {OrderDocument, OrderWeek} from '../../models/order';
import {OrdersService} from '../data/orders-service';

@autoinject()
export class CapacityService {
    constructor(private referenceService:ReferenceService, private ordersService:OrdersService) { }

    getCapacityWeeks(year?:number):Promise<Map<string, CapacityWeek>> {

        return new Promise((resolve, reject) => {
            return this.ordersService.getAll()
                .then((orders:OrderDocument[]) => {
                    return this.referenceService.weeks()
                        .then((weeks) => {
                            const capacityWeeks = new Map<string,CapacityWeek>();

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
                })
                .catch(reject);
        });
    }
}

function makeKey(week:Week|OrderWeek) {
    return `week:${week.year}.${week.week}`
}
