import {OrderCalculator} from '../../../../../src/resources/services/domain/order-calculator';
import {CalculatorZone} from '../../../../../src/resources/services/domain/models/calculator-zone';
import {Events, CalculatorWeek} from "../../../../../src/resources/services/domain/models/calculator-week";
import {Customer} from '../../../../../src/resources/models/customer';
import {Zone} from '../../../../../src/resources/models/zone';
import {Season} from "../../../../../src/resources/models/season";
import {Plant} from "../../../../../src/resources/models/plant";
import {SeasonTime} from "../../../../../src/resources/models/season-time";
import {CapacityWeek, CapacityWeekZones} from "../../../../../src/resources/models/capacity-week";
import {OrderDocument} from "../../../../../src/resources/models/order";
import {Week, WeekZones} from "../../../../../src/resources/models/week";

class ReferenceData {
    get weeks():Week[] {
        const start = moment(new Date(2016,1,1)).startOf('year'),
            zones:WeekZones =  {
            A: {
                zone: {
                    name: 'A',
                        tables: 352,
                        autoSpace: false,
                        isPropagationZone: false
                },
                available: 50,
                tables: 50,
                selected: false
            },
            'B/C': {
                zone: {
                    name: 'B/C',
                        tables: 126,
                        autoSpace: false,
                        isPropagationZone: true
                },
                available: 20,
                tables: 80,
                selected: false
            },
            D: {
                zone: {
                    name: 'D',
                        tables: 154,
                        autoSpace: false,
                        isPropagationZone: false
                },
                available: 50,
                tables: 50,
                selected: false
            },
            E: {
                zone: {
                    name: 'E',
                        tables: 185,
                        autoSpace: false,
                        isPropagationZone: false
                },
                available: 80,
                tables: 20,
                selected: false
            },
            'F/G': {
                zone: {
                    name: 'F/G',
                        tables: 681,
                        autoSpace: true,
                        isPropagationZone: false
                },
                available: 80,
                tables: 20,
                selected: false
            }
        };

        return _.chain(_.range(0, 100))
            .map(idx => {
                const date = start.clone().add(idx, 'weeks');

                return {
                    _id: date.toWeekNumberId(),
                    year: date.isoWeekYear(),
                    week: date.isoWeek(),
                    zones: zones
                };
            })
            .value();
    }
}

