import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogController, DialogService, DialogResult} from 'aurelia-dialog';
import {Prompt} from "../controls/prompt";
import {CapacityService} from '../../services/domain/capacity-service';
import {OrderCalculator} from '../../services/domain/order-calculator';
import {OrdersService} from "../../services/data/orders-service";
import {ReferenceService} from '../../services/data/reference-service';
import {CapacityWeek} from "../../models/capacity-week";
import {OrderDocument} from "../../models/order";
import {Season} from '../../models/season';
import {SeasonTime} from '../../models/season-time';
import {Zone} from "../../models/zone";

@autoinject()
export class OrderDetail {
    calculator:OrderCalculator;
    populatePromise:Promise<any>;

    constructor(private orderService:OrdersService, private referenceService:ReferenceService, private capacityService:CapacityService,
        private element:Element, private dialogService:DialogService, private controller:DialogController) {
        controller.settings.lock = true;
        controller.settings.position = position;
    }

    activate(order:OrderDocument) {
        let zones:Zone[],
            seasons:Season[],
            weeks:Map<string, CapacityWeek> = new Map<string,CapacityWeek>(),
            propagationTimes:SeasonTime[],
            flowerTimes:SeasonTime[];
        this.populatePromise = Promise.all([
            this.referenceService.seasons().then(result => {
                seasons = result;
            }),
            this.referenceService.zones().then(result => {
                zones = result;
            }),
            this.referenceService.propagationTimes().then(result => {
                propagationTimes = result;
            }),
            this.referenceService.flowerTimes().then(result => {
                flowerTimes = result;
            }),
            this.capacityService.getCapacityWeeks().then(result => {
                weeks = result;
            })
        ]).then(() => {
            this.calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes, order);
        });
    }

    attached() {
        this.populatePromise.then(() => {
            $('.calendar', this.element).calendar({
                type: 'date',
                initialDate: this.calculator.order.arrivalDate,
                onChange: this.onDateChange.bind(this)
            }).calendar('set date', this.calculator.order.arrivalDate);
        });
    }

    detached() {
        $('.calendar', this.element).calendar('destroy');
    }

    onDateChange(value:string) {
        this.calculator.setArrivalDate(moment(value).toDate());
    }

    print() {
        alert('Not yet!');
    }

    delete() {
        this.dialogService.open({ viewModel: Prompt, model: `Are you sure you want to delete order ${this.calculator.order._id}`})
            .then((result:DialogResult) => {
                if(result.wasCancelled) return;

                this.orderService.cancel(this.calculator.order._id)
                    .then(() => {
                        this.controller.close(true);
                    });
            })
    }

    cancel() {
        this.controller.close(false);
    }

    save() {
        const order = this.calculator.getOrderDocument();
        this.controller.close(true);
    }

    @computedFrom('calculator.order.arrivalDate')
    get dateDisplay():string {
        let display = 'Choose Date';
        if(this.calculator && this.calculator.order && _.isDate(this.calculator.order.arrivalDate)) {
            display = moment(this.calculator.order.arrivalDate).format('ddd, MMM Do');
        }
        return display;
    }
}

function position(modalContainer:Element, modalOverlay:Element) {
    const $container = $(modalContainer),
        $aiHeader = $container.find('ai-dialog-header'),
        $aiFooter = $container.find('ai-dialog-footer'),
        $aiBody = $container.find('ai-dialog-body'),
        headerHeight = $aiHeader.outerHeight(),
        footerHeight = $aiFooter.outerHeight(),
        bodyHeight = `calc(100% - ${footerHeight + headerHeight}px)`;

    $aiBody.css({ height: bodyHeight });
}
