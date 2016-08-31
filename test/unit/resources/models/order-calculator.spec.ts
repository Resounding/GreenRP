import {ReferenceData} from '../../../../src/resources/services/reference-data';
import {OrderCalculator} from '../../../../src/resources/services/domain/order-calculator';
import {Events} from "../../../../src/resources/services/domain/models/calculator-week";
import {Zone} from '../../../../src/resources/models/zone';
import {Week} from "../../../../src/resources/models/week";
import {Season} from "../../../../src/resources/models/season";
import {Plant, Crops} from "../../../../src/resources/models/plant";
import {PropagationTime} from "../../../../src/resources/models/propagation-time";

describe('the order calculator', () => {
    let calculator:OrderCalculator,
        zones:Zone[] = [
            { name: 'A', tables: 100, autoSpace: false },
            { name: 'B', tables: 100, autoSpace: false },
            { name: 'C', tables: 100, autoSpace: false }
        ],
        weeks:Week[] = [
            {_id: 'week:2017.1', year: 2017, week: 1, zones: {
                A: { zone: zones[0], available: 10 },
                B: { zone: zones[1], available: 5 },
                C: { zone: zones[2], available: 50
                }
            }},
            {_id: 'week:2017.2', year: 2017, week: 2, zones: {
                A: { zone: zones[0], available: 20 },
                B: { zone: zones[1], available: 0 },
                C: { zone: zones[2], available: 10
                }
            }},
            {_id: 'week:2017.1', year: 2017, week: 3, zones: {
                A: { zone: zones[0], available: 5 },
                B: { zone: zones[1], available: 5 },
                C: { zone: zones[2], available: 5
                }
            }}
        ],
        seasons:Season[] = [

        ],
        propagationTimes:PropagationTime[] = [

        ];


    beforeEach(() => {
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes);
    });

    it('contains the zones as a property', () => {
        expect(calculator.zones.length).toBe(zones.length);
    });

    it('creates an order', () => {
        expect(calculator.order).toBeDefined();
    });

    it('sorts the zones by name', () => {
        zones.unshift({
            name: 'Z', tables: 100, autoSpace: false
        });
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes);
        expect(zones[0].name).toBe('Z');
        expect(calculator.zones[0].name).toBe('A');
        expect(calculator.zones[3].name).toBe('Z');
    });

    it('adds the shipping week', () => {
        const date = new Date(2017, 0, 12),
            m = moment(date),
            year = m.year(),
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
            year = m.year(),
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
            year = m.year(),
            week = m.isoWeek(),
            dayOfWeek = m.format('dddd'),
            flowerMoment = m.add(-4, 'days');

        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes);

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
            mum:Plant = { name: "4.5\" Mums", crop: Crops.Mums, size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
                tight: 1000,
                half: 800,
                full: 500
            }, hasLightsOut: true, weeksFromLightsOutToFlower: 8 };

        weeks = new ReferenceData().weeks;
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes);

        calculator.setArrivalDate(date);
        calculator.setPlant(mum);

        expect(calculator.weeks.length).toEqual(9);
    });

    it('doesnn\'t add weeks if plant doesn\'t have lights-out', () => {
        const
            date = new Date(2017, 0, 9),
            mum:Plant = { name: "4.5\" Mums", crop: Crops.Gerbera, size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
                tight: 1000,
                half: 800,
                full: 500
            }, hasLightsOut: false, weeksFromLightsOutToFlower: 8 };

        weeks = new ReferenceData().weeks;
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes);

        calculator.setArrivalDate(date);
        calculator.setPlant(mum);

        expect(calculator.weeks.length).toEqual(2);
    });

    it('adds weeks for sticking', () => {
        const
            date = new Date(2017, 0, 9),
            mum:Plant = { name: "4.5\" Mums", crop: Crops.Mums, size: "4.5", cuttingsPerPot: 1, cuttingsPerTable: {
                tight: 1000,
                half: 800,
                full: 500
            }, hasLightsOut: true, weeksFromLightsOutToFlower: 8 };

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
                    propagationTimes: {
                        spring: 3,
                        winter: 3,
                        fall: 3,
                        summer: 3
                    }
                }
            ];

        weeks = new ReferenceData().weeks;
        calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes);

        calculator.setArrivalDate(date);
        calculator.setPlant(mum);

        expect(calculator.weeks.length).toEqual(11);
    });
});
