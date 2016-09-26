import {
    WeekDetailFilter, WeekDetailService,
    WeekDetailOrder
} from "../../../../../src/resources/services/domain/week-detail-service";
import {OrderDocument} from "../../../../../src/resources/models/order";

describe('week detail service', () => {
    describe('week detail filter', () => {
        it('defaults to null values with the default constructor', () => {
            const filter = new WeekDetailFilter();

            expect(filter.startDate).toBeNull();
            expect(filter.endDate).toBeNull();
            expect(filter.zone).toBeNull();
        });

        it('sets the start & end dates when you pass it a week', () => {
            // Week 13: March 27, 2017 - April 2, 2017
            const week = {
                    _id: 'week:2017.13',
                    year: 2017,
                    week: 13,
                    zones: null
                },
                filter = new WeekDetailFilter(week);

            expect(filter.startDate).toEqual(new Date(2017, 2, 27));
            expect(filter.endDate).toEqual(new Date(2017, 3, 2, 23, 59, 59, 999));
            expect(filter.zone).toBeNull();
        });

        it('defaults the week number to 0', () => {
            const filter = new WeekDetailFilter();

            expect(filter.weekNumber).toEqual(0);
        });
        it('sets the week number when you pass it a week', () => {
            const week = {
                    _id: 'week:2017.13',
                    year: 2017,
                    week: 13,
                    zones: null
                },
                filter = new WeekDetailFilter(week);

            expect(filter.weekNumber).toEqual(13);
        });

        it('sets the week number when you set the EndDate', () => {
            const filter = new WeekDetailFilter();

            filter.startDate = new Date(2016, 0, 1);
            filter.endDate = new Date(2016, 11, 31);
            expect(filter.weekNumber).toEqual(52);
        });
    });

    describe('week detail service', () => {
        let orders: OrderDocument[] = [
            new OrderDocument({
                _id: '6M:Weg:2017-12-3',
                _rev: '1',
                type: 'order',
                arrivalDate: new Date(2017, 2, 22),
                flowerDate: new Date(2017, 2, 17),
                lightsOutDate: new Date(2017, 1, 24),
                stickDate: new Date(2017, 0, 20),
                quantity: 10000,
                customer: {name: 'Wegmans', abbreviation: 'Weg'},
                plant: {
                    name: '6" Mums', crop: 'Mums', size: '6"', cuttingsPerPot: 5, cuttingsPerTable: {
                        "tight": 1600,
                        "half": 1100,
                        "full": 525
                    }, hasLightsOut: true
                },
                zone: {
                    name: 'A', tables: 325, autoSpace: false, weeks: [
                        {year: 2017, week: 3, tables: 7, available: 318},
                        {year: 2017, week: 4, tables: 7, available: 318},
                        {year: 2017, week: 5, tables: 7, available: 318},
                        {year: 2017, week: 6, tables: 7, available: 318},
                        {year: 2017, week: 7, tables: 7, available: 318},
                        {year: 2017, week: 8, tables: 10, available: 315},
                        {year: 2017, week: 9, tables: 10, available: 315},
                        {year: 2017, week: 10, tables: 10, available: 315},
                        {year: 2017, week: 11, tables: 10, available: 315},
                        {year: 2017, week: 12, tables: 10, available: 315}
                    ]
                }
            }),
            new OrderDocument({
                _id: '6M:Weg:2017-13-3',
                _rev: '1',
                type: 'order',
                arrivalDate: new Date(2017, 2, 29),
                flowerDate: new Date(2017, 2, 24),
                lightsOutDate: new Date(2017, 2, 3),
                stickDate: new Date(2017, 0, 27),
                quantity: 10000,
                customer: {name: 'Wegmans', abbreviation: 'Weg'},
                plant: {
                    name: '6" Mums', crop: 'Mums', size: '6"', cuttingsPerPot: 5, cuttingsPerTable: {
                        "tight": 1600,
                        "half": 1100,
                        "full": 525
                    }, hasLightsOut: true
                },
                zone: {
                    name: 'A', tables: 325, autoSpace: false, weeks: [
                        {year: 2017, week: 4, tables: 7, available: 318},
                        {year: 2017, week: 5, tables: 7, available: 318},
                        {year: 2017, week: 6, tables: 7, available: 318},
                        {year: 2017, week: 7, tables: 7, available: 318},
                        {year: 2017, week: 8, tables: 7, available: 318},
                        {year: 2017, week: 9, tables: 20, available: 305},
                        {year: 2017, week: 10, tables: 20, available: 305},
                        {year: 2017, week: 11, tables: 20, available: 305},
                        {year: 2017, week: 12, tables: 20, available: 305},
                        {year: 2017, week: 13, tables: 20, available: 305}
                    ]
                }
            }),
            new OrderDocument({
                _id: '6M:shw:2017-40-5',
                _rev: '1',
                type: 'order',
                arrivalDate: new Date(2017, 9, 6),
                flowerDate: new Date(2017, 9, 2),
                lightsOutDate: new Date(2017, 7, 28),
                stickDate: new Date(2017, 6, 17),
                quantity: 12500,
                customer: {name: 'Shaws', abbreviation: 'Shw'},
                plant: {
                    name: '4.5" Kolanchoe', crop: 'Kolanchoe', size: '4.5"', cuttingsPerPot: 1, cuttingsPerTable: {
                        "tight": 800,
                        "full": 454
                    }, hasLightsOut: true
                },
                zone: {
                    name: 'B/C', tables: 220, autoSpace: false, weeks: [
                        {year: 2017, week: 29, tables: 16, available: 204},
                        {year: 2017, week: 30, tables: 16, available: 204},
                        {year: 2017, week: 31, tables: 16, available: 204},
                        {year: 2017, week: 32, tables: 16, available: 204},
                        {year: 2017, week: 33, tables: 16, available: 204},
                        {year: 2017, week: 34, tables: 16, available: 204},
                        {year: 2017, week: 35, tables: 28, available: 192},
                        {year: 2017, week: 36, tables: 28, available: 192},
                        {year: 2017, week: 37, tables: 28, available: 192},
                        {year: 2017, week: 38, tables: 28, available: 192},
                        {year: 2017, week: 39, tables: 28, available: 192},
                        {year: 2017, week: 40, tables: 28, available: 192}
                    ]
                }
            })
        ];

        it('returns a record for every order when no filter is applied', () => {
            const service = new WeekDetailService(orders),
                filter = new WeekDetailFilter();

            expect(service.filter(filter).length).toEqual(orders.length);
        });

        it('returns all the records in the house when filtered by a week', () => {
            const service = new WeekDetailService(orders),
                week3 = {_id: 'week:2017.3', year: 2017, week: 3, zones: null},
                week6 = {_id: 'week:2017.6', year: 2017, week: 6, zones: null},
                week13 = {_id: 'week:2017.13', year: 2017, week: 13, zones: null};

            expect(service.filter(new WeekDetailFilter(week6)).length).toEqual(2);
            expect(service.filter(new WeekDetailFilter(week13)).length).toEqual(1);
            expect(service.filter(new WeekDetailFilter(week3)).length).toEqual(1);
        });

        it('returns all the records in the house when filtered by dates', () => {
            const service = new WeekDetailService(orders),
                filter = new WeekDetailFilter();

            filter.startDate = new Date(2017, 0, 19);
            filter.endDate = new Date(2017, 9, 8);
            expect(service.filter(filter).length).toEqual(3);

            filter.startDate = new Date(2017, 0, 19);
            filter.endDate = new Date(2017, 3, 1);
            expect(service.filter(filter).length).toEqual(2);

            filter.startDate = new Date(2017, 9, 1);
            filter.endDate = new Date(2017, 12, 1);
            expect(service.filter(filter).length).toEqual(1);
        });

        it('returns all the records in the zone when filtered by a zone', () => {
            const service = new WeekDetailService(orders),
                filter = new WeekDetailFilter();

            filter.zone = 'A';
            expect(service.filter(filter).length).toEqual(2);

            filter.zone = 'B/C';
            expect(service.filter(filter).length).toEqual(1);
        });
    });

    describe('week detail order', () => {
        it('maps the properties from the order', () => {
            const order = new OrderDocument({
                    _id: 'order:6M:Weg:2017-12-3',
                    _rev: '1',
                    type: 'order',
                    arrivalDate: new Date(2017, 2, 22),
                    flowerDate: new Date(2017, 2, 17),
                    lightsOutDate: new Date(2017, 1, 24),
                    stickDate: new Date(2017, 0, 20),
                    quantity: 10000,
                    customer: {name: 'Wegmans', abbreviation: 'Weg'},
                    plant: {
                        name: '6" Mums', crop: 'Mums', size: '6"', cuttingsPerPot: 5, cuttingsPerTable: {
                            "tight": 1600,
                            "half": 1100,
                            "full": 525
                        }, hasLightsOut: true
                    },
                    zone: {
                        name: 'A', tables: 325, autoSpace: false, weeks: [
                            {year: 2017, week: 3, tables: 7, available: 318},
                            {year: 2017, week: 4, tables: 7, available: 318},
                            {year: 2017, week: 5, tables: 7, available: 318},
                            {year: 2017, week: 6, tables: 7, available: 318},
                            {year: 2017, week: 7, tables: 7, available: 318},
                            {year: 2017, week: 8, tables: 20, available: 305},
                            {year: 2017, week: 9, tables: 20, available: 305},
                            {year: 2017, week: 10, tables: 20, available: 305},
                            {year: 2017, week: 11, tables: 20, available: 305},
                            {year: 2017, week: 12, tables: 20, available: 305}
                        ]
                    }
                }),
                filter = new WeekDetailFilter(),
                week = {_id: 'week:2017.12', year: 2017, week: 12, zones: null};

            let wdo = new WeekDetailOrder(order, filter);

            expect(wdo.batch).toEqual('6M:Weg:2017-12-3');
            expect(wdo.plant).toEqual('6" Mums');
            expect(wdo.pots).toEqual(10000);
            expect(wdo.shipWeek).toEqual(12);

            // end date not set on filter
            expect(wdo.isShippingThisWeek).toEqual(false);
            expect(wdo.isFloweringThisWeek).toEqual(false);

            // filter ends on shipping week
            filter.endDate = new Date(2017, 2, 20);
            wdo = new WeekDetailOrder(order, filter);
            expect(wdo.isShippingThisWeek).toEqual(true);
            expect(wdo.isFloweringThisWeek).toEqual(false);
            expect(wdo.tables).toEqual(20);

            // filter ends on stick week
            filter.endDate = new Date(2017, 1, 1);
            wdo = new WeekDetailOrder(order, filter);
            expect(wdo.isShippingThisWeek).toEqual(false);
            expect(wdo.isFloweringThisWeek).toEqual(false);
            expect(wdo.tables).toEqual(7);
        });
    });
});
