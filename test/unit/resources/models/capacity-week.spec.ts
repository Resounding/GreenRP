import {CapacityWeek} from "../../../../src/resources/models/capacity-week";
import {Week} from "../../../../src/resources/models/week";
import {OrderDocument, WeekInHouse} from "../../../../src/resources/models/order";

describe('capacity week', () => {
    let capacityWeek:CapacityWeek,
        week:Week = {
            _id: 'week:2017.1',
            year: 2017,
            week: 1,
            zones: {
                A: { zone: { name: 'A', tables: 100, autoSpace: false, isPropagationZone: false }, available: 50, tables: 50 },
                B: { zone: { name: 'B', tables: 200, autoSpace: false, isPropagationZone: true }, available: 25, tables: 75 },
            }
        };

    beforeEach(() => {
        capacityWeek = new CapacityWeek(week);
    });

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
        const weekInHouse:WeekInHouse = {
            year: 2017,
            week: 1,
            tables: 50,
            zone: 'A'
        };
        const order:OrderDocument = new OrderDocument({
            _id: '123',
            _rev: '1',
            type: 'order',
            arrivalDate: new Date(2017, 1, 15),
            flowerDate: new Date(2017, 1, 9),
            lightsOutDate: new Date(2017, 0, 19),
            stickDate: new Date(2017, 0, 1),
            quantity: 1000,
            partialSpace: false,
            customer: { abbreviation: 'Shw', name: 'Shaws' },
            plant: {
                name: "4.5\"Mums",
                abbreviation: "4M",
                crop: "Mums",
                size: "4.5\"",
                cuttingsPerPot: 1,
                cuttingsPerTable: {
                    tight: 1000,
                    full: 500
                },
                potsPerCase: 8,
                hasLightsOut: false
            },
            weeksInHouse: {
                "week:2017-1": { zone: 'A', tables: 1, year: 2017, week: 1 },
                "week:2017-2": { zone: 'A', tables: 1, year: 2017, week: 2 },
                "week:2017-3": { zone: 'A', tables: 1, year: 2017, week: 3 },
                "week:2017-4": { zone: 'A', tables: 2, year: 2017, week: 4 },
                "week:2017-5": { zone: 'A', tables: 2, year: 2017, week: 5 },
                "week:2017-6": { zone: 'A', tables: 2, year: 2017, week: 6 }
            },
            zone: {
                name: 'A',
                tables: 100,
                autoSpace: false,
                isPropagationZone: false
            },
            rootInPropArea: false
        });

        expect(capacityWeek.zones['A'].available).toEqual(100);

        capacityWeek.addOrder(weekInHouse);

        expect(capacityWeek.zones['A'].available).toEqual(50);
    });
});
