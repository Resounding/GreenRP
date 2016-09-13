import {autoinject} from 'aurelia-framework';
import {Database} from '../database';
import {Customer} from '../../models/customer';
import {Plant} from '../../models/plant';
import {Zone} from '../../models/zone';
import {Season} from '../../models/season';
import {Week} from "../../models/week";
import {ReferenceData} from '../reference-data';
import {SeasonTime} from "../../models/season-time";

@autoinject()
export class ReferenceService {
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
                    const plants = _.sortBy(result.plants, (plant:Plant) => plant.crop.toLowerCase() + plant.size);
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

    seasons():Promise<Season[]> {
        return new Promise((resolve, reject) => {

            this.database.db.get('seasons')
                .then(result => {
                    resolve(result.seasons);
                })
                .catch(reject);
        });
    }

    weeks():Promise<Week[]> {
        const weeks = new ReferenceData().weeks;
        return Promise.resolve(weeks);
    }

    propagationTimes():Promise<SeasonTime[]> {
        return new Promise((resolve, reject) => {

            this.database.db.get('propagation-times')
                .then(result => {
                    resolve(result.propagationTimes);
                })
                .catch(reject);
        })
    }

    flowerTimes():Promise<SeasonTime[]> {
        return new Promise((resolve, reject) => {

            this.database.db.get('flower-times')
                .then(result => {
                    resolve(result.flowerTimes);
                })
                .catch(reject);
        })
    }
}
