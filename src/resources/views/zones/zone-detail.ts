import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {DialogController} from 'aurelia-dialog';
import {Zone} from "../../models/zone";

@autoinject()
export class ZoneDetail {
    year:number;
    zone:Zone;
    showZoneDetailSubscription: Subscription

    constructor(private controller:DialogController, private events:EventAggregator) { }

    attached() {
        this.showZoneDetailSubscription = this.events.subscribe(ZoneDetail.ShowZoneDetailEvent, this.show.bind(this));

        $('#zone-detail-sidebar').sidebar({
            closable: true,
            dimPage: false
        });
    }

    detached() {
        this.showZoneDetailSubscription.dispose();
    }

    show(model:ZoneDetailModel) {
        $('#zone-detail-sidebar').sidebar('show');

        this.zone = model.zone;
        this.year = model.year;
    }

    close() {
        $('#zone-detail-sidebar').sidebar('hide');
    }

    static ShowZoneDetailEvent:string = 'show-zone-detail';
}

export interface ZoneDetailModel {
    zone:Zone;
    year:number;
}
