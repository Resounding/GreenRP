import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogService, DialogResult} from 'aurelia-dialog';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {OrdersService} from "../../services/data/orders-service";
import {ReferenceService} from "../../services/data/reference-service";
import {WeekDetailService, WeekDetailFilter, WeekDetailOrder} from "../../services/domain/week-detail-service";
import {Week} from "../../models/week";
import {OrderDocument} from "../../models/order";
import {OrderDetail} from "../orders/order-detail";

@autoinject()
export class WeekDetail {
    showWeekDetailSubscription:Subscription;
    filter:WeekDetailFilter = new WeekDetailFilter();
    weekDetailService:WeekDetailService;
    orders: WeekDetailOrder[] = [];
    zones: string[];

    constructor(private events:EventAggregator, private ordersService:OrdersService, referenceService:ReferenceService, private dialogService:DialogService, private element:Element) {
        this.loadOrders();

        referenceService.zones()
            .then(result => this.zones = _.pluck(result, 'name').sort());
    }

    attached() {
        this.showWeekDetailSubscription = this.events.subscribe(WeekDetail.ShowWeekDetailEvent, this.show.bind(this));

        $('#week-detail-sidebar').sidebar({
            closable: false,
            onShow: this.onShow.bind(this)
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
        $('i', this.element).popup('destroy');
        $('#week-detail-sidebar').sidebar('hide');
    }

    loadOrders() {
        return this.ordersService.getAll()
            .then(orders => {
                this.weekDetailService = new WeekDetailService(orders);
            });
    }

    refresh() {
        $('i', this.element).popup('destroy');
        this.orders = this.weekDetailService.filter(this.filter);
        window.setTimeout(() => {
            $('i', this.element).popup();
        });
    }

    onShow() {
        $('.calendar', this.element).calendar('popup', 'show');
        $('.calendar', this.element).calendar('popup', 'hide');
    }

    onStartChange(value:string) {
        this.filter.startDate = moment(value).toDate();
        this.refresh();
    }

    onEndChange(value:string) {
        this.filter.endDate = moment(value).toDate();
        this.refresh();
    }

    detail(order:OrderDocument) {
        this.dialogService.open({
            viewModel: OrderDetail,
            model: order
        }).then((result:DialogResult) => {
            if(result.wasCancelled) return;

            this.loadOrders().then(this.refresh.bind(this));
        });
    }

    notYet() {
        alert('The reports are not ready yet');
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
