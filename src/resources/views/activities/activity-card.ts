import {autoinject, computedFrom, bindable} from 'aurelia-framework';
import {Notifications} from '../../services/notifications';
import {ActivitiesService} from '../../services/data/activities-service';
import {ActivityDocument, ActivityStatuses} from '../../models/activity';

@autoinject
export class ActivityCard {
    @bindable activity:ActivityDocument;

    constructor(private service:ActivitiesService, private element:Element) { }

    attached() {
        $('.calendar.snooze', this.element).calendar({
            type: 'date',
            onChange: this.onSnoozeChange.bind(this)
        });
    }

    detached() {
        $('.calendar.snooze', this.element).calendar('destroy');
    }

    @computedFrom('activity.status')
    get done():boolean {
        return ActivityStatuses.equals(this.activity.status, ActivityStatuses.Complete) || ActivityStatuses.equals(this.activity.status, ActivityStatuses.Incomplete);
    }

    onSnoozeChange(value:string) {
        const date = moment(value).toDate();
        this.activity.date = date;
        this.service.save(this.activity)
            .then(result => {
                if(result.ok) {
                    Notifications.success('Due Date changed successfully.');
                } else {
                    Notifications.error(result.errors[0]);
                }
            })
            .catch(Notifications.error);
    }
}