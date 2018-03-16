import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {Router} from 'aurelia-router';
import {Prompt} from '../controls/prompt';
import {EndingTypes, Event, Events, Periods, Recurrence, RelativeTimes} from '../../models/recurrence';
import {WorkType,WorkTypes,JournalRecordingTypes} from '../../models/activity';
import {RecipeDocument} from '../../models/recipe';
import {TimeDocument} from '../../models/recurrence';
import {TaskDocument} from '../../models/task';
import {TaskCategory} from '../../models/task-category';
import {Notifications} from '../../services/notifications';
import {ActivitiesService} from '../../services/data/activities-service';
import {RecipeSaveResult, RecipesService} from '../../services/data/recipes-service';
import {ReferenceService} from '../../services/data/reference-service';
import {TaskCategoryService} from '../../services/data/task-category-service';
import {equals} from '../../utilities/equals';

@autoinject
export class TaskDetail {
    errors:string[] = [];
    recipe:RecipeDocument;
    task:TaskDocument;
    isPlant:boolean = false;
    weeks:WeekSelection[] = [];
    workTypes:WorkType[];
    categories:TaskCategory[];
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
        {id: 5, text: 'Fri'},
        {id: 6, text: 'Sat'},
        {id: 0, text: 'Sun'}
    ];
    relativeTimes = [
        {id: RelativeTimes.On, text: 'The week of'},
        {id: RelativeTimes.Before, text: 'Before'},
        {id: RelativeTimes.After, text: 'After'},
        {id: RelativeTimes.WeekOfYear, text: 'Week of the Year'},
    ];
    zones:string[];
    el:Element;
    private _specificZones:boolean;

    constructor(private service:RecipesService, private activityService:ActivitiesService,
            private referenceService:ReferenceService, private taskCategoryService:TaskCategoryService,
            private router:Router, private dialogService:DialogService) { }

    async activate(params) {
        try {
            this.workTypes = WorkTypes.getAll();
            this.categories = await this.taskCategoryService.getAll();

            const recipeId = params.id,
                taskId = params.taskid,
                isNew = taskId === 'new',
                activityId = params.activityid;

            const zones = await this.referenceService.zones();
            this.zones = zones.map(z => z.name);
            for(let i = 1; i < 53; i++) {
                this.weeks.push({ value: i, text: `Week ${i}`});
            }

            this.recipe =  await this.service.getOne(params.id);            

            this.isPlant = this.recipe.plant != null;

            if(!this.isPlant) {                
                this.events = [Events.Week];
            }

            if(isNew) {
                this.task = new TaskDocument({ startTime: new TimeDocument }, -1);
                if(!this.isPlant) {
                    this.task.startTime.event = Events.Week;
                    this.task.startTime.weekNumber = moment().isoWeek();
                }

                if(activityId) {
                    this.activityService.getOne(activityId)
                        .then(activity => {
                            Object.assign(this.task, {
                                name: activity.name,
                                description: activity.description,
                                workType: activity.workType,
                                recordingType: activity.recordingType,
                                unitOfMeasure: activity.unitOfMeasure                                    
                            });
                        })
                        .catch(Notifications.error);
                }
            } else {
                const taskIndex = parseInt(taskId) || 0;
                this.task = new TaskDocument(this.recipe.tasks[taskIndex].toJSON(), taskIndex);                
            }

        } catch(err) {
            Notifications.error(err);
        }
    }

    attached() {
        const $workType = $('.dropdown.workType', this.el)
            .dropdown({ onChange: this.onWorkTypeChange.bind(this) });

        if(this.task.workType) {
            $workType.dropdown('set selected', this.task.workType);
        }

        const $category = $('.dropdown.category', this.el)
            .dropdown({ onChange: this.onCategoryChange.bind(this) });

        if(this.task.category) {
            $category.dropdown('set selected', this.task.category.name);
        }

        const $startWeek = $('.dropdown.start-week', this.el)
            .dropdown({ onChange: this.onStartWeekChange.bind(this) });

        if(!this.task.isNew) {
            $startWeek.dropdown('set selected', this.task.startTime.weekNumber);
        }

        const $endWeek = $('.dropdown.end-week', this.el)
            .dropdown({ onChange: this.onEndWeekChange.bind(this) });

        if(!this.task.isNew && this.task.recurrence && this.task.recurrence.endTime) {
            $endWeek.dropdown('set selected', this.task.recurrence.endTime.weekNumber);
        }

        const $zones = $('.dropdown.zones', this.el)
            .dropdown({ onChange: this.onZonesChange.bind(this) });

        if(Array.isArray(this.task.zones) && this.task.zones.length) {
            $zones.dropdown('set selected', this.task.zones);
            this.specificZones = true;
        } else {
            this.specificZones = false;
        }
        $zones.dropdown('hide');
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

    get specificZones():boolean {
        return this._specificZones;
    }
    set specificZones(value:boolean) {
        const $zones = $('.dropdown.zones', this.el)
        this._specificZones = value;
        if(value) {
            $zones
                .show()
                .dropdown('show');
        } else {
            delete this.task.zones;
            $zones
                .hide();
        }
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

    private onCategoryChange(value:string) {
        const category = this.categories.find(c => equals(value, c.name));
        this.task.category = category;
    }

    private onStartWeekChange(value:number) {
        this.task.startTime.weekNumber = numeral(value).value();
    }

    private onEndWeekChange(value:number) {
        if(this.task.recurrence) {
            this.task.recurrence.endTime.weekNumber = numeral(value).value();
        }
    }

    private onZonesChange(values:string[]) {
        this.task.zones = values;
    }

    private goToRecipe() {
        return this.router.navigateToRoute('recipe-detail', { id: this.recipe._id });
    }
}

interface WeekSelection {
    value:number;
    text:string;
}