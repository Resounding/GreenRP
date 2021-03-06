import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {Router} from 'aurelia-router';
import * as jquery from 'jquery';
import {Prompt} from '../controls/prompt';
import {OrderDetail} from '../orders/order-detail';
import {
    ActivityDocument,
    ActivityStatus,
    ActivityStatuses,
    JournalDocument,
    JournalRecordingType,
    JournalRecordingTypes,
    WorkType,
    WorkTypes,
} from '../../models/activity';
import {OrderDocument} from '../../models/order';
import {Recipe} from '../../models/recipe';
import {TaskCategory} from '../../models/task-category';
import {Zone} from '../../models/zone';
import {Authentication, Roles} from '../../services/authentication';
import {log} from '../../services/log';
import {ActivitiesService, ActivitySaveResult} from '../../services/data/activities-service';
import {OrdersService} from '../../services/data/orders-service';
import {RecipesService} from '../../services/data/recipes-service';
import {ReferenceService} from '../../services/data/reference-service';
import {TaskCategoryService} from '../../services/data/task-category-service';
import {User, UsersService} from '../../services/data/users-service';
import {Notifications} from '../../services/notifications';
import {equals} from '../../utilities/equals'

@autoinject
export class ActivityDetail {
    errors:string[] = [];
    activity:ActivityDocument;
    orders:string[];
    zones:Zone[];
    workTypes:WorkType[];
    categories:TaskCategory[];
    statuses:ActivityStatus[];
    users:User[];
    journalShowing:boolean = false;
    journalRecordingTypes:JournalRecordingType[];
    recipes:Recipe[];
    el:Element;
    orderNumberMap = { };
    
    constructor(private service:ActivitiesService, private router:Router, private auth:Authentication,
        private referenceService:ReferenceService, private usersService:UsersService,
        private ordersService:OrdersService, private recipeService:RecipesService, private taskCategoryService:TaskCategoryService,
        private dialogService:DialogService) { }

    async activate(params) {
        try {
            this.recipes = await this.recipeService.getAll();
            this.users = await this.usersService.getAll();
            const zones = await this.referenceService.zones(),
                fgIndex = zones.findIndex(z => z.name === 'F/G');
            if(fgIndex !== -1) {
                
                const fg = zones[fgIndex],
                    f = Object.assign({}, fg, { name: 'F' }),
                    g = Object.assign({}, fg, { name: 'G' });

                zones.splice(fgIndex, 1, f, g);
            }
            this.zones = zones;

            const orders = await this.ordersService.getAll(),
                now = moment().toWeekNumberId(),
                ordersInHouse = orders.filter(o => {
                    const weeks = Object.keys(o.weeksInHouse),
                        isInHouse = weeks.indexOf(now) !== -1;  

                    return isInHouse;
                })
                .map(o => {
                    const plant = o.plant ? o.plant.abbreviation : '',
                        customer = o.customer ? o.customer.abbreviation : '',
                        arrival = moment(o.arrivalDate),
                        stick = moment(o.stickDate),
                        arrivalWeek = arrival.isoWeek(),
                        arrivalDay = arrival.isoWeekday(),
                        stickYear = stick.isoWeekYear(),
                        stickWeek = stick.isoWeek(),
                        stickDay = stick.isoWeekday(),
                        orderNumber = `${plant}${customer}${stickYear}-${stickWeek}-${stickDay} (${arrivalWeek}-${arrivalDay})`;
                    
                    // save this so we can show the modal later on.
                    this.orderNumberMap[orderNumber] = o._id;

                    return orderNumber;
                })
                .sort();
            this.orders = ordersInHouse;
            
            if(params.id === 'new') {
                this.activity = new ActivityDocument;
                this.activity.date = new Date;
                this.activity.assignedTo = this.auth.userInfo.name;
                if(this.auth.isInRole(Roles.Grower)) {
                    this.activity.workType = WorkTypes.Growing;
                } else if(this.auth.isInRole(Roles.LabourSupervisor)) {
                    this.activity.workType = WorkTypes.Labour;
                }
            } else {
                this.activity = await this.service.getOne(params.id);
                if(!this.activity.journal) {
                    this.activity.journal = new JournalDocument;
                }
                const crops = this.activity.crops;
                // any crops not currently in the house put at the top of the list
                if(Array.isArray(crops)) {
                    for(let i = crops.length - 1; i >= 0; i--) {
                        const crop = crops[i];
                        if(this.orders.indexOf(crop) === -1) {
                            this.orders.unshift(crop);
                        }
                    }
                }
            }

            this.workTypes = WorkTypes.getAll();
            this.journalRecordingTypes = JournalRecordingTypes.getAll();
            this.categories = await this.taskCategoryService.getAll();

            if(!this.activity.done || this.auth.isInRole(Roles.ProductionManager)) {
                this.statuses = [
                    ActivityStatuses.NotStarted,
                    ActivityStatuses.InProgress,
                    ActivityStatuses.Incomplete,
                    ActivityStatuses.Complete,
                ];
            }
        } catch(e) {
            Notifications.error(e);
        }
    }

