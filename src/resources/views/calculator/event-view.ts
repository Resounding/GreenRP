import {bindable, autoinject} from 'aurelia-framework';
import {Event, Events} from "../../services/domain/models/calculator-week";
import {OrderCalculator} from "../../services/domain/order-calculator";

@autoinject()
export class EventViewCustomElement {
    @bindable calculator:OrderCalculator;
    @bindable event:Event = null;

    constructor(private element:Element) { }

    attached() {
        $('.calendar', this.element).calendar({
            type: 'date',
            onChange: this.onDateChange.bind(this)
        });
    }

    detached() {
        $('.calendar', this.element).calendar('destroy');
    }

    onDateChange(value:string) {
        let date = moment(value).toDate();
        switch(this.event.name) {
            case Events.LightsOutEventName:
            case Events.SpacingEventName:
                this.calculator.setLightsOutDate(date);
                break;
            case Events.FlowerEventName:
                this.calculator.setFlowerDate(date);
                break;
            case Events.StickEvent:
                this.calculator.setStickDate(date);
            case Events.ShipEventName:
                this.calculator.setArrivalDate(date);
        }
    }
}
