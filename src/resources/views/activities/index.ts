import {OrderDocument} from '../../models/order';
import {autoinject, computedFrom} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {ActivityDetail} from './activity-detail';
import {ActivityDocument, ActivityStatus, ActivityStatuses, WorkType, WorkTypes} from '../../models/activity';
import {TaskCategory, TaskCategoryDoc} from '../../models/task-category';
import {Authentication, Roles} from '../../services/authentication';
import {Database} from '../../services/database';
import {log} from "../../services/log";
import {ActivitiesService} from '../../services/data/activities-service';
import {OrdersService} from '../../services/data/orders-service';
import {ReferenceService} from '../../services/data/reference-service';
import {User, UsersService} from '../../services/data/users-service';
import {Notifications} from "../../services/notifications";

const FILTER_SETTINGS_KEY:string = 'activityListFilterSettings';

const ALL_ZONES:string = 'All Zones';

@autoinject
export class ActivityIndex implements FilterSettings {
    activities:ActivityDocument[] = [];
    workTypes:WorkType[];
    users:string[];
    weeks:WeekItem[] = [];
    zones:string[] = [];
    orders:OrderDocument[] = [];
    activitySyncChangeSubscription:Subscription;
    filtersExpanded:boolean = false;
    customFilter:any = {};
    el:Element;
    week:string = moment().toWeekNumberId();
    workType:WorkType = WorkTypes.ALL_WORK_TYPES;
    zone:string = ALL_ZONES;
    _showMyOverdue:boolean = true;
    _showAll:boolean = false;
    _showCompleted:boolean = false;
    _showIncomplete:boolean = false;
    filtering:boolean = false;
    _categorize:boolean = false;
    categories:TaskCategoryWithActivities[];
    hideCategory:{[index:string]: boolean} = {};

    constructor(private dialogService:DialogService, private service:ActivitiesService,
        private usersService:UsersService, private referenceService:ReferenceService, private ordersService:OrdersService,
        private auth:Authentication, private events:EventAggregator) { }

    async activate(params) {
        try {
            
            Object.assign(this.customFilter, params);
            this.loadFilterSettings();
            
            this.activitySyncChangeSubscription = this.events.subscribe(Database.ActivitiesSyncChangedEvent, this.load.bind(this));        

            this.orders = await this.ordersService.getAll();
            this.workTypes = [WorkTypes.ALL_WORK_TYPES].concat(WorkTypes.getAll());
            const zones = await this.referenceService.zones(),
                fgIndex = zones.findIndex(z => z.name === 'F/G');
            if(fgIndex !== -1) {
                
                const fg = zones[fgIndex],
                    f = Object.assign({}, fg, { name: 'F' }),
                    g = Object.assign({}, fg, { name: 'G' });

                zones.splice(fgIndex, 1, f, g);
            }
            this.zones = [ALL_ZONES].concat(zones.map(z => z.name));

            const thisWeek = moment().toWeekNumberId(),
                lastweek = moment().subtract(1, 'week').toWeekNumberId(),
                nextweek = moment().add(1, 'week').toWeekNumberId(),
                week = moment().subtract(2, 'weeks');
            for(let i = 0; i < 6; i++) {
                const id = week.toWeekNumberId(),
                    formattedWeek = week.format('[Week] W'),
                    text = id === thisWeek ? `This week (${formattedWeek})` : 
                    (id === lastweek ? `Last Week (${formattedWeek})` :
                    (id === nextweek ? `Next Week (${formattedWeek})` : formattedWeek ));
                this.weeks.push({ id, text });
                week.add(1, 'week');
            }

            const result = await this.usersService.getAll();
            this.users = result.map(u => u.name).sort();

            await this.load();

        } catch(e) {
            Notifications.error(e);
        }
    }

    deactivate() {
        this.activitySyncChangeSubscription.dispose();

        this.saveFilterSettings();
    }

    attached() {
        $('.dropdown.work-type', this.el)
            .dropdown({
                forceSelection: true            
            })
            .dropdown('set selected', this.workType)
            .dropdown({ onChange: this.onWorkTypeChange.bind(this) });

        $('.dropdown.week', this.el)
            .dropdown({
                forceSelection: true,            
            })
            .dropdown('set selected', this.week)
            .dropdown({ onChange: this.onWeekChange.bind(this) });

        $('.dropdown.zone', this.el)
            .dropdown({
                forceSelection: true,            
            })
            .dropdown('set selected', this.zone)
            .dropdown({ onChange: this.onZoneChange.bind(this) });
    }

