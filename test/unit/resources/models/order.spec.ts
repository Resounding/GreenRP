import {OrderDocument, Order} from "../../../../src/resources/models/order";

describe('orders', () => {
   it('creates the id properly', () => {
       const order:Order = {
           _id: null,
           _rev: '1',
           type: 'order',
           customer: { name: 'Shaws', abbreviation: 'Shw'},
           arrivalDate: new Date(2017, 4, 12),
           flowerDate: new Date(),
           lightsOutDate: new Date(),
           stickDate: new Date(),
           quantity: 1000,
           partialSpace: false,
           plant: {
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
           zone: null,
           rootInPropArea: false
       },
       doc = new OrderDocument(order);

       expect(doc._id).toEqual('6MShw2017-19-5')
   });
});