    attached() {
        $('.dropdown.recipe', this.el)
            .dropdown({ onChange: this.onAddToRecipeChange.bind(this) });

        if(!this.activity.done || this.auth.isInRole(Roles.ProductionManager)) {
            $('.dropdown.status', this.el)
                .dropdown({ onChange: this.onStatusChange.bind(this) })
                .dropdown('set selected', this.activity.status);
            $('.dropdown.assignedTo', this.el)
                .dropdown({ onChange: this.onAssignedToChange.bind(this) })
                .dropdown('set selected', this.activity.assignedTo);
            $('.dropdown.workType', this.el)
                .dropdown({ onChange: this.onWorkTypeChange.bind(this) })
                .dropdown('set selected', this.activity.workType);
            $('.dropdown.crop', this.el)
                .dropdown({ onChange: this.onCropChange.bind(this) })
                .dropdown('set selected', this.activity.crops);
            const $zone = $('.dropdown.zone', this.el)
                .dropdown({ onChange: this.onZoneChange.bind(this) });
            $('.dropdown.crop', this.el).on('click', 'a.ui', this.onCropClick.bind(this));
            if(this.activity.zones && this.activity.zones.length) {
                $zone.dropdown('set selected', this.activity.zones.map(z => z.name));
            }
            const $category = $('.dropdown.category', this.el)
                .dropdown({ onChange: this.onCategoryChange.bind(this) });

            if(this.activity.category) {
                $category.dropdown('set selected', this.activity.category.name);
            }
            $('.calendar.due-date', this.el).calendar({
                type: 'date',
                firstDayOfWeek: 1,
                onChange: this.onDateChange.bind(this),
                formatter: {
                    cell: (cell:jQuery, date:Date, cellOptions:any) => {
                        if(cellOptions.mode === 'day' && date.getDay() === 1) {
                            const week = moment(date).isoWeek(),
                                text = cell.text(),
                                html =  `<span class="ui blue basic ribbon label">${week}</span>&nbsp;${text}`;
                            cell.html(html);
                        }
                    }
                }
            }).calendar('set date', this.activity.date);

            const $completedDate = $('.calendar.completed-date', this.el).calendar({
                type: 'date',
                firstDayOfWeek: 1,
                onChange: this.onCompletedDateChange.bind(this),
                formatter: {
                    cell: (cell:jQuery, date:Date, cellOptions:any) => {
                        if(cellOptions.mode === 'day' && date.getDay() === 1) {
                            const week = moment(date).isoWeek(),
                                text = cell.text(),
                                html =  `<span class="ui blue basic ribbon label">${week}</span>&nbsp;${text}`;
                            cell.html(html);
                        }
                    }
                }
            });
            if(this.activity.journal && this.activity.journal.completedDate) {
                $completedDate.calendar('set date', this.activity.journal.completedDate);
            }
        }

        $('.button-container', this.el).visibility({ type: 'fixed', offset: 57});
    }

    detached() {
        $('.dropdown', this.el).dropdown('destroy');
        $('.calendar', this.el).calendar('destroy');
        $('.button-container', this.el).visibility('destroy');
    }

    save() {
        this.saveActivity()
            .then(result => {
                if(result.ok) {
                    this.goHome();
                }
            });
    }

