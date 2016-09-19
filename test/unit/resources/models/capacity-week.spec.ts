import {CapacityWeek} from "../../../../src/resources/models/capacity-week";
import {Week} from "../../../../src/resources/models/week";
import {OrderWeek} from "../../../../src/resources/models/order";

describe('capacity week', () => {
    let capacityWeek:CapacityWeek,
        week:Week = {
            _id: 'week:2017.1',
            year: 2017,
            week: 1,
            zones: {
                A: { zone: { name: 'A', tables: 100, available: 50 }, available: 50 },
                B: { zone: { name: 'B', tables: 200, available: 25 }, available: 25 },
            }
        };

    beforeEach(() => {
        capacityWeek = new CapacityWeek(week);
    })

    it('sets the properties from the constructor', () => {

        expect(capacityWeek._id).toEqual('week:2017.1');
        expect(capacityWeek.year).toEqual(2017);
        expect(capacityWeek.week).toEqual(1);

        const zones = capacityWeek.zones;
        expect(zones.hasOwnProperty('A')).toEqual(true);

        const zone = zones['A'];
        expect(zone.zone).toEqual(week.zones['A'].zone);
        expect(zone.tables).toEqual(100);
        // they're initially all available
        expect(zone.available).toEqual(100);
    });

    it('deducts from the available when an order is added', () => {
        const orderWeek:OrderWeek = {
            year: 2017,
            week: 1,
            tables: 50,
            available: 50
        };

        expect(capacityWeek.zones['A'].available).toEqual(100);

        capacityWeek.addOrder('A', orderWeek);

        expect(capacityWeek.zones['A'].available).toEqual(50);
    });
});
