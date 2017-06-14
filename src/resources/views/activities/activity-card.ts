import {Notifications} from '../../services/notifications';
import {autoinject, computedFrom, bindable} from 'aurelia-framework';
import {ActivitiesService} from '../../services/data/activities-service';
import {Activity} from '../../models/activity';

@autoinject
export class ActivityCard {
    @bindable activity:Activity;

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