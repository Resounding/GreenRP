import {autoinject} from 'aurelia-framework';
import {DialogController, DialogService, DialogCloseResult} from 'aurelia-dialog';
import {OrderDetail} from '../orders/order-detail';
import {OrdersService} from "../../services/data/orders-service";
import {ReferenceService} from "../../services/data/reference-service";
import {Notifications} from "../../services/notifications";
import {SearchFilter, SearchOrder, SearchService} from './search-service';
import {Week} from "../../models/week";
import {OrderDocument} from '../../models/order';
import {Plant} from '../../models/plant';

@autoinject()
export class Search {
    year:number;
    orders: SearchOrder[];
    zones: string[];
    allWeeks: Week[];
    plants: Plant[];
    crops: string[];
    customers: string[];
    searchService:SearchService;
    filter:SearchFilter = new SearchFilter();
    el:Element;

    constructor(private ordersService:OrdersService, private referenceService:ReferenceService, private dialogService:DialogService, private controller:DialogController) {
        controller.settings.lock = true;
        controller.settings.position = position;
    }

    async activate(year:number) {
        try {
        
            this.year = year;

            const zones = await this.referenceService.zones();
            zones.unshift({ name: SearchFilter.ALL_ZONES, autoSpace: null, isPropagationZone: null, tables: null });
            this.zones = _.pluck(zones, 'name');

            this.allWeeks = await this.referenceService.weeks();

            const plants = await this.referenceService.plants();
            plants.unshift({ name: SearchFilter.ALL_PLANTS, crop: SearchFilter.ALL_CROPS, abbreviation: null, cuttingsPerPot: null, cuttingsPerTable: null, hasLightsOut: null, id: null, potsPerCase: null, size: null });
            this.plants = plants;
            this.crops = plants
                .map(p => p.crop)
                .filter((c, idx, self) => self.indexOf(c) === idx);

            const customers = await this.referenceService.customers();
            customers.unshift({ name: SearchFilter.ALL_CUSTOMERS, abbreviation: null });
            this.customers = customers.map(c => c.name);

            await this.loadOrders();

            await this.refresh();

        } catch(e) {
            Notifications.error(e);
        }
    }

    attached() {
        $('select', this.el).dropdown({
            forceSelection: false,
            onChange: this.refresh.bind(this)
        });
    }

    detached() {
        $('select', this.el).dropdown('destroy');
    }

    sortBy(field:string) {
        if(this.filter.sortBy === field && this.filter.sortDirection !== SearchFilter.SORT_DESCENDING) {
            this.filter.sortDirection = SearchFilter.SORT_DESCENDING;
        } else {
            this.filter.sortBy = field;
            this.filter.sortDirection = SearchFilter.SORT_ASCENDING;
        }
        this.refresh();
    }

    detail(order:OrderDocument) {
        this.dialogService.open({
            viewModel: OrderDetail,
            model: order
        }).whenClosed(async result => {
            if(result.wasCancelled) return;

            await this.loadOrders();
            this.refresh();
        });
    }

    async loadOrders():Promise<any> {
        try {

            const orders = await this.ordersService.getAll();
            this.searchService = new SearchService(orders, this.year);

        } catch(e) {
            Notifications.error(e);
        }
    }

    refresh() {
        this.orders = this.searchService.filter(this.filter);
    }
}

function position(modalContainer:Element) {
    const $container = $(modalContainer),
        $aiHeader = $container.find('ux-dialog-header'),
        $aiFooter = $container.find('ux-dialog-footer'),
        $aiBody = $container.find('ux-dialog-body'),
        headerHeight = $aiHeader.outerHeight(),
        footerHeight = $aiFooter.outerHeight(),
        bodyHeight = `calc(100% - ${headerHeight + footerHeight}px)`;

    $aiBody.css({ height: bodyHeight });
}