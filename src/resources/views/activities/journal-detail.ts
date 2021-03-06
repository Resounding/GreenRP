import {autoinject, computedFrom} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {log} from '../../services/log';
import {ActivitiesService, ActivitySaveResult} from '../../services/data/activities-service';
import {ActivityDocument,ActivityStatuses,JournalDocument,JournalRecordingTypes} from '../../models/activity';

@autoinject
export class JournalDetail {
    errors:string[] = [];
    activity:ActivityDocument;
    el:Element;

    constructor(private service:ActivitiesService, private router:Router) { }

    activate(params) {
        if(!params || !params.id || params.id === 'new') {
            return this.goHome();
        }

        this.service.getOne(params.id)
            .then(result => {
                this.activity = result;
                if(!ActivityStatuses.equals(this.activity.status, ActivityStatuses.Incomplete)) {
                    this.completed = true;
                }
                if(!this.activity.journal) {
                    this.activity.journal = new JournalDocument;                    
                }
                if(!this.activity.journal.completedDate) {
                    this.activity.journal.completedDate = new Date;
                }
            });

        $('.button-container', this.el).visibility({ type: 'fixed', offset: 57});
    }

    save() {
        this.saveActivity()
            .then(result => {
                if(result.ok) {
                    this.goHome();
                }
            });
    }
    
    editActivity() {
        this.saveActivity()
            .then(result => {
                if(result.ok) {                    
                    this.router.navigateToRoute('activity-detail', { id: this.activity._id});
                }
            });
    }

    goHome() {
        this.router.navigateToRoute('activities');
    }

    @computedFrom('activity.status')
    get completed():boolean {
        return this.activity && this.activity.status === ActivityStatuses.Complete;
    }
    set completed(value:boolean) {
        this.activity.status = value ? ActivityStatuses.Complete : ActivityStatuses.Incomplete;
    }

    @computedFrom('activity.recordingType')
    get isMeasurement():boolean {
        return this.activity && this.activity.recordingType.toLowerCase() === JournalRecordingTypes.Measurement.toLowerCase();
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
                    }

                    resolve(result);
                })
                .catch(log.error);
        });
    }
}