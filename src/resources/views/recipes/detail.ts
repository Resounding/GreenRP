import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {Router} from 'aurelia-router';
import {Prompt} from '../controls/prompt';
import {Plant} from '../../models/plant';
import {RecipeDocument} from '../../models/recipe';
import {Zone} from '../../models/zone';
import {RecipeSaveResult, RecipesService} from '../../services/data/recipes-service';
import {ReferenceService} from '../../services/data/reference-service';
import {Notifications} from '../../services/notifications';

@autoinject
export class ReceipeDetail {
    recipeId:string = 'new';
    recipe:RecipeDocument = new RecipeDocument;
    plants:Plant[];
    zones:Zone[];
    title:string = 'New Recipe';
    errors:string[] = [];

    constructor(private service:RecipesService, private referenceService:ReferenceService,
        private router:Router, private dialogService:DialogService) { }

    activate(params) {
        const setup = Promise.all([
            this.referenceService.plants()
                .then(plants => this.plants = plants),
            this.referenceService.zones()
                .then(zones => {
                    this.zones = zones.reduce((memo, zone) => {
                        if(zone.name === 'F/G') {
                            const f = Object.assign({}, zone),
                                g = Object.assign({}, zone);
                            f.name = 'F';
                            g.name = 'G';
                            memo.push(f);
                            memo.push(g);
                        } else {
                            memo.push(zone);
                        }
                        return memo;
                    }, []);
                })
        ]);

        return setup
            .then(() => {
                if(params.id && params.id !== 'new') {
                    this.service.getOne(params.id)
                        .then(result => {
                            this.recipe = result;
                            this.recipeId = this.recipe._id;
                            this.title = 'Edit Recipe';
                        })
                        .catch(Notifications.error);
                } else {
                    this.hasPlant = true;
                }
            })
            .catch(Notifications.error);
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