import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Activity, ActivityDocument} from '../../models/activity';
import {Database} from '../database';

export interface ActivitySaveResult {
    ok:boolean;
    activity?:ActivityDocument;
    errors:string[];
}

@autoinject
export class ActivitiesService {
    public static ActivitiesChangedEvent:string = 'Activities changed';

    constructor(private database:Database, private events:EventAggregator) { }

    getOne(id:string):Promise<ActivityDocument> {
        return new Promise((resolve, reject) => {
            this.database.db.get(id)
                .then(result => {
                    const doc = new ActivityDocument(result);
                    resolve(doc);
                })
                .catch(reject);
        });
    }

    getAll():Promise<ActivityDocument[]> {
        return new Promise((resolve, reject) => {
            this.database.db.find({ selector: { type: ActivityDocument.ActivityDocumentType }})
                .then(result => {
                    const docs = result.docs.map(doc => new ActivityDocument(doc));
                    resolve(docs);
                })
                .catch(reject);
        });
    }

    save(activity:Activity):Promise<ActivitySaveResult> {
        return new Promise((resolve, reject) => {

            const doc = new ActivityDocument(activity),
                json = doc.toJSON(),
                result:ActivitySaveResult = {
                    ok: true,
                    errors: []
                };
            
            if(!doc.name) {
                result.ok = false;
                result.errors.push('The Activity Name is required.')
            }
            if(!doc.date || !moment(doc.date).isValid()) {
                result.ok = false;
                result.errors.push('Please choose a valid due date.');
            }

            if(!result.ok) {
                return resolve(result);
            }   

            if(doc.isNew) {
                return this.database.db.post(json)
                    .then((response:PouchDB.Core.Response) => {
                        if(response.ok) {
                            doc._id = response.id;
                            doc._rev = response.rev;
                            result.activity = doc;
                            this.events.publish(ActivitiesService.ActivitiesChangedEvent);
                            resolve(result);
                        }
                        return reject(Error('Activity was not saved.'));
                    })
                    .catch(reject);
            } else {
                return this.database.db.put(json)
                    .then((response:PouchDB.Core.Response) => {
                        if(response.ok) {
                            doc._rev = response.rev;
                            result.activity = doc;
                            this.events.publish(ActivitiesService.ActivitiesChangedEvent);
                            resolve(result);
                        }
                        return reject(Error('Activity was not saved.'));
                    })
                    .catch(reject);

            }
        });
    }

    delete(activity:ActivityDocument):Promise<ActivitySaveResult> {
        return new Promise((resolve, reject) => {
            const result:ActivitySaveResult = {
                ok: true,
                errors: [],
                activity: activity
            };

            this.database.db.remove(activity._id, activity._rev)
                .then((response:PouchDB.Core.Response) => {
                    if(response.ok) {
                        this.events.publish(ActivitiesService.ActivitiesChangedEvent);
                        return resolve(result);
                    }

                    return reject(response);
                })
                .catch(reject);
        });
    }
}