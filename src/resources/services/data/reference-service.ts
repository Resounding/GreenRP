import {autoinject} from 'aurelia-framework';
import {Database} from '../database';
import {Customer} from '../../models/customer';
import {Plant} from '../../models/plant';
import {Zone} from '../../models/zone';
import {Season} from '../../models/season';
import {Week} from "../../models/week";
import {SeasonTime} from "../../models/season-time";
import {CapacityWeekZones} from "../../models/capacity-week";

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

    savePlant(plant:Plant):Promise<PouchDB.Core.Response> {
        return new Promise((resolve, reject) => {
            this.database.db.get('plants')
                .then(result => {
                    const index = _.findIndex(result.plants, p => p.name === plant.name);
                    if(index === -1) {
                        result.plants.push(plant);
                    } else {
                        result.plants[index] = plant;
                    }
                    this.database.db.put(result)
                        .then(resolve)
                        .catch(reject);
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
        return new Promise((resolve, reject) => {
            this.database.db.get('zones')
                .then(result => {
                    const zones:CapacityWeekZones = _.reduce(result.zones, (memo, zone:Zone) => {
                            memo[zone.name] = {
                                zone:zone,
                                tables:zone.tables,
                                available:zone.tables  
                            };
                            return memo;
                        }, {}),
                        start = moment().startOf('year'),
                        returnValue = _.chain(_.range(0, 200))
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

                    resolve(returnValue);
                })
                .catch(reject);
        });        
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