    saveAndComplete() {
        this.activity.status = ActivityStatuses.Complete;
        this.activity.journal = new JournalDocument;
        this.activity.journal.completedDate = new Date;

        this.saveActivity()
            .then(result => {
                if(result.ok) {
                    this.router.navigateToRoute('activity-detail', { id: result.activity._id });
                }
            });
    }

    delete() {
        this.dialogService.open({ viewModel: Prompt, model: 'Are you sure you want to delete this activity?'})
            .whenClosed(result => {
                if(result.wasCancelled) return;

                this.service.delete(this.activity)
                    .then(result => {
                        if(result.ok) {
                            this.goHome();
                        } else {
                            this.errors = result.errors;
                        }
                    })
                    .catch(err => log.error(err))
            })
            .catch(err => {
                log.error(err);
            })
    }

    addJournal() {        
        this.saveActivity()
            .then(result => {
                if(result.ok) {
                    this.router.navigateToRoute('journal-detail', { id: this.activity._id});
                }
            });
    }

    goHome() {
        this.router.navigateToRoute('activities');
    }

    onDateChange(value:string) {
        const date = moment(value).toDate();
        this.activity.date = date;
    }
    onCompletedDateChange(value:string) {
        const date = moment(value).toDate();
        this.activity.journal.completedDate = date;
    }
    onStatusChange(value:ActivityStatus) {
        this.activity.status = value;
    }
    onAssignedToChange(value:string) {
        this.activity.assignedTo = value;
    }
    onWorkTypeChange(value:WorkType) {
        this.activity.workType = value;
    }
     onCategoryChange(value:string) {
        const category = this.categories.find(c => equals(value, c.name));
        this.activity.category = category;
    }
    onCropChange(values:string[]) {
        this.activity.crops = values;
    }
    onZoneChange(values:string[]) {
        const zones = this.zones.filter(z => values.indexOf(z.name) !== -1);
        this.activity.zones = zones;
    }
    async onCropClick(e:Event) {
        try {
            // if they click the X to remove it, it will be an <i> element
            const target:HTMLElement = <HTMLElement>e.target;
            if(target.tagName === 'A') {
                const orderNumber = target.innerText,
                    originalOrderNumber = this.orderNumberMap[orderNumber];
                if(originalOrderNumber) {
                    const order = await this.ordersService.getOne(originalOrderNumber);
                    this.dialogService.open({
                        viewModel: OrderDetail,
                        model: order
                    });
                }
            }
        } catch(e) {
            Notifications.error(e);
        }
    }
    async onAddToRecipeChange(value:string, text:string, $choice:jQuery) {
        try {
            const result = await this.saveActivity();
            if(result.ok) {
                const href = $choice.get(0).href;
                this.router.navigate(href);
            }

        } catch(e) {
            Notifications.error(e);
        }
    }

    @computedFrom('activity.isNew')
    get title():string {
        return this.activity && this.activity.isNew ? 'New Activity' : this.activity.name;
    }

    @computedFrom('activity.date')
    get dateDisplay():string {
        if(!this.activity.date) return 'Not Set';

        return moment(this.activity.date).format('ddd, MMM D, YYYY');
    }

    @computedFrom('activity.recordingType')
    get isMeasurement():boolean {
        return this.activity && this.activity.recordingType.toLowerCase() === JournalRecordingTypes.Measurement.toLowerCase();
    }

    set isMeasurement(value:boolean) {
        this.activity.recordingType = value ? JournalRecordingTypes.Measurement : JournalRecordingTypes.CheckList;
    }

    @computedFrom('activity.journal.completedDate')
    get completedDateDisplay():string {
        if(!this.activity.journal || !this.activity.journal.completedDate) return 'Not Set';

        return moment(this.activity.journal.completedDate).format('ddd, MMM D, YYYY');
    }

    private saveActivity():Promise<ActivitySaveResult> {
        this.errors = [];
        return new Promise((resolve, reject) => {
            return this.service.save(this.activity)
                .then(result => {
                    if(result.ok) {
                        if(this.activity.isNew) {
                            this.activity._id = result.activity._id;
                        }
                        this.activity._rev = result.activity._rev;
                    } else {
                        this.errors = result.errors;
                    }

                    resolve(result);
                })
                .catch(log.error);
        });
    }
}
