import {CalculatorOrder} from '../../../../../../src/resources/services/domain/models/calculator-order';
import {CalculatorWeek} from '../../../../../../src/resources/services/domain/models/calculator-week';
import {OrderDocument} from '../../../../../../src/resources/models/order';
import {Zone} from "../../../../../../src/resources/models/zone";

describe('calculator order', () => {
    let calculatorOrder:CalculatorOrder,
        order:OrderDocument,
        weeks:CalculatorWeek[],
        orderDoc: any,
        allZones:Zone[];

    describe('toOrderDocument()', () => {
        beforeEach(() => {
            orderDoc = {
                _id: 'Shw6M2017-5-1',
                _rev: '123',
                type: 'order',
                arrivalDate: new Date(2017, 5, 10),
                flowerDate: new Date(2017, 5, 6),
                lightsOutDate: new Date(2017, 3, 6),
                stickDate: new Date(2017, 2, 6),
                quantity: 10000,
                customer: {
                    name: 'Shaws',
                    abbreviation: 'Shw'
                },
                plant: {
                    name: '6" Mums',
                    abbreviation: '6M',
                    crop: 'Mums',
                    size: '6"',
                    cuttingsPerPot: 5,
                    cuttingsPerTable: {
                        tight: 1000,
                        full: 500
                    },
                    hasLightsOut: false,
                    potsPerCase: 10
                },
                zone: {
                    name: 'A',
                    isPropagationZone: false,
                    autoSpace: false,
                    tables: 100
                },
                rootInPropArea: false,
                partialSpace: false
            };
            calculatorOrder = new CalculatorOrder(orderDoc);

            allZones = [
                { name: 'A', isPropagationZone: false, autoSpace: false, tables: 100},
                { name: 'B', isPropagationZone: true, autoSpace: false, tables: 100},
                { name: 'C', isPropagationZone: false, autoSpace: false, tables: 100},
                { name: 'F', isPropagationZone: false, autoSpace: true, tables: 100}
            ];
            
            weeks = [];

            order = calculatorOrder.toOrderDocument(weeks, allZones);
        });

        it('contains all the properties', () => {
            expect(order._id).toEqual(orderDoc._id);
            expect(order._rev).toEqual(orderDoc._rev);
            expect(order.type).toEqual(orderDoc.type);
            expect(order.arrivalDate).toEqual(orderDoc.arrivalDate);
            expect(order.flowerDate).toEqual(orderDoc.flowerDate);
            expect(order.lightsOutDate).toEqual(orderDoc.lightsOutDate);
            expect(order.stickDate).toEqual(orderDoc.stickDate);
            expect(order.quantity).toEqual(orderDoc.quantity);
            expect(order.partialSpace).toEqual(orderDoc.partialSpace);
            expect(order.customer.name).toEqual(orderDoc.customer.name);
            expect(order.plant.name).toEqual(orderDoc.plant.name);
            expect(order.zone.name).toEqual(orderDoc.zone.name);
        });

        it('contains the right values for the weeks', () => {
            weeks = [
                {
                    week: { _id: 'week:2017.1', year: 2017, week: 1, zones: {
                        A: { available: 75, tables: 25, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: true },
                        B: { available: 75, tables: 25, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 75, tables: 25, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 75, tables: 25, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: false }
                    } },
                    events: [],
                    tables: 25,
                    zones: {
                        A: { available: 75, tables: 25, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: true },
                        B: { available: 75, tables: 25, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 75, tables: 25, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 75, tables: 25, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: false }
                    }                    
                 },
                 {
                    week: { _id: 'week:2017.2', year: 2017, week: 2, zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: true },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 50, tables: 50, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: false }
                    } },
                    events: [],
                    tables: 50,
                    zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: true },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 50, tables: 50, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: false }
                    }                    
                 },
                 {
                    week: { _id: 'week:2017.3', year: 2017, week: 3, zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: true },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 50, tables: 50, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: false }
                    } },
                    events: [],
                    tables: 50,
                    zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: true },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 50, tables: 50, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: false }
                    }                    
                 }
            ];

            order = calculatorOrder.toOrderDocument(weeks, allZones);
            let week = order.weeksInHouse['week:2017.1'];
            expect(week.week).toEqual(1);
            expect(week.tables).toEqual(25);

            week = order.weeksInHouse['week:2017.2'];
            expect(week.week).toEqual(2);
            expect(week.tables).toEqual(50);

            week = order.weeksInHouse['week:2017.3'];
            expect(week.week).toEqual(3);
            expect(week.tables).toEqual(50);
        });

        it('contains the right values for the weeks when partially spaced', () => {
            weeks = [
                {
                    week: { _id: 'week:2017.1', year: 2017, week: 1, zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 75, tables: 25, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: true }
                    } },
                    events: [],
                    tables: 50,
                    zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 75, tables: 25, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: true }
                    }                    
                 },
                 {
                    week: { _id: 'week:2017.2', year: 2017, week: 2, zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 50, tables: 50, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: true }
                    } },
                    events: [],
                    tables: 50,
                    zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 50, tables: 50, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: true }
                    }                    
                 },
                 {
                    week: { _id: 'week:2017.3', year: 2017, week: 3, zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 50, tables: 50, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: true }
                    } },
                    events: [],
                    tables: 50,
                    zones: {
                        A: { available: 50, tables: 50, zone: { name: 'A', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        B: { available: 50, tables: 50, zone: { name: 'B', autoSpace: false, isPropagationZone: true, tables: 100 }, selected: false },
                        C: { available: 50, tables: 50, zone: { name: 'C', autoSpace: false, isPropagationZone: false, tables: 100 }, selected: false },
                        F: { available: 50, tables: 50, zone: { name: 'F', autoSpace: true, isPropagationZone: false, tables: 100 }, selected: true }
                    }                    
                 }
            ];

            orderDoc.partialSpace = true;
            orderDoc.zone = {
                name: 'F',
                isPropagationZone: false,
                autoSpace: true,
                tables: 100
            };
            calculatorOrder = new CalculatorOrder(orderDoc);
            
            order = calculatorOrder.toOrderDocument(weeks, allZones);
            let week = order.weeksInHouse['week:2017.1'];
            expect(week.week).toEqual(1);
            expect(week.tables).toEqual(25);
        });

    });
});
