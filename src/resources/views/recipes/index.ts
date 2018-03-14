import {autoinject} from 'aurelia-framework';
import {Recipe} from '../../models/recipe';
import {RecipesService} from '../../services/data/recipes-service';
import {Notifications} from '../../services/notifications';

@autoinject
export class RecipesIndex {
    recipes:Recipe[];

    constructor(private service:RecipesService) { }
    
    async activate() {
        try {

            this.recipes = await this.service.getAll();
                        
        } catch(e) {
            Notifications.error(e);
        }
    }
}