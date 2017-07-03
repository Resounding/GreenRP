import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Recipe, RecipeDocument} from '../../models/recipe';
import {Database} from '../database';

@autoinject
export class RecipesService {
    public static RecipesChangedEvent:string = 'Recipes changed';

    constructor(private database:Database, private events:EventAggregator) { }

    getOne(id:string):Promise<RecipeDocument> {
        return new Promise((resolve, reject) => {
            this.database.db.get(id)
                .then(result => {
                    const doc = new RecipeDocument(result);
                    resolve(doc);
                })
                .catch(reject);
        });
    }

    getAll():Promise<RecipeDocument[]> {
        return new Promise((resolve, reject) => {
            this.database.db.find({ selector: { type: RecipeDocument.RecipeDocumentType }})
                .then(result => {
                    const docs = result.docs.map(doc => new RecipeDocument(doc));
                    resolve(docs);
                })
                .catch(reject);
        });
    }

    save(recipe:Recipe):Promise<RecipeSaveResult> {
        return new Promise((resolve, reject) => {

            const doc = new RecipeDocument(recipe),
                json = doc.toJSON(),
                result:RecipeSaveResult = {
                    ok: true,
                    errors: []
                };
            
            if(!doc.name) {
                result.ok = false;
                result.errors.push('The Recipe Name is required.')
            }
            if(!doc.plant && !doc.zone) {
                result.ok = false;
                result.errors.push('Please choose a plant or a zone.')
            }
            if(Array.isArray(doc.tasks) && doc.tasks.some(t => !t.name)) {
                result.ok = false;
                result.errors.push('Please enter a name for the task.')
            }
            if(Array.isArray(doc.tasks) && doc.tasks.some(t => !t.workType)) {
                result.ok = false;
                result.errors.push('Please choose the Type for the task.')
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
                            result.recipe = doc;
                            this.events.publish(RecipesService.RecipesChangedEvent);
                            resolve(result);
                        }
                        return reject(Error('Recipe was not saved.'));
                    })
                    .catch(reject);
            } else {
                return this.database.db.put(json)
                    .then((response:PouchDB.Core.Response) => {
                        if(response.ok) {
                            doc._rev = response.rev;
                            result.recipe = doc;
                            this.events.publish(RecipesService.RecipesChangedEvent);
                            resolve(result);
                        }
                        return reject(Error('Recipe was not saved.'));
                    })
                    .catch(reject);

            }
        });
    }

    delete(recipe:RecipeDocument):Promise<RecipeSaveResult> {
        return new Promise((resolve, reject) => {
            const result:RecipeSaveResult = {
                ok: true,
                errors: [],
                recipe: recipe
            };

            this.database.db.remove(recipe._id, recipe._rev)
                .then((response:PouchDB.Core.Response) => {
                    if(response.ok) {
                        this.events.publish(RecipesService.RecipesChangedEvent);
                        return resolve(result);
                    }

                    return reject(response);
                })
                .catch(reject);
        });
    }
}

export interface RecipeSaveResult {
    ok:boolean;
    recipe?:RecipeDocument;
    errors:string[];    
}