describe('the order calculator', () => {
    let calculator:OrderCalculator,
        zones:Zone[],
        weeks:Map<string, CapacityWeek>,
        seasons:Season[],
        propagationTimes:SeasonTime[],
        flowerTimes:SeasonTime[];


    beforeEach(() => {
        zones = [
            { name: 'A', tables: 100, autoSpace: false, isPropagationZone: false },
            { name: 'B', tables: 100, autoSpace: false, isPropagationZone: true },
            { name: 'C', tables: 100, autoSpace: false, isPropagationZone: false }
        ];
        weeks = new Map<string, CapacityWeek>([
            ['week:2017.1', new CapacityWeek({_id: 'week:2017.1', year: 2017, week: 1, zones: {
                A: { zone: zones[0], available: 10, tables: 0, selected: false },
                B: { zone: zones[1], available: 5, tables: 0, selected: false },
                C: { zone: zones[2], available: 50, tables: 0, selected: false }
            }})],
            ['week:2017.2', new CapacityWeek({_id: 'week:2017.2', year: 2017, week: 2, zones: {
                A: { zone: zones[0], available: 20, tables: 0, selected: false },
                B: { zone: zones[1], available: 0, tables: 0, selected: false },
                C: { zone: zones[2], available: 10, tables: 0, selected: false }
            }})],
            ['week:2017.3', new CapacityWeek({_id: 'week:2017.1', year: 2017, week: 3, zones: {
                A: { zone: zones[0], available: 5, tables: 0, selected: false },
                B: { zone: zones[1], available: 5, tables: 0, selected: false },
                C: { zone: zones[2], available: 5, tables: 0, selected: false }
            }})]
        ]);
        seasons = [
            {
                name: 'spring',
                year: 2017,
                week: 1
            }
        ];
        propagationTimes = [];
        flowerTimes = [];
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);
    });

    it('contains the zones as a property', () => {
        expect(calculator.zones.length).toBe(zones.length);
    });

    it('creates an order', () => {
        expect(calculator.order).toBeDefined();
    });

    it('sorts the zones by name', () => {
        zones.unshift({
            name: 'Z', tables: 100, autoSpace: false, isPropagationZone: false
        });
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);
        expect(zones[0].name).toBe('Z');
        expect(calculator.zones[0].name).toBe('A');
        expect(calculator.zones[3].name).toBe('Z');
    });

    it('sets the propagation zone', () => {
        expect(calculator.zones[1].name).toBe('B');
        expect(calculator.zones[1].isPropagationZone).toBe(true);
        expect(calculator.propagationZone.name).toEqual('B')
    });

    it('adds the shipping week', () => {
        const date = new Date(2017, 0, 12),
            m = moment(date),
            year = m.isoWeekYear(),
            week = m.isoWeek();

        expect(year).toEqual(2017);
        expect(week).toEqual(2);

        calculator.setArrivalDate(date);

        const lastWeek = _.last(calculator.weeks);

        expect(lastWeek.week.year).toEqual(year);
        expect(lastWeek.week.week).toEqual(week);
        expect(lastWeek.events.length).toEqual(1);
        expect(lastWeek.events[0].name).toEqual(Events.ShipEventName);
        expect(lastWeek.events[0].date).toEqual(date);
    });

    it('adds the flower lead time event', () => {
        const date = new Date(2017, 0, 13),
            m = moment(date),
            year = m.isoWeekYear(),
            week = m.isoWeek(),
            dayOfWeek = m.format('dddd'),
            flowerMoment = m.add(-4, 'days');

        expect(year).toEqual(2017);
        expect(week).toEqual(2);
        expect(dayOfWeek).toEqual('Friday');

        expect(flowerMoment.year()).toEqual(2017);
        expect(flowerMoment.isoWeek()).toEqual(2);
        expect(flowerMoment.format('dddd')).toEqual('Monday');

        calculator.setArrivalDate(date);

        const lastWeek = _.last(calculator.weeks);

        expect(lastWeek.events.length).toEqual(2);
        expect(lastWeek.events[0].name).toEqual(Events.FlowerEventName);
        expect(lastWeek.events[0].date).toEqual(flowerMoment.toDate());
        expect(lastWeek.events[1].name).toEqual(Events.ShipEventName);
        expect(lastWeek.events[1].date).toEqual(date);
    });

    it('adds a week for the flower lead time event if required', () => {
        const date = new Date(2017, 0, 9),
            m = moment(date),
            year = m.isoWeekYear(),
            week = m.isoWeek(),
            dayOfWeek = m.format('dddd'),
            flowerMoment = m.add(-4, 'days');

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);

        expect(year).toEqual(2017);
        expect(week).toEqual(2);
        expect(dayOfWeek).toEqual('Monday');

        expect(flowerMoment.year()).toEqual(2017);
        expect(flowerMoment.isoWeek()).toEqual(1);
        expect(flowerMoment.format('dddd')).toEqual('Thursday');

        calculator.setArrivalDate(date);

        const secondLast = calculator.weeks[calculator.weeks.length - 2];

        expect(secondLast).toBeDefined();
        expect(secondLast.events.length).toEqual(1);
        expect(secondLast.events[0].name).toEqual(Events.FlowerEventName);
        expect(secondLast.events[0].date).toEqual(flowerMoment.toDate());
    });

    it('adds weeks for lights-out', () => {
        const
            date = new Date(2017, 0, 9),
            mum:Plant = { id: 1, name: "4.5\" Mums", abbreviation: 'M', crop: 'Mums', size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
                tight: 1000,
                half: 800,
                full: 500
            },
            potsPerCase: 8,
            hasLightsOut: true };

        flowerTimes = [
            {
                plant: mum.name,
                year: 2017,
                times: 8
            }
        ];

        let rawWeeks = new ReferenceData().weeks;
        weeks = new Map<string, CapacityWeek>();
        rawWeeks.forEach(w => weeks.set(w._id, new CapacityWeek(w)));
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);

        calculator.setArrivalDate(date);
        calculator.setPlant(mum);

        expect(calculator.weeks.length).toEqual(10);
    });

    it('names the event lights-out if plant has lights out', () => {
        const
            date = new Date(2017, 0, 9),
            mum:Plant = { id: 1, name: "4.5\" Mums", abbreviation: 'M', crop: 'Mums', size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
                tight: 1000,
                half: 800,
                full: 500
            },
            potsPerCase: 8,
            hasLightsOut: true };

        seasons = [
            {
                name: 'spring',
                year: 2017,
                week: 1
            }
        ];
        flowerTimes = [
            {
                plant: mum.name,
                year: 2017,
                times: 8
            }
        ];

        let rawWeeks = new ReferenceData().weeks;
        weeks = new Map<string, CapacityWeek>();
        rawWeeks.forEach(w => weeks.set(w._id, new CapacityWeek(w)));

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);

        calculator.setArrivalDate(date);
        calculator.setPlant(mum);

        const event = calculator.weeks[0].events[0];

        expect(event.name).toEqual(Events.LightsOutEventName);
    });

    it('names the event spacing if plant doesn\'t have lights out', () => {
        const
            date = new Date(2017, 0, 9),
            mum:Plant = { id: 1, name: "4.5\" Kalanchoe", abbreviation: 'K', crop: 'Kalanchoe', size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
                tight: 1000,
                half: 800,
                full: 500
            },
            potsPerCase: 8,
            hasLightsOut: false };

        seasons = [
            {
                name: 'spring',
                year: 2017,
                week: 1
            }
        ];
        flowerTimes = [
            {
                plant: mum.name,
                year: 2017,
                times: 8
            }
        ];

        let rawWeeks = new ReferenceData().weeks;
        weeks = new Map<string, CapacityWeek>();
        rawWeeks.forEach(w => weeks.set(w._id, new CapacityWeek(w)));

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);

        calculator.setArrivalDate(date);
        calculator.setPlant(mum);

        const event = calculator.weeks[0].events[0];

        expect(event.name).toEqual(Events.SpacingEventName);
    });

    it('adds weeks for sticking', () => {
        const
            date = new Date(2017, 0, 9),
            mum:Plant = { id: 1, name: "4.5\" Mums", abbreviation: 'M', crop: 'Mums', size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
                tight: 1000,
                half: 800,
                full: 500
            },
            potsPerCase: 8,
            hasLightsOut: true };

        seasons = [
            {
                name: "spring",
                year: 2017,
                week: 1
            },
            {
                name: "summer",
                year: 2017,
                week: 13
            },
            {
                name: "fall",
                year: 2017,
                week: 26
            },
            {
                name: "winter",
                year: 2017,
                week: 39
            }
        ];
        propagationTimes = [
            {
                year: 2017,
                plant: mum.name,
                times: 3
            }
        ];

        flowerTimes = [
            {
                year: 2017,
                plant: mum.name,
                times: 8
            }
        ];

        let rawWeeks = new ReferenceData().weeks;
        weeks = new Map<string, CapacityWeek>();
        rawWeeks.forEach(w => weeks.set(w._id, new CapacityWeek(w)));

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);

        calculator.setArrivalDate(date);
        calculator.setPlant(mum);

        expect(calculator.weeks.length).toEqual(13);
    });

    it('sets all properties when constructed with an order', () => {
        const order:OrderDocument = new OrderDocument({
            _id: '123',
            _rev: '1',
            orderNumber: 'WK2016-07',
            type: OrderDocument.OrderDocumentType,
            arrivalDate: new Date(2017, 5, 12), // June 12, 2017: Week 24
            partialSpaceDate: null,
            flowerDate: new Date(2017,5, 8), // June 8, 2017: Week 23
            fullSpaceDate: null,
            lightsOutDate:new Date(2017, 4, 18), // May 18, 2017: 3 weeks before flower: week 20
            stickDate: new Date(2017, 3, 13), // Apr 13, 2017: 5 weeks before lights-out
            quantity:1000,
            customer:{name: 'Sobeys', abbreviation: 'Sb'},
            plant:{id: 1234, name: '4.5" Mums', abbreviation: 'M', size: '4.5"', crop: 'Mums', cuttingsPerPot: 5, cuttingsPerTable: {
                full: 500,
                tight: 1000
            }, potsPerCase: 8, hasLightsOut: true},
            zone: {
                name: 'A',
                tables: 500,
                autoSpace: false,
                isPropagationZone: false
            },
            weeksInHouse: {
                'week:2017-17': { zone: 'A', tables: 1, year: 2017, week: 17 },
                'week:2017-18': { zone: 'A', tables: 1, year: 2017, week: 18 },
                'week:2017-19': { zone: 'A', tables: 1, year: 2017, week: 19 },
                'week:2017-20': { zone: 'A', tables: 1, year: 2017, week: 20 },
                'week:2017-21': { zone: 'A', tables: 1, year: 2017, week: 21 },
                'week:2017-22': { zone: 'A', tables: 2, year: 2017, week: 22 },
                'week:2017-23': { zone: 'A', tables: 2, year: 2017, week: 23 },
                'week:2017-24': { zone: 'A', tables: 2, year: 2017, week: 24 }
            },
            partialSpace: false
        }),
        thisFlowerTimes:SeasonTime[] = [
            { plant: order.plant.name, year: 2017, times: 3 }
        ],
        thisPropagationTimes:SeasonTime[] = [
            { plant: order.plant.name, year: 2017, times: 5 }
        ];

        calculator = new OrderCalculator(zones, weeks, seasons, thisPropagationTimes, thisFlowerTimes, order);

        expect(calculator.order.arrivalDate).toEqual(order.arrivalDate);
        expect(calculator.order.lightsOutDate).toEqual(order.lightsOutDate);
        expect(calculator.order.stickDate).toEqual(order.stickDate);
        expect(calculator.order.customer.name).toEqual('Sobeys');
        expect(calculator.order.plant.name).toEqual('4.5" Mums');
        expect(calculator.order.quantity).toEqual(1000);
    });

    it('adds the partial space event if partially spaced', () => {
        const
            date = new Date(2017, 0, 9),
            gerbera:Plant = { id: 4, name: "4.5\" Gerbera", abbreviation: 'G', crop: 'Gerbera', size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
                    tight: 1000,
                    half: 800,
                    full: 500
                },
                potsPerCase: 8,
                hasLightsOut: true
            };

        seasons = [
            {
                name: 'spring',
                year: 2017,
                week: 1
            }
        ];
        propagationTimes = [
            {
                plant: gerbera.name,
                times: 3,
                year: 2017
            }
        ];
        flowerTimes = [
            {
                plant: gerbera.name,
                year: 2017,
                times: 8
            }
        ];

        let rawWeeks = new ReferenceData().weeks;
        weeks = new Map<string, CapacityWeek>();
        rawWeeks.forEach(w => weeks.set(w._id, new CapacityWeek(w)));

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);
        calculator.setArrivalDate(date);
        calculator.setPlant(gerbera);

        let partialSpaceWeek = calculator.weeks[2],
            lightsOutWeek = calculator.weeks[3],
            fullSpaceWeek = calculator.weeks[4];

        expect(partialSpaceWeek.events.length).toEqual(0);
        expect(lightsOutWeek.events[0].name).toEqual('Lights Out');
        expect(fullSpaceWeek.events.length).toEqual(0);

        calculator.partialSpace = true;

        partialSpaceWeek = calculator.weeks[2];
        lightsOutWeek = calculator.weeks[3];
        fullSpaceWeek = calculator.weeks[4];

        expect(partialSpaceWeek.events[0].name).toEqual('Partial Space');
        expect(lightsOutWeek.events[0].name).toEqual('Lights Out');
        expect(fullSpaceWeek.events[0].name).toEqual('Full Space');
    });
});

