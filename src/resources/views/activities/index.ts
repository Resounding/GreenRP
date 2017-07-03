import {autoinject, computedFrom} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {ActivityDetail} from './activity-detail';
import {ActivityDocument, ActivityStatus, ActivityStatuses, WorkType, WorkTypes} from '../../models/activity';
import {Authentication, Roles} from '../../services/authentication';
import {Database} from '../../services/database';
import {log} from "../../services/log";
import {ActivitiesService} from '../../services/data/activities-service';
import {User, UsersService} from '../../services/data/users-service';
import {Notifications} from "../../services/notifications";

@autoinject
export class ActivityIndex {
    allActivities:ActivityDocument[] = [];
    activities:ActivityDocument[] = [];
    workTypes:WorkType[];
    users:string[];
    weeks:WeekItem[] = [];
    activitySyncChangeSubscription:Subscription;
    activitiesChangedSubscription:Subscription;
    filtersExpanded:boolean = false;
    el:Element;
    private _week:string = moment().toWeekNumberId();
    private _workType:WorkType = null;
    private _showAll:boolean = false;
    private _showCompleted:boolean = false;
    private _showIncomplete:boolean = false;

    constructor(private dialogService:DialogService, private service:ActivitiesService, private usersService:UsersService,
        private auth:Authentication, private events:EventAggregator) { }

    activate() {
        this.activitySyncChangeSubscription = this.events.subscribe(Database.ActivitiesSyncChangedEvent, this.load.bind(this));        
        this.activitiesChangedSubscription = this.events.subscribe(ActivitiesService.ActivitiesChangedEvent, this.load.bind(this));

        this.workTypes = [WorkTypes.ALL_WORK_TYPES].concat(WorkTypes.getAll());

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

        this.usersService.getAll()
            .then(result => {
                this.users = ['Unassigned'].concat(result.map(u => u.name).sort());                    
            })
            .catch(Notifications.error);

        this.load();
    }

    deactivate() {
        this.activitySyncChangeSubscription.dispose();
        this.activitiesChangedSubscription.dispose();
    }

    attached() {
        $('.dropdown.work-type', this.el).dropdown({
            forceSelection: true,
            onChange: this.onWorkTypeChange.bind(this)
        });
        $('.dropdown.week', this.el).dropdown({
            forceSelection: true,
            onChange: this.onWeekChange.bind(this)
        }).dropdown('set selected', this._week);
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

    private load() {
        this.service.getAll()
            .then(result => {
                this.allActivities = result;
                this.filter();
            });
    }

    private filter() {
        this.activities = this.allActivities;
        if(!this._showAll) {
            this.activities = this.activities.filter(a => a.assignedTo === this.auth.userInfo.name);
        }
        if(!this._showCompleted) {
            this.activities = this.activities.filter(a => !ActivityStatuses.equals(a.status, ActivityStatuses.Complete))
        }
        if(!this._showIncomplete) {
            this.activities = this.activities.filter(a => !ActivityStatuses.equals(a.status, ActivityStatuses.Incomplete))
        }
        if(this._workType && !WorkTypes.equals(this._workType, WorkTypes.ALL_WORK_TYPES)) {
            this.activities = this.activities.filter(a => WorkTypes.equals(a.workType, this._workType));
        }
        if(this._week) {
            this.activities = this.activities.filter(a => moment(a.date).toWeekNumberId() === this._week);
        }
    }

    private onWorkTypeChange(value:WorkType) {
        this._workType = value;
        this.filter();
    }

    private onWeekChange(value:string) {
        this._week = value;
        this.filter();
    }
}

interface WeekItem {
    id:string;
    text:string;
}