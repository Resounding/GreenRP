import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {DialogController} from 'aurelia-dialog';
import {Zone} from "../../models/zone";
import {OrdersService, ZoneWeek} from "../../services/data/orders-service";

@autoinject()
export class ZoneDetail {
    year:number;
    zone:Zone;
    showZoneDetailSubscription: Subscription;
    orders:Map<string,ZoneWeek>;

    constructor(private controller:DialogController, private events:EventAggregator, private orderService:OrdersService) { }

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
        console.log(model);
        this.zone = model.zone;
        this.year = model.year;

        this.orderService.getForZone(this.zone, this.year)
            .then(result => {
                console.log(result);
                this.orders = result;
            })
            .catch(err => {
                console.error(err);
            });
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
