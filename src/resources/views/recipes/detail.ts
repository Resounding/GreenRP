import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {Router} from 'aurelia-router';
import {Prompt} from '../controls/prompt';
import {Plant} from '../../models/plant';
import {RecipeDocument} from '../../models/recipe';
import {Zone} from '../../models/zone';
import {Notifications} from '../../services/notifications';
import {RecipeSaveResult, RecipesService} from '../../services/data/recipes-service';
import {ReferenceService} from '../../services/data/reference-service';
import {UsersService} from '../../services/data/users-service';

@autoinject
export class RecipeDetail {
    recipeId:string = 'new';
    recipe:RecipeDocument = new RecipeDocument;
    plants:Plant[];
    zones:Zone[];
    users:string[];
    title:string = 'New Recipe';
    errors:string[] = [];

    constructor(private service:RecipesService, private referenceService:ReferenceService, private usersService:UsersService,
        private router:Router, private dialogService:DialogService) { }

    async activate(params) {
        try {
            const users = await this.usersService.getAll();
            this.users = users.map(u => u.name).sort();

            if(params.id && params.id !== 'new') {
                try {
                    const result = await this.service.getOne(params.id)
                    this.recipe = result;
                    this.recipeId = this.recipe._id;
                    this.title = `Recipe for ${this.recipe.zone ? ' Zone ' : ''} ${this.recipe.name}`;
                    
                    if(result.plant) {
                        this.plants = [result.plant];
                    } else if(result.zone) {
                        this.zones = [result.zone];
                    }                    
                } catch(e) {
                    Notifications.error(e);
                }
            } else {
                const recipes = await this.service.getAll();

                const plants = await this.referenceService.plants();
                this.plants = plants.reduce((memo, plant) => {
                    if(!recipes.some(r => r.plant && r.plant.id === plant.id)) {
                        memo.push(plant);
                    }
                    return memo;
                }, []);

                const zones = await this.referenceService.zones(),
                    fgIndex = zones.findIndex(z => z.name === 'F/G');
                if(fgIndex !== -1) {
                    
                    const fg = zones[fgIndex],
                        f = Object.assign({}, fg, { name: 'F' }),
                        g = Object.assign({}, fg, { name: 'G' });

                    zones.splice(fgIndex, 1, f, g);
                }
                
                this.zones = zones.reduce((memo, zone) => {
                    if(!recipes.some(r => r.zone && r.zone.name === zone.name)) {
                        memo.push(zone);
                    }
                    return memo;
                }, []);

                this.users = this.users.reduce((memo, user) => {
                    if(!recipes.some(r => r.user === user)) {
                        memo.push(user);
                    }
                    return memo;
                }, []);

                this.hasPlant = true;
            }
            
        } catch(e) {
            Notifications.error(e);
        }
    }

    save() {
        this.saveRecipe()
            .then(result => {
                if(!result.ok) return;
                
                Notifications.success('Recipe saved successfully');
                this.goHome();
            })
    }

    delete() {
        this.dialogService.open({ viewModel: Prompt, model: 'Are you sure you want to delete this recipe?'})
            .whenClosed(result => {
                if(result.wasCancelled) return;

                this.service.delete(this.recipe)
                    .then(result => {
                        if(result.ok) {
                            return this.goHome();
                        }
                        
                        this.errors = result.errors;
                    })
                    .catch(Notifications.error);
            })
            .catch(Notifications.error);
    }

    goToTask(taskid) {
        this.saveRecipe()
            .then(result => {
                if(!result.ok) return;

                const id = result.recipe._id;
                if(typeof taskid === 'undefined') taskid = 'new';

                this.router.navigateToRoute('task-detail', { id, taskid });
            });
    }

    plantMatcher(a:Plant, b:Plant):boolean {
        // both null?
        if(a === b) return true;
        // either null?
        if((a && !b) || (b && !a)) return false;

        return a.id === b.id;
    }

    zoneMatcher(a:Zone, b:Zone):boolean {
        // both null?
        if(a === b) return true;
        // either null?
        if((a && !b) || (b && !a)) return false;

        return a.name === b.name;
    }

    @computedFrom('recipe.plant')
    get hasPlant():boolean {
        return !!this.recipe.plant;
    }
    set hasPlant(value:boolean) {
        this.recipe.plant = value ? this.plants[0] : null;
    }
    @computedFrom('recipe.zone')
    get hasZone():boolean {
        return !!this.recipe.zone;
    }
    set hasZone(value:boolean) {
        this.recipe.zone = value ? this.zones[0] : null;
    }
    @computedFrom('recipe.user')
    get hasUser():boolean {
        return !!this.recipe.user;
    }
    set hasUser(value:boolean) {
        this.recipe.user = value ? this.users[0] : null;
    }

    private saveRecipe():Promise<RecipeSaveResult> {
        return new Promise((resolve, reject) => {
            return this.service.save(this.recipe)
                .then(result => {
                    this.errors = result.errors;
                    return resolve(result);
                })
                .catch(Notifications.error);
        });
    }

    private goHome() {
        return this.router.navigateToRoute('recipes');
    }
}