import {Recipe} from '../../models/recipe';
import {RecipesService} from '../../services/data/recipes-service';
import {Notifications} from '../../services/notifications';

import {autoinject} from 'aurelia-framework';

@autoinject
export class RecipesIndex {
    recipes:Recipe[];

    constructor(private service:RecipesService) { }
    
    activate() {
        this.service.getAll()
            .then(recipes => {
                this.recipes = recipes;
            })
            .catch(Notifications.error);
    }
}