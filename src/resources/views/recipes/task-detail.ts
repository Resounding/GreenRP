import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {Router} from 'aurelia-router';
import {EndingTypes, Event, Events, Periods, Recurrence, RelativeTimes} from '../../models/recurrence';
import {Prompt} from '../controls/prompt';
import {RecipeDocument} from '../../models/recipe';
import {EndingTypes, Event, Events, Periods, Recurrence, RelativeTimes} from '../../models/recurrence';
import {TaskDocument} from '../../models/task';
import {RecipeSaveResult, RecipesService} from '../../services/data/recipes-service';
import {Notifications} from '../../services/notifications';
import {Prompt} from '../controls/prompt';
import {RecipeDocument} from '../../models/recipe';
import {RecipesService} from '../../services/data/recipes-service';
import {Notifications} from '../../services/notifications';

@autoinject
export class TaskDetail {
    isNew:boolean = true;
    taskIndex:number;
    title:string = 'New Task';
    errors:string[] = [];
    recipe:RecipeDocument;
    task:TaskDocument = new TaskDocument;
    periods:Periods = Periods;
    endingTypes:EndingTypes = EndingTypes;
    events:Event[] = [
        Events.Stick,
        Events.Space,
        Events.LightsOut,
        Events.Flower
    ];
    weekdays = [
        {id: 1, text: 'Monday'},
        {id: 2, text: 'Tuesday'},
        {id: 3, text: 'Wednesday'},
        {id: 4, text: 'Thursday'},
        {id: 5, text: 'Friday'},
        {id: 6, text: 'Saturday'},
    ];
    relativeTimes = [
        {id: RelativeTimes.On, text: 'The week of'},
        {id: RelativeTimes.Before, text: 'Before'},
        {id: RelativeTimes.After, text: 'After'}
    ];

    constructor(private service:RecipesService, private router:Router, private dialogService:DialogService) { }

    activate(params) {
        const recipeId = params.id,
            taskId = params.taskid;

        this.isNew = (taskId === 'new');

        this.service.getOne(params.id)
            .then(result => {
                this.recipe = result;
                if(!this.isNew) {
                    this.taskIndex = parseInt(taskId) || 0;
                    this.task = new TaskDocument(this.recipe.tasks[this.taskIndex].toJSON());
                    this.title = this.task.name;
                }
            })
            .catch(Notifications.error);
    }

    save() {
        if(this.isNew) {
            this.recipe.tasks.push(this.task);
        } else {
            this.recipe.tasks[this.taskIndex] = this.task;
        }
        
        this.saveRecipe()
            .then(result => {
                if(!result.ok) return;

                this.goToRecipe();
            });
    }

    cancel() {
        this.goToRecipe();
    }

    delete() {
        this.dialogService.open({ viewModel: Prompt, model: 'Are you sure you want to remove this task from the recipe?'})
            .whenClosed(result => {
                if(result.wasCancelled) return;

                if(this.isNew) {
                    this.goToRecipe();
                } else {
                    this.recipe.tasks.splice(this.taskIndex, 1);
                    this.saveRecipe()
                        .then(result => {
                            if(!result.ok) return;

                            this.goToRecipe();
                        });
                }
            })
            .catch(Notifications.error);
    }

    private saveRecipe():Promise<RecipeSaveResult> {
        return new Promise((resolve, reject) => {
            return this.service.save(this.recipe)
                .then(result => {
                    if(!result.ok) {                        
                        this.errors = result.errors;
                    }
                    
                    return resolve(result);
                })
                .catch(reject);
        });
    }

    private goToRecipe() {
        return this.router.navigateToRoute('recipe-detail', { id: this.recipe._id });
    }
}