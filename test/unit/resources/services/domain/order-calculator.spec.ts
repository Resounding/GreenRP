import {ReferenceData} from '../../../../../src/resources/services/reference-data';
import {OrderCalculator} from '../../../../../src/resources/services/domain/order-calculator';
import {Events, CalculatorWeek} from "../../../../../src/resources/services/domain/models/calculator-week";
import {Zone} from '../../../../../src/resources/models/zone';
import {Season} from "../../../../../src/resources/models/season";
import {Plant, Crops} from "../../../../../src/resources/models/plant";
import {SeasonTime} from "../../../../../src/resources/models/season-time";
import {CapacityWeek, CapacityWeekZones} from "../../../../../src/resources/models/capacity-week";
import {OrderDocument} from "../../../../../src/resources/models/order";
import {Week} from "../../../../../src/resources/models/week";

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
                A: { zone: zones[0], available: 10 },
                B: { zone: zones[1], available: 5 },
                C: { zone: zones[2], available: 50
                }
            }})],
            ['week:2017.2', new CapacityWeek({_id: 'week:2017.2', year: 2017, week: 2, zones: {
                A: { zone: zones[0], available: 20 },
                B: { zone: zones[1], available: 0 },
                C: { zone: zones[2], available: 10
                }
            }})],
            ['week:2017.3', new CapacityWeek({_id: 'week:2017.1', year: 2017, week: 3, zones: {
                A: { zone: zones[0], available: 5 },
                B: { zone: zones[1], available: 5 },
                C: { zone: zones[2], available: 5
                }
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
            mum:Plant = { name: "4.5\" Mums", abbreviation: 'M', crop: Crops.Mums, size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
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
            mum:Plant = { name: "4.5\" Mums", abbreviation: 'M', crop: Crops.Mums, size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
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
            mum:Plant = { name: "4.5\" Kalanchoe", abbreviation: 'K', crop: Crops.Kalanchoe, size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
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
            mum:Plant = { name: "4.5\" Mums", abbreviation: 'M', crop: Crops.Mums, size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
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
                times: {
                    spring: 3,
                    winter: 3,
                    fall: 3,
                    summer: 3
                }
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
        const order:OrderDocument = {
            _id: '123',
            _rev: '1',
            type: OrderDocument.OrderDocumentType,
            arrivalDate: new Date(2017, 5, 12), // June 12, 2017: Week 24
            flowerDate: new Date(2017,5, 8), // June 8, 2017: Week 23
            lightsOutDate:new Date(2017, 4, 18), // May 18, 2017: 3 weeks before flower: week 20
            stickDate: new Date(2017, 3, 13), // Apr 13, 2017: 5 weeks before lights-out
            quantity:1000,
            customer:{name: 'Sobeys', abbreviation: 'Sb'},
            plant:{name: '4.5" Mums', abbreviation: 'M', size: '4.5"', crop: 'Mums', cuttingsPerPot: 5, cuttingsPerTable: {
                full: 500,
                tight: 1000
            }, potsPerCase: 8, hasLightsOut: true},
            zone: {
                name: 'A',
                tables: 500,
                autoSpace: false,
                isPropagationZone: false,
                weeks: [] 
            },
            isCancelled: false,
            rootInPropArea: false
        },
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
});

describe('changing date', () => {
    let calculator:OrderCalculator,
        zones:Zone[],
        rawWeeks:Week[],
        weeks:Map<string, CapacityWeek>,
        seasons:Season[],
        plant:Plant,
        propagationTimes:SeasonTime[],
        flowerTimes:SeasonTime[],
        arrival:Date; // Friday, July 7, 2017

    beforeEach(() => {
        zones = [];
        seasons = [
            {
                name: 'spring',
                year: 2017,
                week: 1
            }
        ];
        plant = {
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

    it('resets the stick date when setting the lights-out date', () => {

        const lightsOut = new Date(2017, 4, 1); // moved this back a week
        calculator.setLightsOutDate(lightsOut);

        const weeks:CalculatorWeek[] = calculator.weeks;

        expect(weeks.length).toEqual(13); // increased by a week

        expect(weeks[12].events[1].date).toEqual(arrival); // arrival date
        expect(weeks[12].events[0].date).toEqual(new Date(2017, 6, 3)); // flower date - 4 days prior
        expect(weeks[3].events[0].date).toEqual(lightsOut); // space week - as set
        expect(weeks[0].events[0].date).toEqual(new Date(2017, 3, 10)); // stick week - also moved a week back
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
        calculator.order.zone = {name: 'A', autoSpace: false, tables: 500, isPropagationZone: false };
        const order = calculator.getOrderDocument();

        expect(order.plant.potsPerCase).toEqual(8);
    });    
});

describe('order zones', () => {
    let calculator:OrderCalculator,
        zones:Zone[],
        rawWeeks:Week[],
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
                A: Object.assign({}, zones[0], { available: zones[0].tables }),
                B: Object.assign({}, zones[1], { available: zones[1].tables }),
                C: Object.assign({}, zones[2], { available: zones[2].tables })
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

    it('sets the zones when rootInPropArea is false', () => {        
        propagationTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 2
            }
        ];
        flowerTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 2
            }
        ];
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes)
            .setPlant(plant)
            .setArrivalDate(arrival);
        calculator.orderQuantity = 1000;

        const orderWeeks = calculator.weeks;
        let orderWeek:CalculatorWeek = orderWeeks[0];

        expect(orderWeek.tables).toEqual(1);
        expect(orderWeek.zones['A'].available).toEqual(99);
        expect(orderWeek.zones['B'].available).toEqual(100);
        expect(orderWeek.zones['C'].available).toEqual(99);

        orderWeek = orderWeeks[1];
        expect(orderWeek.tables).toEqual(1);
        expect(orderWeek.zones['A'].available).toEqual(99);
        expect(orderWeek.zones['B'].available).toEqual(100);
        expect(orderWeek.zones['C'].available).toEqual(99);

        orderWeek = orderWeeks[2];
        expect(orderWeek.tables).toEqual(4);
        expect(orderWeek.zones['A'].available).toEqual(96);
        expect(orderWeek.zones['B']).toBeNull();
        expect(orderWeek.zones['C'].available).toEqual(96);

        orderWeek = orderWeeks[3];
        expect(orderWeek.tables).toEqual(4);
        expect(orderWeek.zones['A'].available).toEqual(96);
        expect(orderWeek.zones['B']).toBeNull();
        expect(orderWeek.zones['C'].available).toEqual(96);

        orderWeek = orderWeeks[4];
        expect(orderWeek.tables).toEqual(4);
        expect(orderWeek.zones['A'].available).toEqual(96);
        expect(orderWeek.zones['B']).toBeNull();
        expect(orderWeek.zones['C'].available).toEqual(96);
    });

    it('sets the zones when rootInPropArea is true', () => {        
        propagationTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 2
            }
        ];
        flowerTimes = [
            {
                plant: plant.name,
                year: 2017,
                times: 2
            }
        ];
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes)
            .setPlant(plant)
            .setArrivalDate(arrival);
        calculator.orderQuantity = 1000;
        calculator.rootInPropagationZone = true;

        const orderWeeks = calculator.weeks;
        let orderWeek:CalculatorWeek = orderWeeks[0];

        expect(orderWeek.tables).toEqual(1);
        expect(orderWeek.zones['A'].available).toEqual(100);
        expect(orderWeek.zones['B'].available).toEqual(99);
        expect(orderWeek.zones['C'].available).toEqual(100);

        orderWeek = orderWeeks[1];
        expect(orderWeek.tables).toEqual(1);
        expect(orderWeek.zones['A'].available).toEqual(100);
        expect(orderWeek.zones['B'].available).toEqual(99);
        expect(orderWeek.zones['C'].available).toEqual(100);

        orderWeek = orderWeeks[2];
        expect(orderWeek.tables).toEqual(4);
        expect(orderWeek.zones['A'].available).toEqual(96);
        expect(orderWeek.zones['B']).toBeNull();
        expect(orderWeek.zones['C'].available).toEqual(96);

        orderWeek = orderWeeks[3];
        expect(orderWeek.tables).toEqual(4);
        expect(orderWeek.zones['A'].available).toEqual(96);
        expect(orderWeek.zones['B']).toBeNull();
        expect(orderWeek.zones['C'].available).toEqual(96);

        orderWeek = orderWeeks[4];
        expect(orderWeek.tables).toEqual(4);
        expect(orderWeek.zones['A'].available).toEqual(96);
        expect(orderWeek.zones['B']).toBeNull();
        expect(orderWeek.zones['C'].available).toEqual(96);
    });
});