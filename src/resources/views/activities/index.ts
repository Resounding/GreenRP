import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {ActivityDetail} from './activity-detail';
import {ActivityDocument} from '../../models/activity';
import {Authentication, Roles} from '../../services/authentication';
import {Database} from '../../services/database';
import {log} from "../../services/log";
import {ActivitiesService} from '../../services/data/activities-service';

@autoinject
export class ActivityIndex {
    allActivities:ActivityDocument[];
    activities:ActivityDocument[];
    activitySyncChangeSubscription:Subscription;
    activitiesChangedSubscription:Subscription;
    private _showAll:boolean = false;

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

    detail(activity:ActivityDocument) {
        this.dialogService.open({ viewModel: ActivityDetail, model: activity })
            .whenClosed(result => {
                if(result.wasCancelled) return;
            })
            .catch(err => {
                log.error(err);
            });
    }

    get canShowAll():boolean {
        return this.auth.isInRole(Roles.ProductionManager);
    }

    get showAll():boolean {
        return this._showAll;
    }

    set showAll(value:boolean) {
        this._showAll = value;
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
        this.activities = this._showAll ?
            this.allActivities :
            this.allActivities.filter(a => a.assignedTo === this.auth.userInfo.name);
    }
}