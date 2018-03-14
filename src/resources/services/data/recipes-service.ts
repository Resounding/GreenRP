import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Recipe, RecipeDocument} from '../../models/recipe';
import {Database} from '../database';

@autoinject
export class RecipesService {
    public static RecipesChangedEvent:string = 'Recipes changed';

    constructor(private database:Database, private events:EventAggregator) { }

    async getOne(id:string):Promise<RecipeDocument> {
        try {

            const result = await this.database.db.get(id),
                doc = new RecipeDocument(result);

            return doc;

        } catch(e) {
            throw e;
        }
    }

    async getAll():Promise<RecipeDocument[]> {
        try {
            
            const result = await this.database.db.query<Recipe>('filters/recipes', { include_docs: true }),
                docs = result.rows.map(row => new RecipeDocument(row.doc));

            return docs;

        } catch(e) {
            throw e;
        }
    }

    async save(recipe:Recipe):Promise<RecipeSaveResult> {
        try {
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
            if(!doc.plant && !doc.zone && !doc.user) {
                result.ok = false;
                result.errors.push('Please choose a plant, a zone or a person.')
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
                return result;
            }   

            if(doc.isNew) {
                const response = await this.database.db.post(json);
                
                if(!response.ok) throw Error('Recipe was not saved.');
                    
                doc._id = response.id;
                doc._rev = response.rev;
                result.recipe = doc;
                this.events.publish(RecipesService.RecipesChangedEvent);
                return result;
                                                    
            } else {
                const response = await this.database.db.put(json);
                
                if(!response.ok) throw Error('Recipe was not saved.');

                doc._rev = response.rev;
                result.recipe = doc;
                this.events.publish(RecipesService.RecipesChangedEvent);
                return result;
            }
        } catch(e) {
            throw e;
        }
    }

    async delete(recipe:RecipeDocument):Promise<RecipeSaveResult> {
        try {
            const result:RecipeSaveResult = {
                ok: true,
                errors: [],
                recipe: recipe
            };

            const response = await this.database.db.remove(recipe._id, recipe._rev);

            if(!response.ok) throw Error('Recipe was not deleted.');
            
            this.events.publish(RecipesService.RecipesChangedEvent);
            return result;

        } catch(e) {
            throw e;
        }
    }
}

export interface RecipeSaveResult {
    ok:boolean;
    recipe?:RecipeDocument;
    errors:string[];    
}