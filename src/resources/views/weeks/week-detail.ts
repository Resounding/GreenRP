import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';

@autoinject()
export class WeekDetail {
    showWeekDetailSubscription:Subscription;

    constructor(private events:EventAggregator) { }

    attached() {
        this.showWeekDetailSubscription = this.events.subscribe(WeekDetail.ShowWeekDetailEvent, this.show.bind(this));

        $('#week-detail-sidebar').sidebar({
            closable: false
        });
    }

    detached() {
        this.showWeekDetailSubscription.dispose();
        $('#week-detail-sidebar').sidebar('destroy');
    }

    show() {
        $('#week-detail-sidebar').sidebar('show');
    }

    close() {
        $('#week-detail-sidebar').sidebar('hide');
    }

    static ShowWeekDetailEvent:string = 'show-week-detail';
}
