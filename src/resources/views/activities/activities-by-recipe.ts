import {autoinject} from "aurelia-framework";
import {ActivitiesService, ActivitiesByRecipeItem} from '../../services/data/activities-service';

@autoinject
export class ActivitiesByRecipe {
    recipes:ActivitiesByRecipeItem[]; 

    constructor(private service:ActivitiesService) { }

    async activate() {
        this.recipes = await this.service.byRecipe();
    }
}