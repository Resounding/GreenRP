import {OrderDocument, Order} from "../../../../src/resources/models/order";

describe('orders', () => {
   it('creates the orderNumber properly', () => {
       const order:Order = {
           _id: null,
           _rev: '1',
           orderNumber: null,
           type: 'order',
           customer: { name: 'Shaws', abbreviation: 'Shw'},
           arrivalDate: new Date(2017, 4, 12),
           flowerDate: new Date(),
           lightsOutDate: new Date(),
           stickDate: new Date(),
           quantity: 1000,
           partialSpace: false,
           plant: {
               id: 1,
               name: '6" Mums',
               abbreviation: '6M',
               crop: 'Mums',
               size: '6"',
               cuttingsPerPot: 5,
               cuttingsPerTable: {
                   tight: 1500,
                   full: 750
               },
               potsPerCase: 8,
               hasLightsOut: true
           },
           weeksInHouse: {},
           zone: null
       },
       doc = new OrderDocument(order);

       expect(doc.orderNumber).toEqual('6MShw2017-19-5')
   });
});