    detached() {
        $('.dropdown', this.el).dropdown('destroy');
    }

    add() {
        this.dialogService.open({ viewModel: ActivityDetail })
            .whenClosed(result => {
                if(result.wasCancelled) return;
            })
            .catch(err => {
                log.error(err);
            });;
    }

    toggleFiltersExpanded() {
        this.filtersExpanded = !this.filtersExpanded;
    }

    toggleShowCategory(category:string) {
        this.hideCategory[category] = !this.hideCategory[category];
    }

    detail(activity:ActivityDocument) {
        this.dialogService.open({ viewModel: ActivityDetail, model: activity })
            .whenClosed(result => {
                if(result.wasCancelled) return;
            })
            .catch(err => {
                log.error(err);
            });
    }

    @computedFrom('_showAll')
    get showAll():boolean {
        return this._showAll;
    }

    set showAll(value:boolean) {
        this._showAll = value;
        this.filter();
    }

    @computedFrom('_showCompleted')
    get showCompleted():boolean {
        return this._showCompleted;
    }

    set showCompleted(value:boolean) {
        this._showCompleted = value;
        this.filter();
    }

    @computedFrom('_showIncomplete')
    get showIncomplete():boolean {
        return this._showIncomplete;
    }

    set showIncomplete(value:boolean) {
        this._showIncomplete = value;
        this.filter();
    }

    @computedFrom('_showMyOverdue')
    get showMyOverdue():boolean {
        return this._showMyOverdue;
    }
    set showMyOverdue(value:boolean) {
        this._showMyOverdue = value;
        this.filter();
    }

    @computedFrom('_categorize')
    get categorize():boolean {
        return this._categorize;
    }
    set categorize(value:boolean) {
        this._categorize = value;
        this.filter();
    }

    private load() {
        this.filter();
    }