describe('changing date', () => {
    let calculator:OrderCalculator,
        zones:Zone[],
        weeks:Map<string, CapacityWeek>,
        seasons:Season[],
        plant:Plant,
        propagationTimes:SeasonTime[],
        flowerTimes:SeasonTime[],
        arrival:Date; // Friday, July 7, 2017

    beforeEach(() => {
        zones = [
            { name: 'A', tables: 100, autoSpace: false, isPropagationZone: false}
        ];
        seasons = [
            {
                name: 'spring',
                year: 2017,
                week: 1
            }
        ];
        plant = {
            id: 1,
            name: '6" Mums',
            abbreviation: 'M',
            size: '6"',
            crop: 'Mums',
            cuttingsPerPot: 1,
            cuttingsPerTable: {
                tight: 1000,
                half: 500,
                full: 250
            },
            potsPerCase: 8,
            hasLightsOut: false
        };
        propagationTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 3
            }
        ];
        flowerTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 8
            }
        ];
        arrival = new Date(2017, 6, 7); // Friday, July 7, 2017

        const rawWeeks = new ReferenceData().weeks;
        weeks = new Map<string, CapacityWeek>();
        rawWeeks.forEach(w => weeks.set(w._id, new CapacityWeek(w)));

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes)
            .setPlant(plant)
            .setArrivalDate(arrival);
    });

    it('starts with the right dates', () => {
        const weeks:CalculatorWeek[] = calculator.weeks;

        expect(weeks.length).toEqual(12);

        expect(weeks[11].events[1].date).toEqual(arrival); // arrival date
        expect(weeks[11].events[0].date).toEqual(new Date(2017, 6, 3)); // flower date - 4 days prior
        expect(weeks[3].events[0].date).toEqual(new Date(2017, 4, 8)); // space week - 8 weeks prior
        expect(weeks[0].events[0].date).toEqual(new Date(2017, 3, 17)); // stick week - 3 weeks prior
    });

    it('doesn\'t move any other dates when moving the flower week', () => {

        const flowerDate = new Date(2017, 6, 5);
        calculator.setFlowerDate(flowerDate);

        const weeks:CalculatorWeek[] = calculator.weeks;

        expect(weeks.length).toEqual(12);

        expect(weeks[11].events[1].date).toEqual(arrival); // arrival date
        expect(weeks[11].events[0].date).toEqual(flowerDate); // flower date
        expect(weeks[3].events[0].date).toEqual(new Date(2017, 4, 8)); // space week - 8 weeks prior
        expect(weeks[0].events[0].date).toEqual(new Date(2017, 3, 17)); // stick week - 3 weeks prior
    });

    it('adds a week when moving the flower week back', () => {

        const flowerDate = new Date(2017, 6, 1); // saturday of previous week
        calculator.setFlowerDate(flowerDate);

        const weeks:CalculatorWeek[] = calculator.weeks;

        expect(weeks.length).toEqual(12);

        expect(weeks[11].events[0].date).toEqual(arrival); // arrival date
        expect(weeks[10].events[0].date).toEqual(flowerDate); // flower date. now in previous week
        expect(weeks[3].events[0].date).toEqual(new Date(2017, 4, 8)); // space week - no change
        expect(weeks[0].events[0].date).toEqual(new Date(2017, 3, 17)); // stick week - no change
    });

    it('doesn\'t affect the stick date when setting the lights-out date', () => {

        const lightsOut = new Date(2017, 4, 1); // moved this back a week
        calculator.setLightsOutDate(lightsOut);

        const weeks:CalculatorWeek[] = calculator.weeks;

        expect(weeks.length).toEqual(12); // no change

        expect(weeks[11].events[1].date).toEqual(arrival); // arrival date
        expect(weeks[11].events[0].date).toEqual(new Date(2017, 6, 3)); // flower date - 4 days prior
        expect(weeks[2].events[0].date).toEqual(lightsOut); // space week - as set, now 1 week earlier
        expect(weeks[0].events[0].date).toEqual(new Date(2017, 3, 17)); // stick week - left alone
    });

    it('sets the stick date', () => {

        const stick = new Date(2017, 3, 10); // moved this back a week
        calculator.setStickDate(stick);

        const weeks:CalculatorWeek[] = calculator.weeks;

        expect(weeks.length).toEqual(13); // increased by a week

        expect(weeks[12].events[1].date).toEqual(arrival); // arrival date
        expect(weeks[12].events[0].date).toEqual(new Date(2017, 6, 3)); // flower date - 4 days prior
        expect(weeks[4].events[0].date).toEqual(new Date(2017, 4, 8)); // space week - no change to date
        expect(weeks[0].events[0].date).toEqual(stick); // stick week - as set
    });

    it('saves the potsPerCase for the order plant', () => {
        calculator.order.zone = new CalculatorZone({name: 'A', autoSpace: false, tables: 500, isPropagationZone: false });
        const order = calculator.getOrderDocument();

        expect(order.plant.potsPerCase).toEqual(8);
    });

    it('sets the partial space date', () => {
        const
            date = new Date(2017, 0, 9),
            gerbera:Plant = { id: 4, name: "4.5\" Gerbera", abbreviation: 'G', crop: 'Gerbera', size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
                    tight: 1000,
                    half: 800,
                    full: 500
                },
                potsPerCase: 8,
                hasLightsOut: true
            };

        seasons = [{ name: 'spring', year: 2017, week: 1 }];
        propagationTimes = [{ plant: gerbera.name, times: 3, year: 2017 }];
        flowerTimes = [{ plant: gerbera.name, year: 2017, times: 8 }];

        let rawWeeks = new ReferenceData().weeks;
        weeks = new Map<string, CapacityWeek>();
        rawWeeks.forEach(w => weeks.set(w._id, new CapacityWeek(w)));

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);
        calculator.setArrivalDate(date);
        calculator.setPlant(gerbera);
        calculator.partialSpace = true;

        let partialSpaceWeek = calculator.weeks[2],
            lightsOutWeek = calculator.weeks[3],
            fullSpaceWeek = calculator.weeks[4];

        expect(partialSpaceWeek.events[0].name).toEqual('Partial Space');
        expect(lightsOutWeek.events[0].name).toEqual('Lights Out');
        expect(fullSpaceWeek.events[0].name).toEqual('Full Space');

        let newPartialSpaceDate = moment(calculator.order.lightsOutDate).subtract(1, 'day').toDate(),
            newFullSpaceDate = moment(calculator.order.lightsOutDate).add(1, 'day').toDate();

        calculator.setPartialSpaceDate(newPartialSpaceDate);
        calculator.setFullSpaceDate(newFullSpaceDate);

        partialSpaceWeek = calculator.weeks[2];
        lightsOutWeek = calculator.weeks[3];
        fullSpaceWeek = calculator.weeks[4];

        expect(partialSpaceWeek.events.length).toEqual(0);
        expect(lightsOutWeek.events[0].name).toEqual('Partial Space');
        expect(lightsOutWeek.events[1].name).toEqual('Lights Out');
        expect(lightsOutWeek.events[2].name).toEqual('Full Space');
        expect(fullSpaceWeek.events.length).toEqual(0);
    });
});

