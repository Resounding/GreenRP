import {CapacityService} from "../../../../../src/resources/services/domain/capacity-service";
import {OrdersService} from "../../../../../src/resources/services/data/orders-service";
import {ReferenceService} from "../../../../../src/resources/services/data/reference-service";
import {Week} from "../../../../../src/resources/models/week";
import {Order} from "../../../../../src/resources/models/order";

describe('the capacity service', () => {
    let service:CapacityService,
        ordersService:OrdersService,
        weeks:Week[],
        referenceService:ReferenceService;

    beforeEach(() => {

         weeks = [
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
        
        ordersService = new OrdersService(null, null);
        ordersService.create = (order:Order) => null;
        ordersService.getAll = () => { return Promise.resolve([]); };

        referenceService = new ReferenceService(null);
        referenceService.weeks = function():Promise<Week[]> {
            return Promise.resolve(weeks);
        }
        service = new CapacityService(referenceService, ordersService);
    });

    it('returns a map of all the weeks', (done) => {

        return service.getCapacityWeeks()
            .then(weeks => {
                expect(weeks.size).toEqual(3);
                return done();
            });
    });

    it('filters for the year', (done) => {

        return service.getCapacityWeeks(2017)
            .then(weeks => {
                expect(weeks.size).toEqual(2);
                return done();
            });
    });
});
