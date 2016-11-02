import {bindable, autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {BindingSignaler} from 'aurelia-templating-resources';
import {OrderCalculator} from '../../services/domain/order-calculator';
import {CalculatorZone} from '../../services/domain/models/calculator-zone';
import {Calculator} from './calculator';

@autoinject
export class OrderTable {
    private repeaterResetSubscription:Subscription;
    @bindable calculator:OrderCalculator;

    constructor(private events:EventAggregator, private signaler:BindingSignaler) { }

    attached() {
        this.repeaterResetSubscription = this.events.subscribe(Calculator.RepeaterResetEvent, this.onRepeaterReset.bind(this));
    }

    detached() {
        this.repeaterResetSubscription.dispose();
    }

    onRepeaterReset(calculator:OrderCalculator) {
        if(this.calculator && this.calculator.order.arrivalDate) {
            window.setTimeout(() => {
                this.calculator.setArrivalDate(this.calculator.order.arrivalDate)
            }, 50);
        }
    }

    select(zone:CalculatorZone) {
        const z = _.clone(zone);
        z.weeks = void 0;
        z.__metadata__ = void 0;

        this.calculator.setZone(z);
    }
}