describe('setting zones', () => {
    let calculator:OrderCalculator,
        zones:Zone[],
        weeks:Map<string, CapacityWeek>,
        seasons:Season[],
        plant:Plant,
        propagationTimes:SeasonTime[],
        flowerTimes:SeasonTime[],
        arrival:Date; // Friday, July 7, 2017

    beforeEach(() => {
        zones = [
            { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100},
            { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100},
            { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100}
        ];
        seasons = [
            {
                name: 'spring',
                year: 2017,
                week: 1
            }
        ];
        plant = {
            id: 1,
            name: '6" Mums',
            abbreviation: 'M',
            size: '6"',
            crop: 'Mums',
            cuttingsPerPot: 1,
            cuttingsPerTable: {
                tight: 1000,
                half: 500,
                full: 250
            },
            potsPerCase: 8,
            hasLightsOut: false
        };
        propagationTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 3
            }
        ];
        flowerTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 8
            }
        ];
        arrival = new Date(2017, 6, 7); // Friday, July 7, 2017

        const rawWeeks = new ReferenceData().weeks,
            capacityZones:CapacityWeekZones = {
                A: Object.assign({}, zones[0], { available: zones[0].tables, zone: zones[0] }),
                B: Object.assign({}, zones[1], { available: zones[1].tables, zone: zones[1] }),
                C: Object.assign({}, zones[2], { available: zones[2].tables, zone: zones[2] })
            };
        weeks = new Map<string, CapacityWeek>();
        rawWeeks.forEach(w => {
            const capacityWeek = new CapacityWeek(w);
            capacityWeek.zones = capacityZones;
            weeks.set(w._id, capacityWeek);
        });

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes)
            .setPlant(plant)
            .setArrivalDate(arrival);
    });

    describe('setZone', () => {
        it('sets all the zones', () => {
            calculator.setZone({ name: 'A', tables: 100, autoSpace: false, isPropagationZone: false, weeks: [], canFit: true });
            const order = calculator.getOrderDocument();
            _.forEach(order.weeksInHouse, (week) => {
                expect(week.zone).toEqual('A');
            });
        });
    });

    describe('setZoneForWeek', () => {
        it('sets the zone for only that week', () => {
            calculator.setZone({ name: 'C', tables: 100, autoSpace: false, isPropagationZone: false, weeks: [], canFit: true });
            const threeWeeksBefore = moment(arrival).subtract(3, 'weeks'),
                zoneA:Zone = {name: 'A', autoSpace: false, isPropagationZone: false, tables: 100},
                weekIdToSet = threeWeeksBefore.toWeekNumberId(),
                weekToSet:Week = {_id: weekIdToSet, week: threeWeeksBefore.isoWeek(), year: threeWeeksBefore.isoWeekYear(), zones: {}};
            calculator.setZoneForWeek(zoneA, weekToSet);
            const order = calculator.getOrderDocument(),
                weekIds = Object.keys(order.weeksInHouse);

            for(let i=0; i<weekIds.length; i++) {
                const weekId = weekIds[i];
                if(weekId === weekIdToSet) {
                    expect(order.weeksInHouse[weekId].zone).toEqual('A');
                } else {
                    expect(order.weeksInHouse[weekId].zone).toEqual('C');
                }
            }

        });
    });

    describe('setZoneFromEventOnward', () => {
        it('sets all the zones from that week forward', () => {
            calculator.setZone({ name: 'C', tables: 100, autoSpace: false, isPropagationZone: false, weeks: [], canFit: true });
            const twoWeeksBefore = moment(arrival).subtract(2, 'weeks');
            calculator.setZoneFromEventOnward('A', twoWeeksBefore.toWeekNumberId());
            const order = calculator.getOrderDocument(),
                weekIds = Object.keys(order.weeksInHouse);

            for(let i=0; i<weekIds.length; i++) {
                const weekId = weekIds[i];
                if(i<weekIds.length - 3) {
                    expect(order.weeksInHouse[weekId].zone).toEqual('C');
                } else {
                    expect(order.weeksInHouse[weekId].zone).toEqual('A');
                }
            }

        });
    });
});

