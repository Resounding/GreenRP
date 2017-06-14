import {autoinject, computedFrom} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {ActivityDetail} from './activity-detail';
import { ActivityDocument, ActivityStatus, ActivityStatuses } from '../../models/activity';
import {Authentication, Roles} from '../../services/authentication';
import {Database} from '../../services/database';
import {log} from "../../services/log";
import {ActivitiesService} from '../../services/data/activities-service';

@autoinject
export class ActivityIndex {
    allActivities:ActivityDocument[] = [];
    activities:ActivityDocument[] = [];
    activitySyncChangeSubscription:Subscription;
    activitiesChangedSubscription:Subscription;
    filtersExpanded:boolean = false;
    private _showAll:boolean = false;
    private _showCompleted:boolean = false;
    private _showIncomplete:boolean = false;

    constructor(private dialogService:DialogService, private service:ActivitiesService,
        private auth:Authentication, private events:EventAggregator, private element:Element) { }

    activate() {
        this.activitySyncChangeSubscription = this.events.subscribe(Database.ActivitiesSyncChangedEvent, this.load.bind(this));        
        this.activitiesChangedSubscription = this.events.subscribe(ActivitiesService.ActivitiesChangedEvent, this.load.bind(this));

        this.load();
    }

    deactivate() {
        this.activitySyncChangeSubscription.dispose();
        this.activitiesChangedSubscription.dispose();
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
    }
}