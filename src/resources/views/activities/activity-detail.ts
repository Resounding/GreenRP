import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {Router} from 'aurelia-router';
import {Prompt} from '../controls/prompt';
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
import {Zone} from '../../models/zone';
import {Authentication, Roles} from '../../services/authentication';
import {log} from '../../services/log';
import {ActivitiesService, ActivitySaveResult} from '../../services/data/activities-service';
import {OrdersService} from '../../services/data/orders-service';
import {ReferenceService} from '../../services/data/reference-service';
import {User, UsersService} from '../../services/data/users-service';
import {Notifications} from '../../services/notifications';

@autoinject
export class ActivityDetail {
    errors:string[] = [];
    activity:ActivityDocument;
    orders:string[];
    zones:Zone[];
    workTypes:WorkType[];
    statuses:ActivityStatus[];
    users:User[];
    journalShowing:boolean = false;
    journalRecordingTypes:JournalRecordingType[];
    el:Element;
    
    constructor(private service:ActivitiesService, private router:Router, private auth:Authentication,
        private referenceService:ReferenceService, private usersService:UsersService,
        private ordersService:OrdersService, private dialogService:DialogService) { }

    activate(params) {
        const actions:Promise<any>[] = [
            this.usersService.getAll()
                .then(result => this.users = result),
            this.referenceService.zones()
                .then(result => this.zones = result),
            this.ordersService.getAll()
                .then(orders => {
                    const now = moment().toWeekNumberId(),
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
                            
                            return orderNumber;
                        })
                        .sort();
                    this.orders = ordersInHouse;
                })
        ];

        if(params.id === 'new') {
            this.activity = new ActivityDocument;
            this.activity.date = new Date;
            if(this.auth.isInRole(Roles.Grower)) {
                this.activity.assignedTo = this.auth.userInfo.name;
                this.activity.workType = WorkTypes.Growing;
            } else if(this.auth.isInRole(Roles.LabourSupervisor)) {
                this.activity.assignedTo = this.auth.userInfo.name;
                this.activity.workType = WorkTypes.Labour;
            }
        } else {
            actions.push(this.service.getOne(params.id)
                .then(result => {
                    this.activity = result;
                    if(!this.activity.journal) {
                        this.activity.journal = new JournalDocument;
                    }
                }));
        }

        this.workTypes = WorkTypes.getAll();
        this.journalRecordingTypes = JournalRecordingTypes.getAll();        

        return Promise.all(actions)
            .then(() => {
                if(!this.activity.done || this.auth.isInRole(Roles.ProductionManager)) {
                    this.statuses = [
                        ActivityStatuses.NotStarted,
                        ActivityStatuses.InProgress,
                        ActivityStatuses.Incomplete,
                        ActivityStatuses.Complete,
                    ];
                }
            })
            .catch(Notifications.error);
    }

    attached() {
        console.log(this.el);
        debugger;
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
            if(this.activity.zones && this.activity.zones.length) {
                $zone.dropdown('set selected', this.activity.zones.map(z => z.name));
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
    onCropChange(values:string[]) {
        this.activity.crops = values;
    }
    onZoneChange(values:string[]) {
        const zones = this.zones.filter(z => values.indexOf(z.name) !== -1);
        this.activity.zones = zones;
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