describe('setRepeatingValues()', () => {
    let calculator:OrderCalculator,
        repeaters:OrderCalculator[],
        zones:Zone[],
        weeks:Map<string, CapacityWeek>,
        seasons:Season[],
        plant:Plant,
        customer:Customer,
        propagationTimes:SeasonTime[],
        flowerTimes:SeasonTime[],
        arrival:Date; // Friday, July 7, 2017

    beforeEach(() => {
        zones = [
            { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100},
            { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100},
            { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100}
        ];
        seasons = [
            {
                name: 'spring',
                year: 2017,
                week: 1
            }
        ];
        plant = {
            id: 1,
            name: '6" Mums',
            abbreviation: 'M',
            size: '6"',
            crop: 'Mums',
            cuttingsPerPot: 1,
            cuttingsPerTable: {
                tight: 1000,
                half: 500,
                full: 250
            },
            potsPerCase: 8,
            hasLightsOut: false
        };
        customer = {name: 'Sobeys', abbreviation: 'Sb'},
        propagationTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 3
            }
        ];
        flowerTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 3
            }
        ];
        arrival = new Date(2017, 6, 7); // Friday, July 7, 2017

        const rawWeeks = new ReferenceData().weeks,
            capacityZones:CapacityWeekZones = {
                A: {zone: zones[0], tables: zones[0].tables, available: zones[0].tables},
                B: {zone: zones[1], tables: zones[1].tables, available: zones[1].tables},
                C: {zone: zones[2], tables: zones[2].tables, available: zones[2].tables}
            };
        weeks = new Map<string, CapacityWeek>();
        rawWeeks.forEach(w => {
            const capacityWeek = new CapacityWeek(w);
            capacityWeek.zones = capacityZones;
            weeks.set(w._id, capacityWeek);
        });

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes)
            .setPlant(plant)
            .setArrivalDate(arrival);
        calculator.orderQuantity = 1000;
        calculator.order.customer = customer;
        repeaters = [
            new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes),
            new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes)
        ];
    });

    it('sets values correctly', () => {
        const arrivalDate = moment(arrival).add(5, 'days').toDate(),
            repeater = repeaters[0];
        repeater.setRepeater(calculator, arrivalDate);
        expect(repeater.order.quantity).toEqual(1000);
        expect(repeater.order.plant.name).toEqual(plant.name);
        expect(repeater.order.customer.name).toEqual(customer.name);
        expect(repeater.order.arrivalDate).toEqual(new Date(2017, 6, 12)); // July 12, 2017 - 5 days after the original
    });

    it('deducts previous quantities', () => {
        const arrivalDate1 = moment(arrival).add(7, 'days').toDate(),
            arrivalDate2 = moment(arrival).add(14, 'days').toDate(),
            repeater1 = repeaters[0],
            repeater2 = repeaters[1];
        repeater1.setRepeater(calculator, arrivalDate1);
        repeater2.setRepeater(repeater1, arrivalDate2);
        
        expect(calculator.weeks[0].zones['A'].available).toEqual(99); // 100 in zone - 1 for the week
        expect(calculator.weeks[6].zones['A'].available).toEqual(96); // 100 in zone - 4 for the week

        expect(repeater1.weeks[0].zones['A'].available).toEqual(98); // 100 in zone - 1 for the week - 1 for the previous
        expect(repeater1.weeks[5].zones['A'].available).toEqual(92); // 100 in zone - 4 for the week - 4 for the previous
        expect(repeater1.weeks[6].zones['A'].available).toEqual(96); // previous order is gone by this time

        expect(repeater2.weeks[0].zones['A'].available).toEqual(97); // 100 in zone - 1 for the week - 1 for the previous - 1 for the week before that
        expect(repeater2.weeks[4].zones['A'].available).toEqual(88); // 100 in zone - 4 for the week - 4 for the previous - 4 for the week before that
        expect(repeater2.weeks[5].zones['A'].available).toEqual(92); // original order is gone
        expect(repeater2.weeks[6].zones['A'].available).toEqual(96); // this is the only order left
    }); 
});
