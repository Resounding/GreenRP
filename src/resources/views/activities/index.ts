import {OrderDocument} from '../../models/order';
import {autoinject, computedFrom} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {ActivityDetail} from './activity-detail';
import {ActivityDocument, ActivityStatus, ActivityStatuses, WorkType, WorkTypes} from '../../models/activity';
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
    activitiesChangedSubscription:Subscription;
    filtersExpanded:boolean = false;
    customFilter:any = {};
    el:Element;
    week:string = moment().toWeekNumberId();
    workType:WorkType = WorkTypes.ALL_WORK_TYPES;
    zone:string = ALL_ZONES;
    private _showAll:boolean = false;
    private _showCompleted:boolean = false;
    private _showIncomplete:boolean = false;
    private filtering:boolean = false;

    constructor(private dialogService:DialogService, private service:ActivitiesService,
        private usersService:UsersService, private referenceService:ReferenceService, private ordersService:OrdersService,
        private auth:Authentication, private events:EventAggregator) { }

    async activate(params) {
        try {
            
            Object.assign(this.customFilter, params);
            this.loadFilterSettings();
            
            this.activitySyncChangeSubscription = this.events.subscribe(Database.ActivitiesSyncChangedEvent, this.load.bind(this));        
            this.activitiesChangedSubscription = this.events.subscribe(ActivitiesService.ActivitiesChangedEvent, this.load.bind(this));

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
                    text = id === thisWeek ? 'This week' :
                    (id === lastweek ? 'Last Week' :
                    (id === nextweek ? 'Next Week' : week.format('[Week] W')));
                this.weeks.push({ id, text });
                week.add(1, 'week');
            }

            const result = await this.usersService.getAll();
            this.users = ['Unassigned'].concat(result.map(u => u.name).sort());

            await this.load();

        } catch(e) {
            Notifications.error(e);
        }
    }

    deactivate() {
        this.activitySyncChangeSubscription.dispose();
        this.activitiesChangedSubscription.dispose();

        this.saveFilterSettings();
    }

    attached() {
        $('.dropdown.work-type', this.el).dropdown({
            forceSelection: true,
            onChange: this.onWorkTypeChange.bind(this)
        }).dropdown('set selected', this.workType);
        $('.dropdown.week', this.el).dropdown({
            forceSelection: true,
            onChange: this.onWeekChange.bind(this)
        }).dropdown('set selected', this.week);
        $('.dropdown.zone', this.el).dropdown({
            forceSelection: true,
            onChange: this.onZoneChange.bind(this)
        }).dropdown('set selected', this.zone);
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

    private async load() {
        const result = await this.service.getAll();
        this.filter();
    }

    private filter() {
        try {
            if(this.filtering) return;
            this.filtering = true;

            const filter:any = {
                selector: {
                    $and: [{ type: 'activity'}]
                }
            };
            if(!this.showAll) {
                filter.selector.$and.push({assignedTo: { $eq: this.auth.userInfo.name }});
            }
            if(!this.showCompleted) {
                filter.selector.$and.push({status: { $nin: [ActivityStatuses.Incomplete,  ActivityStatuses.Incomplete.toLowerCase()]}});
            }
            if(!this.showIncomplete) {
                filter.selector.$and.push({status: { $nin: [ActivityStatuses.Complete,  ActivityStatuses.Complete.toLowerCase()]}});
            }
            if(this.week && !WorkTypes.equals(this.workType, WorkTypes.ALL_WORK_TYPES)) {
                const properCase = this.workType.charAt(0).toUpperCase() + this.workType.substr(1).toLowerCase(),
                    lowerCase = this.workType.toLowerCase();
                filter.selector.$and.push({workType: { $in: [lowerCase, properCase] }});
            }
            const regex = /week:(\d{4})\.(\d{2})/;
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
            //     this.activities = this.activities.filter(a => (moment(a.date).toWeekNumberId() === this.week) ||
            //         // asking for this week & not started & prior to today
            //         (thisWeek && ActivityStatuses.equals(a.status, ActivityStatuses.NotStarted) && moment(a.date).isBefore(moment(), 'day')));

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
            
            this.service.find(filter)
                .then(result => {                    
                    this.activities = result;
                    this.filtering = false;
                })
                .catch(err => {
                    Notifications.error(err);
                    this.filtering = false;
                });

        } catch(e) {
            Notifications.error(e);
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
                    showAll: false,
                    showCompleted: false,
                    showIncomplete: false,
                    zone: ALL_ZONES
                },
                settings:FilterSettings = JSON.parse(settingsJSON);
            Object.assign(this, defaults, settings);
        }
    }

    private saveFilterSettings() {
        const settings:FilterSettings = {
                week: this.week,
                workType: this.workType,
                showAll: this.showAll,
                showCompleted: this.showCompleted,
                showIncomplete: this.showIncomplete,
                zone: this.zone
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
    showAll:boolean;
    showCompleted:boolean;
    showIncomplete:boolean;
    zone:string;
}

function equals(a:string, b:string) {
    if(a == null || b == null) return false;
    return a.toLowerCase() === b.toLowerCase();
}