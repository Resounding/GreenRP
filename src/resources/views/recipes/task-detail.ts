import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {Router} from 'aurelia-router';
import {EndingTypes, Event, Events, Periods, Recurrence, RelativeTimes} from '../../models/recurrence';
import {Prompt} from '../controls/prompt';
import {WorkType,WorkTypes,JournalRecordingTypes} from '../../models/activity';
import {RecipeDocument} from '../../models/recipe';
import {TimeDocument} from '../../models/recurrence';
import {TaskDocument} from '../../models/task';
import {RecipeSaveResult, RecipesService} from '../../services/data/recipes-service';
import {Notifications} from '../../services/notifications';

@autoinject
export class TaskDetail {
    errors:string[] = [];
    recipe:RecipeDocument;
    task:TaskDocument;
    workTypes:WorkType[];
    periods:Periods = Periods;
    endingTypes:EndingTypes = EndingTypes;
    events:Event[] = [
        Events.Stick,
        Events.LightsOut,
        Events.Flower
    ];
    weekdays = [
        {id: 1, text: 'Mon'},
        {id: 2, text: 'Tue'},
        {id: 3, text: 'Wed'},
        {id: 4, text: 'Thu'},
        {id: 5, text: 'Fri'}
    ];
    relativeTimes = [
        {id: RelativeTimes.On, text: 'The week of'},
        {id: RelativeTimes.Before, text: 'Before'},
        {id: RelativeTimes.After, text: 'After'}
    ];
    el:Element;

    constructor(private service:RecipesService, private router:Router, private dialogService:DialogService) { }

    activate(params) {
        this.workTypes = WorkTypes.getAll();

        const recipeId = params.id,
            taskId = params.taskid,
            isNew = taskId === 'new';

        return this.service.getOne(params.id)
            .then(result => {
                this.recipe = result;
                if(isNew) {
                    this.task = new TaskDocument({ startTime: new TimeDocument }, -1);
                } else {
                    const taskIndex = parseInt(taskId) || 0;
                    this.task = new TaskDocument(this.recipe.tasks[taskIndex].toJSON(), taskIndex);
                }
            })
            .catch(Notifications.error);
    }

    attached() {
        const $workType = $('.dropdown.workType', this.el)
            .dropdown({ onChange: this.onWorkTypeChange.bind(this) });

        if(!this.task.isNew) {
            $workType.dropdown('set selected', this.task.workType);
        }
    }

    @computedFrom('task.isNew')
    get title():string {
        return this.task && this.task.isNew ? 'New Task' : this.task.name;
    }

    @computedFrom('task.recordingType')
    get isMeasurement():boolean {
        return this.task && this.task.recordingType && this.task.recordingType.toLowerCase() === JournalRecordingTypes.Measurement.toLowerCase();
    }

    set isMeasurement(value:boolean) {
        this.task.recordingType = value ? JournalRecordingTypes.Measurement : JournalRecordingTypes.CheckList;
    }

    save() {
        if(this.task.isNew) {
            this.task.index = this.recipe.tasks.length;
        }
        
        this.recipe.tasks[this.task.index] = this.task;
        
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

                if(this.task.isNew) {
                    this.goToRecipe();
                } else {
                    this.recipe.tasks.splice(this.task.index, 1);
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

    private onWorkTypeChange(value:WorkType) {
        this.task.workType = value;
    }

    private goToRecipe() {
        return this.router.navigateToRoute('recipe-detail', { id: this.recipe._id });
    }
}