import {autoinject, computedFrom} from 'aurelia-framework';
import {EventAggregator, Subscription} from "aurelia-event-aggregator";
import {CapacityService} from "../../services/domain/capacity-service";
import {CapacityWeek} from "../../models/capacity-week";
import {Database} from '../../services/database';
import {log} from '../../services/log';
import {ReferenceService} from "../../services/data/reference-service";
import {OrdersService} from '../../services/data/orders-service';
import {Zone} from "../../models/zone";
import {ZoneDetail, ZoneDetailInputModel} from "../zones/zone-detail";
import {WeekDetail} from "../weeks/week-detail";

@autoinject()
export class Index {
    el:Element;
    weeks:Map<string, CapacityWeek>;
    zones:Zone[];
    year:number = new Date().getFullYear();
    orderChangedSubscription:Subscription;
    ordersSyncChangeSubscription:Subscription;
    zonesSyncChangedSubscription:Subscription;

    constructor(private referenceService:ReferenceService, private capacityService:CapacityService,
                private events:EventAggregator) { }

    activate(params) {

        this.orderChangedSubscription = this.events.subscribe(OrdersService.OrdersChangedEvent, this.load.bind(this));
        this.ordersSyncChangeSubscription = this.events.subscribe(Database.OrdersSyncChangeEvent, this.load.bind(this));

        if('year' in params) {
            const yearParam:number = parseInt(params.year);
            if(!isNaN(yearParam)){
                this.year = yearParam;
            }
        }

        this.loadZones();
        this.load();

        window.setTimeout(() => {
            $('.sticky', this.el).sticky();
        }, 100);
    }

    deactivate() {
        this.orderChangedSubscription.dispose();
        this.ordersSyncChangeSubscription.dispose();

        $('.sticky', this.el).sticky('destroy');
    }

    load() {
        this.capacityService.getCapacityWeeks(this.year)
            .then(result => {
                const thisWeek = moment().isoWeek(),
                    thisYear = moment().isoWeekYear();
                this.weeks = new Map<string, CapacityWeek>();
                result.forEach((value, key) => {
                    if(value.year === thisYear && value.week >= thisWeek || value.year > thisYear) {
                        this.weeks.set(key, value);
                    }
                });
            })
            .catch(error => {
                log.error(error);
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
                log.error(error);
                if(error.status === 404) {
                    this.zonesSyncChangedSubscription = this.events.subscribe(Database.ZonesSyncChangeEvent, this.loadZones.bind(this));
                }
            });
    }

    showZoneDetails(zone:Zone) {
        const model:ZoneDetailInputModel = { year: this.year, zone: zone };
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

    @computedFrom('zones')
    get zoneWidth():string {
        if(!this.zones || !this.zones.length) return '';

        var width = Math.floor(16 / this.zones.length),
            number = toNumber(width);

        return number;
        
    }

    @computedFrom('zones')
    get weekWidth():string {
        if(!this.zones || !this.zones.length) return '';

        var weekWidth = Math.floor(16 / this.zones.length),
            width = 16 - (this.zones.length * weekWidth),
            number = toNumber(width);

        return number;
    }
}

function toNumber(value:number):string {
    switch(value) {
        case 1: return 'one';
        case 2: return 'two';
        case 3: return 'three';
        case 4: return 'four';        
    }

    return '';
}