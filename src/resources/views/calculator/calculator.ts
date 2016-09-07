import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {log} from '../../services/log';
import {Reference} from '../../services/data/reference';
import {OrderCalculator} from '../../services/domain/order-calculator';
import {OrdersService} from "../../services/data/orders-service";
import {Plant} from '../../models/plant';
import {Customer} from '../../models/customer';
import {Season} from '../../models/season';
import {Zone} from "../../models/zone";
import {Week} from "../../models/week";
import {SeasonTime} from "../../models/season-time";

@autoinject()
export class Calculator {
    customers:Customer[];
    plants:Plant[];
    season:Season;
    calculator:OrderCalculator;
    partialSpace:boolean = false;

    constructor(private ordersService:OrdersService, private controller:DialogController, private element:Element, reference:Reference) {
        controller.settings.lock = true;
        controller.settings.position = position;

        reference.customers().then(result => {
            this.customers = result;
        });
        reference.plants().then(result => {
            this.plants = result;
        });

        let zones:Zone[],
            seasons:Season[],
            weeks:Week[],
            propagationTimes:SeasonTime[],
            flowerTimes:SeasonTime[];
        Promise.all([
            reference.seasons().then(result => {
                seasons = result;
            }),
            reference.zones().then(result => {
                zones = result;
            }),
            reference.weeks().then(result => {
                weeks = result;
            }),
            reference.propagationTimes().then(result => {
                propagationTimes = result;
            }),
            reference.flowerTimes().then(result => {
                flowerTimes = result;
            })
        ]).then(() => {
            this.calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);
        });


    }

    attached() {
        $('#customer', this.element).dropdown({
            onChange: (value:string) => {
                this.calculator.order.customer = _.find(this.customers, c => c.name === value);
            }
        });
        $('#plant', this.element).dropdown({
            onChange: this.onPlantChange.bind(this)
        });
        $('.calendar', this.element).calendar({
            type: 'date',
            onChange: this.onDateChange.bind(this)
        });
    }

    detached() {
        $('#customer', this.element).dropdown('destroy');
        $('.calendar', this.element).calendar('destroy');
    }

    get dateDisplay():string {
        let display = 'Choose Date';
        if(_.isDate(this.calculator.order.arrivalDate)) {
            display = moment(this.calculator.order.arrivalDate).format('ddd, MMM Do');
        }
        return display;
    }

    onPlantChange(value:string) {
        this.calculator.setPlant(_.find(this.plants, p => p.name === value));
        log.debug(this.season);
    }
    onDateChange(value:string) {
        this.calculator.setArrivalDate(moment(value).toDate());
        log.debug(this.season);
    }

    createOrder(zone:Zone) {
        this.calculator.order.zone = zone;
        this.ordersService.create(this.calculator.order)
            .then(result => {
                this.controller.close(true, result);
            });
    }
}

function position(modalContainer:Element, modalOverlay:Element) {
    const $container = $(modalContainer),
        $aiFooter = $container.find('ai-dialog-footer'),
        $aiBody = $container.find('ai-dialog-body'),
        footerHeight = $aiFooter.outerHeight(),
        bodyHeight = `calc(100% - ${footerHeight}px)`;

    $aiBody.css({ height: bodyHeight });
}
