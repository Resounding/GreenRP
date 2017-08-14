import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Database} from '../database';
import {Activity, ActivityDocument, ActivityStatuses} from '../../models/activity';
import {Recipe, RecipeDocument} from '../../models/recipe';

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

    async find(filter):Promise<ActivityDocument[]> {
        try {

            const result = await this.database.db.find(filter),
                docs = result.docs.map(doc => new ActivityDocument(doc));
            
            return docs;

        } catch(e) {
            throw e;
        }
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
            if(ActivityStatuses.equals(doc.status, ActivityStatuses.Incomplete) && doc.journal && !doc.journal.notes) {
                result.ok = false;
                result.errors.push('Please enter the reason the activity was Incomplete.');
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

    byCrop():Promise<ActivitiesByCropItem[]> {
        return new Promise((resolve, reject) => {
            this.database.db.query('filters/activities-by-crop')
                .then(result => {
                    const rows = result.rows;

                    if(!rows || !rows.length) return resolve([]);
                        
                    const response:ActivitiesByCropResponse = rows[0].value,
                        keys = Object.keys(response),
                        returnValue:ActivitiesByCropItem[] = [];
                    
                    for(const key of keys.sort()) {
                        const item = { crop: key, activities: response[key] };
                        returnValue.push(item);
                    }

                    resolve(returnValue);
                })
                .catch(reject);
        });
    }

    byRecipe():Promise<ActivitiesByRecipeItem[]> {
        return new Promise((resolve, reject) => {
            this.database.db.find({ selector: {
                type: { '$eq': RecipeDocument.RecipeDocumentType }
            }})
            .then((recipesResult) => {
                const recipes = recipesResult.docs.reduce((memo, doc) => {
                    memo[doc._id] = doc;
                    return memo;
                }, {});
                

                this.database.db.query('filters/activities-by-recipe')
                    .then(result => {
                        const rows = result.rows;

                        if(!rows || !rows.length) return resolve([]);

                        const response:ActivitiesByRecipeResponse = rows[0].value,
                            keys = Object.keys(response),
                            returnValue:ActivitiesByRecipeItem[] = [];
                        
                        for(const key of keys.sort()) {
                            const recipe = recipes[key];
                            if(recipe) {
                                const item = { recipe, activities: response[key] };
                                returnValue.push(item);
                            }
                        }

                        resolve(returnValue);
                    })
                    .catch(reject);
            })
            .catch(reject);

        });
    }
}

interface ActivitiesByCropResponse {
    [index:string]: Activity[];
}

export interface ActivitiesByCropItem {
    crop:string;
    activities:Activity[];
}

interface ActivitiesByRecipeResponse {
    [index:string]: Activity[];
}

export interface ActivitiesByRecipeItem {
    recipe:Recipe;
    activities:Activity[];
}