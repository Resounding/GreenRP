import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {Zone} from "../../models/zone";
import {OrdersService} from "../../services/data/orders-service";
import {ReferenceService} from "../../services/data/reference-service";
import {ZoneDetailService} from "../../services/domain/zone-detail-service";
import {Order} from "../../models/order";
import {Plant} from "../../models/plant";

@autoinject()
export class ZoneDetail {
    year:number;
    zone:Zone;
    showZoneDetailSubscription: Subscription;
    model:ZoneDetailModel;

    constructor(private events:EventAggregator,
                private orderService:OrdersService, private referenceService:ReferenceService,
                private zoneDetailService:ZoneDetailService) { }

    attached() {
        this.showZoneDetailSubscription = this.events.subscribe(ZoneDetail.ShowZoneDetailEvent, this.show.bind(this));

        $('#zone-detail-sidebar').sidebar({
            closable: false
        });
    }

    detached() {
        this.showZoneDetailSubscription.dispose();
        $('#zone-detail-sidebar').sidebar('destroy');
    }

    show(model:ZoneDetailModel) {
        $('#zone-detail-sidebar').sidebar('show');
        console.log(model);
        this.zone = model.zone;
        this.year = model.year;

        let orders:Order[],
            plants:Plant[];

        Promise.all([
            this.orderService.getAll()
                .then(result => orders = result),
            this.referenceService.plants()
                .then(result => plants = result)
        ])
        .then(() => {
           this.model = this.zoneDetailService.createModel(plants, orders, model.year, model.zone);
            console.log(this.model);
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
