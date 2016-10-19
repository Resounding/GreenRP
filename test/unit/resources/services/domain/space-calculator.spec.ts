import {SpaceCalculator,TableSpaceResult} from "../../../../../src/resources/services/domain/space-calculator";
import {CalculatorOrder} from "../../../../../src/resources/services/domain/models/calculator-order";
import {Order} from "../../../../../src/resources/models/order";
import {Plant} from "../../../../../src/resources/models/plant";

describe('the space calculator', () => {
    let mum:Plant = {
            name: '4.5" Mums',
            abbreviation: '4M',
            crop: 'Mums',
            size: '4.5"',
            cuttingsPerPot: 1,
            cuttingsPerTable: {
                tight: 1000,
                full: 250
            },
            potsPerCase: 8,
            hasLightsOut: true
        },
        cyclamen:Plant = {
            name: '6" Cyclamen',
            abbreviation: '6C',
            crop: 'Cyclamen',
            size: '6"',
            cuttingsPerPot: 5,
            cuttingsPerTable: {
                tight: 1100,
                half: 800,
                full: 450
            },
            potsPerCase: 8,
            hasLightsOut: true
        },
        calculator:SpaceCalculator,
        order:Order;


    beforeEach(() => {
        order = new CalculatorOrder({
            stickDate: new Date(2017, 3, 17),
            lightsOutDate: new Date(2017, 4, 8),
            flowerDate: new Date(2017, 6, 3),
            arrivalDate: new Date(2017, 6,7),
            quantity: 1000,
            customer: null,
            plant: mum
        });
        calculator = new SpaceCalculator(order);
    });

    it('has a space of 0 with no stick date', () => {
        const weekId = moment(new Date(2017, 4, 1)).toWeekNumberId();
        order.stickDate = null;

        expect(calculator.getTables(weekId)).toEqual(0);
    });

    it('has a space of 0 with no plant', () => {
        const weekId = moment(new Date(2017, 4, 1)).toWeekNumberId();
        order.plant = null;

        expect(calculator.getTables(weekId)).toEqual(0);
    });

    it('has a tight space before spacing', () => {
        const startWeekId = moment(order.stickDate).toWeekNumberId(),
            weekId = moment(order.lightsOutDate).subtract(1, 'week').toWeekNumberId();

        order.quantity = 3000;
        // 1 cutting per pot, 1000 pots per table
        expect(calculator.getTables(weekId)).toEqual(3);
    });

    it('has a full space after spacing', () => {
        const startWeekId = moment(order.stickDate).toWeekNumberId(),
            weekId = moment(order.lightsOutDate).add(3, 'weeks').toWeekNumberId();

        order.quantity = 3000;
        // 1 cutting per pot, 250 pots per table
        expect(calculator.getTables(weekId)).toEqual(12);
    });

    it('rounds up to the next table', () => {
        const stickWeekId = moment(order.stickDate).toWeekNumberId();

        order.quantity = 2121;
        // 1 cutting per pot, 1000 pots per table, round up to 3.
        expect(calculator.getTables(stickWeekId)).toEqual(3);
    });

    it('has a partial space after partial space week', () => {
        order = new CalculatorOrder({
            stickDate: new Date(2017, 3, 17),
            lightsOutDate: new Date(2017, 4, 8),
            flowerDate: new Date(2017, 6, 3),
            arrivalDate: new Date(2017, 6,7),
            quantity: 800,
            customer: null,
            plant: cyclamen,
            partialSpace: true
        });
        calculator = new SpaceCalculator(order);

        const partialSpaceWeekId = moment(order.lightsOutDate).subtract(1, 'week').toWeekNumberId(),
            lightsOutWeekId = moment(order.lightsOutDate).toWeekNumberId(),
            partialTables = <TableSpaceResult>calculator.getTables(partialSpaceWeekId),
            lightsOutTables = <TableSpaceResult>calculator.getTables(lightsOutWeekId);
            
        // half-spaced is 5 cuttings per pot x 800 pots / 800 cuttings per table = 5 tables
        expect(partialTables.autoSpacing).toEqual(5);
        expect(partialTables.manualSpacing).toEqual(4);
        
        expect(lightsOutTables.autoSpacing).toEqual(5);
        expect(lightsOutTables.manualSpacing).toEqual(9);
    });

    it('has a full space after full space week', () => {
        order = new CalculatorOrder({
            stickDate: new Date(2017, 3, 17),
            lightsOutDate: new Date(2017, 4, 8),
            flowerDate: new Date(2017, 6, 3),
            arrivalDate: new Date(2017, 6,7),
            quantity: 800,
            customer: null,
            plant: cyclamen,
            partialSpace: true
        });
        calculator = new SpaceCalculator(order);

        const fullSpaceWeekId = moment(order.lightsOutDate).add(1, 'week').toWeekNumberId(),
            tables = <number>calculator.getTables(fullSpaceWeekId);
            
        // half-spaced is 5 cuttings per pot x 800 pots / 450 cuttings per table = 8.888 ~9 tables
        expect(tables).toEqual(9);
    });

    it('only uses partial spacing for zones that support it', () => {
        order = new CalculatorOrder({
            stickDate: new Date(2017, 3, 17),
            lightsOutDate: new Date(2017, 4, 8),
            flowerDate: new Date(2017, 6, 3),
            arrivalDate: new Date(2017, 6,7),
            quantity: 800,
            customer: null,
            plant: cyclamen,
            partialSpace: true
        });
        calculator = new SpaceCalculator(order);

        const fullSpaceWeekId = moment(order.lightsOutDate).add(1, 'week').toWeekNumberId();
            
        const partialSpaceWeekId = moment(order.lightsOutDate).subtract(1, 'week').toWeekNumberId(),
            tables = <TableSpaceResult>calculator.getTables(partialSpaceWeekId);
            
        // half-spaced is 5 cuttings per pot x 800 pots / 800 cuttings per table = 5 tables
        expect(tables.autoSpacing).toEqual(5);
        expect(tables.manualSpacing).toEqual(4);
    });

    it('only uses partial spacing for plants that support it', () => {
        cyclamen = {
            name: '6" Cyclamen',
            abbreviation: '6C',
            crop: 'Cyclamen',
            size: '6"',
            cuttingsPerPot: 5,
            cuttingsPerTable: {
                tight: 1100,
                // no half-space
                full: 450
            },
            potsPerCase: 8,
            hasLightsOut: true
        };

        order = new CalculatorOrder({
            stickDate: new Date(2017, 3, 17),
            lightsOutDate: new Date(2017, 4, 8),
            flowerDate: new Date(2017, 6, 3),
            arrivalDate: new Date(2017, 6,7),
            quantity: 800,
            customer: null,
            plant: cyclamen,
            partialSpace: true
        });
        calculator = new SpaceCalculator(order);

        const partialSpaceWeekId = moment(order.lightsOutDate).subtract(1, 'week').toWeekNumberId(),
            lightsOutWeekId = moment(order.lightsOutDate).toWeekNumberId();
        
        // still tight at this point: 5 cuttings per pot x 800 pots / 1100 cuttings per table ~= 4 tables
        let tables = <TableSpaceResult>calculator.getTables(partialSpaceWeekId);            
        expect(tables.autoSpacing).toEqual(4);
        expect(tables.manualSpacing).toEqual(4);
            
        // should be fully-spaced b/c plant doesn't have half-spacing: 5 cuttings per pot x 800 pots / 450 cuttings per table ~= 9 tables
        tables = <TableSpaceResult>calculator.getTables(lightsOutWeekId);
        expect(tables.autoSpacing).toEqual(9);
        expect(tables.manualSpacing).toEqual(9);
    });
});
