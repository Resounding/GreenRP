import {autoinject, computedFrom} from 'aurelia-framework';
import {CapacityService} from "../../services/domain/capacity-service";
import {CapacityWeek} from "../../models/capacity-week";
import {Database} from '../../services/database';
import {ReferenceService} from "../../services/data/reference-service";
import {Zone} from "../../models/zone";
import {EventAggregator, Subscription} from "aurelia-event-aggregator";
import {Calculator} from "../calculator/calculator";
import {ZoneDetail, ZoneDetailModel} from "../zones/zone-detail";
import {WeekDetail} from "../weeks/week-detail";

@autoinject()
export class Index {
    weeks:Map<string, CapacityWeek>;
    zones:Zone[];
    year:number = new Date().getFullYear();
    orderCreatedSubscription:Subscription;
    ordersSyncChangeSubscription:Subscription;
    zonesSyncChangedSubscription:Subscription;

    constructor(private referenceService:ReferenceService, private capacityService:CapacityService,
                private events:EventAggregator) { }

    activate(params) {

        this.orderCreatedSubscription = this.events.subscribe(Calculator.OrderCreatedEvent, this.load.bind(this));
        this.ordersSyncChangeSubscription = this.events.subscribe(Database.OrdersSyncChangeEvent, this.load.bind(this));

        if('year' in params) {
            const yearParam:number = parseInt(params.year);
            if(!isNaN(yearParam)){
                this.year = yearParam;
            }
        }

        this.loadZones();
        this.load();
    }

    deactivate() {
        this.orderCreatedSubscription.dispose();
        this.ordersSyncChangeSubscription.dispose();
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

    loadZones() {
        this.referenceService.zones()
            .then(result => {
                this.zones = result;

                if(this.zonesSyncChangedSubscription) {
                    this.zonesSyncChangedSubscription.dispose();
                }
            })
            .catch(error => {
                console.error(error);
                if(error.status === 404) {
                    this.zonesSyncChangedSubscription = this.events.subscribe(Database.ZonesSyncChangeEvent, this.loadZones.bind(this));
                }
            });
    }

    showZoneDetails(zone:Zone) {
        const model:ZoneDetailModel = { year: this.year, zone: zone };
        this.events.publish(ZoneDetail.ShowZoneDetailEvent, model);
    }

    showWeekDetails(week:CapacityWeek) {
        this.events.publish(WeekDetail.ShowWeekDetailEvent, week);
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
