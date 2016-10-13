import {CapacityService} from "../../../../../src/resources/services/domain/capacity-service";
import {OrdersService} from "../../../../../src/resources/services/data/orders-service";
import {Week} from "../../../../../src/resources/models/week";
import {Order} from "../../../../../src/resources/models/order";

describe('the capacity service', () => {
    let service:CapacityService,
        ordersService:OrdersService,
        weeks:Week[] = [
            { _id: '', year: 2016, week: 52, zones: {
                A: { zone: { name: 'A', tables: 100, autoSpace: false, isPropagationZone: false}, available: 100 }
            }},
            { _id: '', year: 2017, week: 1, zones: {
                A: { zone: { name: 'A', tables: 100, autoSpace: false, isPropagationZone: true}, available: 100 }
            }},
            { _id: '', year: 2017, week: 2, zones: {
                A: { zone: { name: 'A', tables: 100, autoSpace: false, isPropagationZone: false}, available: 100 }
            }}
        ];

    beforeEach(() => {
        ordersService = new OrdersService(null, null);
        ordersService.create = (order:Order) => null;
        ordersService.getAll = () => { return Promise.resolve([]); };

        const referenceData = {
            weeks: weeks
        };
        service = new CapacityService(referenceData, ordersService);
    });

    it('returns a map of all the weeks', (done) => {

        service.getCapacityWeeks()
            .then(weeks => {
                expect(weeks.size).toEqual(3);
                done();
            });
    });

    it('filters for the year', (done) => {

        service.getCapacityWeeks(2017)
            .then(weeks => {
                expect(weeks.size).toEqual(2);
                done();
            });
    });
});
