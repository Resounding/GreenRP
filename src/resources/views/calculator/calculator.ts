import {autoinject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {Reference, Customer, Plant} from '../../services/data/reference';
import {OrderDocument} from '../../models/order'
import {OrderCalculator} from "../../models/order-calculator";

@autoinject()
export class Calculator {
    customers:Customer[];
    plants:Plant[];
    order:OrderDocument;
    calculator:OrderCalculator;
    partialSpace:boolean = false;

    constructor(private controller:DialogController, private element:Element, reference:Reference) {
        controller.settings.lock = true;
        controller.settings.position = position;

        this.order = new OrderDocument();

        reference.customers().then(result => {
            this.customers = result;
        });
        reference.plants().then(result => {
            this.plants = result;
        });
        reference.zones().then(result => {
            this.calculator = new OrderCalculator(result);
        })
    }

    attached() {
        $('#customer', this.element).dropdown({
            onChange: (value:string) => {
                this.order.customer = _.find(this.customers, c => c.name === value);
            }
        });
        $('#plant', this.element).dropdown({
            onChange: (value:string) => {
                this.order.plant = _.find(this.plants, p => p.name === value);
            }
        });
        $('.calendar', this.element).calendar({
            type: 'date',
            onChange: date => {
                this.order.arrivalDate = moment(date).toDate();
            }
        });
    }

    detached() {
        $('#customer', this.element).dropdown('destroy');
        $('.calendar', this.element).calendar('destroy');
    }

    get dateDisplay():string {
        let display = 'Choose Date';
        if(_.isDate(this.order.arrivalDate)) {
            display = moment(this.order.arrivalDate).format('ddd, MMM Do');
        }
        return display;
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
