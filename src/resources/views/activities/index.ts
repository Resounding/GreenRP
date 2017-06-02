import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {ActivityDetail} from './activity-detail';
import {ActivityDocument} from '../../models/activity';
import {Database} from '../../services/database';
import {log} from "../../services/log";
import {ActivitiesService} from '../../services/data/activities-service';

@autoinject
export class ActivityIndex {
    activities:ActivityDocument[];
    activitySyncChangeSubscription:Subscription;
    activitiesChangedSubscription:Subscription;

    constructor(private dialogService:DialogService, private service:ActivitiesService,
        private events:EventAggregator) { }

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

    private load() {
        this.service.getAll()
            .then(result => {
                this.activities = result;
            });
    }
}