    private async filter() {
        try {
            if(this.filtering) return;
            this.filtering = true;

            const filter:any = {
                    selector: {
                        $and: [{
                            type: 'activity'                        
                        }]
                    }
                },
                status = {
                    $in: [
                        ActivityStatuses.NotStarted,
                        ActivityStatuses.NotStarted.toLowerCase(),
                        ActivityStatuses.InProgress,
                        ActivityStatuses.InProgress.toLowerCase()
                    ]
                };
            if(!this.showAll) {
                filter.selector.$and.push({assignedTo: { $eq: this.auth.userInfo.name }});
            }
            if(this.showCompleted) {
                status.$in.push(ActivityStatuses.Complete);
                status.$in.push(ActivityStatuses.Complete.toLowerCase());
            }
            if(this.showIncomplete) {
                status.$in.push(ActivityStatuses.Incomplete);
                status.$in.push(ActivityStatuses.Incomplete.toLowerCase());
            }
            filter.selector.$and.push({status})
            if(this.week && !WorkTypes.equals(this.workType, WorkTypes.ALL_WORK_TYPES)) {
                const properCase = this.workType.charAt(0).toUpperCase() + this.workType.substr(1).toLowerCase(),
                    lowerCase = this.workType.toLowerCase();
                filter.selector.$and.push({workType: { $in: [lowerCase, properCase] }});
            }
            const regex = /week:(\d{4})\.(\d{1,2})/;
            let orders = this.orders;
            if(this.week && regex.test(this.week)) {
                const match = regex.exec(this.week),
                    filterYear = parseInt(match[1]),
                    filterWeek = parseInt(match[2]),
                    filterDate = moment().year(filterYear).isoWeek(filterWeek),
                    start = filterDate.startOf('isoWeek').format('YYYY-MM-DD'),
                    end = filterDate.endOf('isoWeek').toISOString();
                filter.selector.$and.push({ date: { $gte: start }});
                filter.selector.$and.push({ date: { $lte: end }});

                orders = orders.filter(o => {
                    if(Object.keys(o.weeksInHouse).indexOf(this.week) === -1) return false;
                    let zone = this.zone;
                    if(equals(zone, 'F') || equals(zone, 'G')) zone = 'F/G';
                    if(zone && !equals(zone, ALL_ZONES)) {
                        return o.weeksInHouse[this.week].zone === zone;
                    }
                    return true;
                });

                if(this.zone && !equals(this.zone, ALL_ZONES)) {
                    const orderNumbers = orders.map(o => {
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
                    });

                    filter.selector.$and.push({ $or: [
                        { crops: { $elemMatch: { $in: orderNumbers } } },
                        { zones: { $elemMatch: { name: { $eq: this.zone.toUpperCase() } } } }
                    ]});
                }
            }
            // this is the same logic as ActivityDetail::activate()

            const results = await this.service.find(filter);

            if(this.showMyOverdue) {
                try {
                    const overdueFilter = {
                        selector: {
                            $and: [
                                { type: ActivityDocument.ActivityDocumentType },
                                { status: { $in: [ActivityStatuses.NotStarted, ActivityStatuses.InProgress] } },
                                { date: { $lt: moment().startOf('isoWeek').format('YYYY-MM-DD') }},
                                { assignedTo: this.auth.userInfo.name }
                            ]
                        }
                    },
                    overdueItems = await this.service.find(overdueFilter);

                    // we have to do this in a foreach b/c our indices change
                    // as we delete things...
                    overdueItems.forEach(i => {
                        const duplicate = results.find(r => i._id === r._id);
                        if(duplicate) {
                            const index = results.indexOf(duplicate);
                            results.splice(index, 1);
                        }
                    });

                    results.splice(0, 0, ...overdueItems);
                } catch(e) {
                    Notifications.error(e);
                }
            }

            this.activities = [];
            this.categories = [];

            if(this.categorize) {                
                results.forEach(a => {
                    const category:TaskCategory = a.category || new TaskCategoryDoc({name: ' Unassigned', colour: 'white'});
                        
                    let existing = this.categories.find(c => c.name === category.name);

                    if(!existing) {
                        existing = Object.assign({}, category, { activities: []});
                        this.categories.push(existing);
                    }

                    existing.activities.push(a);
                });
            } else {
                this.activities = results;
            }

        } catch(e) {
            if(e instanceof TypeError && e.message === 'Cannot read property \'type\' of undefined') {
                return await this.filter();
            }
            
            Notifications.error(e);
        } finally {
            this.filtering = false;
        }
    }

    private onWorkTypeChange(value:WorkType) {
        this.workType = value;
        this.filter();
    }

    private onWeekChange(value:string) {
        this.week = value;
        this.filter();
    }

    private onZoneChange(value:string) {
        this.zone = value;
        this.filter();
    }

    private loadFilterSettings() {
        const settingsJSON = sessionStorage.getItem(FILTER_SETTINGS_KEY);
        if(settingsJSON) {
            const defaults = {
                    week: moment().toWeekNumberId(),
                    workType: WorkTypes.ALL_WORK_TYPES,
                    _showAll: false,
                    _showCompleted: false,
                    _showIncomplete: false,
                    zone: ALL_ZONES,
                    _categorize: false
                },
                settings:FilterSettings = JSON.parse(settingsJSON);
            Object.assign(this, defaults, settings);
        }
    }

    private saveFilterSettings() {
        const settings:FilterSettings = {
                week: this.week,
                workType: this.workType,
                _showAll: this.showAll,
                _showCompleted: this.showCompleted,
                _showIncomplete: this.showIncomplete,
                zone: this.zone,
                _categorize:this.categorize
            },
            json = JSON.stringify(settings);
        
        sessionStorage.setItem(FILTER_SETTINGS_KEY, json);
    }
}

interface WeekItem {
    id:string;
    text:string;
}

interface FilterSettings {
    week:string;
    workType:WorkType;
    _showAll:boolean;
    _showCompleted:boolean;
    _showIncomplete:boolean;
    zone:string;
    _categorize:boolean;
}

function equals(a:string, b:string) {
    if(a == null || b == null) return false;
    return a.toLowerCase() === b.toLowerCase();
}

interface TaskCategoryWithActivities extends TaskCategory {
    activities:ActivityDocument[];
}