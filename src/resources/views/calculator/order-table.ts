import {bindable} from 'aurelia-framework';
import {OrderCalculator} from '../../services/domain/order-calculator';

export class OrderTable {
    @bindable calculator:OrderCalculator;
}