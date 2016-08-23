import {autoinject} from 'aurelia-framework';
import {Database} from '../database';
import {Customer} from '../../models/customer';
import {Plant} from '../../models/plant';
import {Zone} from '../../models/zone';

@autoinject()
export class Reference {
    constructor(private database:Database) { }

    customers():Promise<Customer[]> {
        return new Promise((resolve, reject) => {

            this.database.db.get('customers')
                .then(result => {
                    const customers = _.sortBy(result.customers, (customer:Customer) => customer.name.toLowerCase());
                    resolve(customers);
                })
                .catch(reject);
        });
    }

    plants():Promise<Plant[]> {
        return new Promise((resolve, reject) => {

            this.database.db.get('plants')
                .then(result => {
                    const plants = _.sortBy(result.plants, (plant:Plant) => plant.name.toLowerCase());
                    resolve(plants);
                })
                .catch(reject);
        });
    }

    zones():Promise<Zone[]> {
        return new Promise((resolve, reject) => {

            this.database.db.get('zones')
                .then(result => {
                    resolve(result.zones);
                })
                .catch(reject);
        });
    }
}
