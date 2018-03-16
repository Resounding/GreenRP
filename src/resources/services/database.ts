import { ActivityDocument } from '../models/activity';
import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Configuration} from './configuration';
import {Authentication} from './authentication';
import {log} from './log';
import {OrderDocument} from "../models/order";
import { Notifications } from './notifications';

let localDB: PouchDB.Database = null;
let remoteDB: PouchDB.Database = null;

@autoinject()
export class Database {
    constructor(private auth: Authentication, private config: Configuration, private events: EventAggregator) {
        this.init()
            .then(() => {
                this.events.subscribe(Authentication.AuthenticatedEvent, this.init.bind(this));
            });
    }

    async init(localOps?:PouchDB.Configuration.DatabaseConfiguration) {
        if (localDB === null) {
            if(localOps) {
                localDB = new PouchDB(this.config.app_database_name, localOps);
            } else {
                localDB = new PouchDB(this.config.app_database_name);
            }
        }

        if (this.auth.isAuthenticated()) {
            const userInfo = this.auth.userInfo,
                opts = {
                    skip_setup: true,
                    auth: {username: userInfo.name, password: userInfo.password}
                };

            remoteDB = new PouchDB(this.config.remote_database_name, opts);

            // batch_size option comes from https://stackoverflow.com/a/26555009
            const sync = await localDB.sync(remoteDB, {live: true, batch_size: 1000})
                .on('complete', () => {
                    log.debug('Sync complete');
                })
                .on('error', err => {
                    log.error('Sync error');
                    log.error(err);
                    const values = Object.keys(err).map(k => err[k]);
                    // this happens on iOS 10/Safari. Use the API keys...
                    if(values.indexOf('_reader access is required for this request') !== -1) {
                        try {
                            sync
                        } catch (e) { }

                        localDB = null;
                        Notifications.error('Invalid permissions');
                    }
                })
                .on('change', change => {
                    log.info('Sync change');
                    log.debug(change);
                    if(change.direction === 'pull' && Array.isArray(change.change.docs)) {

                        let deleted = change.change.docs.some(doc => doc._deleted),
                            ordersSynced:boolean = deleted || change.change.docs.some(doc => doc.type === OrderDocument.OrderDocumentType),
                            zonesSynced:boolean = deleted || change.change.docs.some(doc => doc._id === 'zones'),
                            plantsSynced:boolean = deleted || change.change.docs.some(doc => doc._id === 'plants'),
                            activitiesSynced:boolean = deleted || change.change.docs.some(doc => doc.type === ActivityDocument.ActivityDocumentType);

                        if(ordersSynced) {
                            this.events.publish(Database.OrdersSyncChangeEvent);
                        }

                        if(zonesSynced) {
                            this.events.publish(Database.ZonesSyncChangeEvent);
                        }

                        if(plantsSynced) {
                            this.events.publish(Database.PlantsSyncChangeEvent);
                        }

                        if(activitiesSynced) {
                            this.events.publish(Database.ActivitiesSyncChangedEvent);
                        }
                    }
                })
                .on('paused', info => {
                    log.info('Sync paused');
                    log.debug(info);
                })
                .catch(err => {
                    log.error('sync error', err);
                });

            return sync;
        } else {
            return Promise.resolve(null);
        }
    }

    //noinspection JSMethodCanBeStatic
    get db() {
        return localDB;
    }

    get apiKeyOptions():PouchDB.Configuration.DatabaseConfiguration {
        return Configuration.isDebug() ?
        {
            skip_setup: true,
            auth: {username: 'blosterionsionatteracanc', password: '69cae2ccabb512fbdbb35da517c1a64071deb07f'}
        } :
        {
            skip_setup: true,
            auth: {username: 'anytombsoloventmeatterse', password: '1f42225b5e1328fc400e407ce89f253eb834a904'}
        };
    }

    static OrdersSyncChangeEvent:string = 'OrdersSyncChangeEvent';
    static ZonesSyncChangeEvent:string = 'ZonesSyncChangeEvent';
    static PlantsSyncChangeEvent:string = 'PlantsSyncChangeEvent';
    static ActivitiesSyncChangedEvent:string = 'ActivitiesSyncChangedEvent';
}
