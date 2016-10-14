import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Configuration} from './configuration';
import {Authentication} from './authentication';
import {log} from './log';
import {OrderDocument} from "../models/order";
import {ZoneDocument} from "../models/zone";

let localDB: PouchDB = null;
let remoteDB: PouchDB = null;

@autoinject()
export class Database {
    constructor(private auth: Authentication, private config: Configuration, private events: EventAggregator) {
        this.init();
        this.events.subscribe(Authentication.AuthenticatedEvent, this.init.bind(this));
    }

    init() {
        if (localDB === null) {
            localDB = new PouchDB(this.config.app_database_name);
            if(Configuration.isDebug()) {
                PouchDB.debug.enable('*');
            }
        }

        if (this.auth.isAuthenticated()) {
            const userInfo = this.auth.userInfo,
                headers = {Authorization: userInfo.basicAuth};

            remoteDB = new PouchDB(this.config.remote_database_name, {
                skip_setup: true,
                auth: {username: userInfo.name, password: userInfo.password}
            });

            localDB.sync(remoteDB, {live: true})
                .on('complete', () => {
                    log.debug('Sync complete');
                })
                .on('error', err => {
                    log.error('Sync error');
                    log.error(err);
                })
                .on('change', change => {
                    log.info('Sync change');
                    log.debug(change);
                    if(change.direction === 'pull' && _.isArray(change.change.docs)) {

                        let ordersSynced:boolean = _.any(change.change.docs, doc => doc.type === OrderDocument.OrderDocumentType),
                            zonesSynced:boolean = _.any(change.change.docs, doc => doc._id === 'zones');

                        if(ordersSynced) {
                            this.events.publish(Database.OrdersSyncChangeEvent);
                        }

                        if(zonesSynced) {
                            this.events.publish(Database.ZonesSyncChangeEvent);
                        }
                    }
                })
                .on('paused', info => {
                    log.info('Sync paused');
                    log.debug(info);
                })
        }
    }

    destroy(): Promise {
        return localDB.destroy()
            .then(() => {
                localDB = null;
                this.init();
            });
    }

    get db() {
        return localDB;
    }

    static OrdersSyncChangeEvent:string = 'OrdersSyncChangeEvent';
    static ZonesSyncChangeEvent:string = 'ZonesSyncChangeEvent';
}