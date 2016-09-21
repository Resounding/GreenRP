import {autoinject, computedFrom} from 'aurelia-framework';
import {CapacityService} from "../../services/domain/capacity-service";
import {CapacityWeek} from "../../models/capacity-week";
import {ReferenceService} from "../../services/data/reference-service";
import {Zone} from "../../models/zone";
import {EventAggregator, Subscription} from "aurelia-event-aggregator";
import {Calculator} from "../calculator/calculator";
import {DialogService} from "aurelia-dialog";
import {ZoneDetail, ZoneDetailModel} from "../zones/zone-detail";
import {WeekDetail} from "../weeks/week-detail";


@autoinject()
export class Index {
    weeks:Map<string, CapacityWeek>;
    zones:Zone[];
    year:number = new Date().getFullYear();
    orderCreatedSubscription:Subscription;

    constructor(referenceService:ReferenceService, private capacityService:CapacityService,
                private events:EventAggregator, private dialogService:DialogService, private element:Element) {

        referenceService.zones()
            .then(result => {
                this.zones = result;
            })
            .catch(error => {
                console.error(error);
            });
    }

    activate(params) {

        this.orderCreatedSubscription = this.events.subscribe(Calculator.OrderCreatedEvent, this.load.bind(this));

        if('year' in params) {
            const yearParam:number = parseInt(params.year);
            if(!isNaN(yearParam)){
                this.year = yearParam;
            }
        }

        this.load();
    }

    deactivate() {
        this.orderCreatedSubscription.dispose();
    }

    load() {
        this.capacityService.getCapacityWeeks(this.year)
            .then(result => {
                this.weeks = result;
            })
            .catch(error => {
                console.error(error);
            });
    }

    showZoneDetails(zone:Zone) {
        const model:ZoneDetailModel = { year: this.year, zone: zone };
        this.events.publish(ZoneDetail.ShowZoneDetailEvent, model);
    }

    showWeekDetails(week:CapacityWeek) {
        this.events.publish(WeekDetail.ShowWeekDetailEvent);
    }

    @computedFrom('year')
    get lastYear() {
        return this.year - 1;
    }

    @computedFrom('year')
    get nextYear() {
        return this.year + 1;
    }
}
