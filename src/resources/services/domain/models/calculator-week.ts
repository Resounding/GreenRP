import {WeekDocument} from '../../../models/week';

export interface Event {
    name:string;
    date:Date;
}

export interface CalculatorWeek {
    week:WeekDocument;
    events: Event[];
}

export class Events {
    static StickEvent:string = 'Stick';
    static LightsOutEventName:string = 'Lights Out';
    static FlowerEventName:string = 'Flower';
    static ShipEventName:string = 'Ship Date';
}
