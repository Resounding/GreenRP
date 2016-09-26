import {autoinject, computedFrom} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {OrdersService} from "../../services/data/orders-service";
import {ReferenceService} from "../../services/data/reference-service";
import {WeekDetailService, WeekDetailFilter, WeekDetailOrder} from "../../services/domain/week-detail-service";
import {Week} from "../../models/week";

@autoinject()
export class WeekDetail {
    showWeekDetailSubscription:Subscription;
    filter:WeekDetailFilter = new WeekDetailFilter();
    weekDetailService:WeekDetailService;
    orders: WeekDetailOrder[] = [];
    zones: string[];

    constructor(private events:EventAggregator, ordersService:OrdersService, referenceService:ReferenceService, private element:Element) {
        ordersService.getAll()
            .then(orders => {
                this.weekDetailService = new WeekDetailService(orders);
            });

        referenceService.zones()
            .then(result => this.zones = _.pluck(result, 'name').sort());
    }

    attached() {
        this.showWeekDetailSubscription = this.events.subscribe(WeekDetail.ShowWeekDetailEvent, this.show.bind(this));

        $('#week-detail-sidebar').sidebar({
            closable: false
        });

        $('[name=zones]', this.element).dropdown({
            forceSelection: false,
            placeholder: 'Select Zone',
            onChange: this.refresh.bind(this)
        });
        $('.calendar.start', this.element).calendar({
            type: 'date',
            onChange: this.onStartChange.bind(this)
        });
        $('.calendar.end', this.element).calendar({
            type: 'date',
            onChange: this.onEndChange.bind(this)
        });
    }

    detached() {
        this.showWeekDetailSubscription.dispose();
        $('#week-detail-sidebar').sidebar('destroy');
        $('[name=zones]', this.element).dropdown('destroy');
        $('.calendar.start', this.element).calendar('destroy')
        $('.calendar.end', this.element).calendar('destroy')
    }

    show(week:Week) {
        $('#week-detail-sidebar').sidebar('show');
        this.filter = new WeekDetailFilter(week);
        $('.calendar.start', this.element).calendar('set date', this.filter.startDate);
        $('.calendar.end', this.element).calendar('set date', this.filter.endDate);
        this.refresh();
    }

    close() {
        $('#week-detail-sidebar').sidebar('hide');
    }

    refresh() {
        this.orders = this.weekDetailService.filter(this.filter);
    }

    onStartChange(value:string) {
        this.filter.startDate = moment(value).toDate();
        this.refresh();
    }

    onEndChange(value:string) {
        this.filter.endDate = moment(value).toDate();
        this.refresh();
    }

    @computedFrom('filter.startDate')
    get startDateDisplay() {
        if(!this.filter.startDate) return '';
        return moment(this.filter.startDate).format('ddd, MMM Do');
    }

    @computedFrom('filter.endDate')
    get endDateDisplay() {
        if(!this.filter.endDate) return '';
        return moment(this.filter.endDate).format('ddd, MMM Do');
    }

    static ShowWeekDetailEvent:string = 'show-week-detail';
}
