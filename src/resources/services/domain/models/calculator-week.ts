import {Week} from '../../../models/week';

export interface Event {
    name:string;
    date:Date;
}

export interface CalculatorWeek {
    week:Week;
    events: Event[];
    tables: number;
}

export class Events {
    static StickEvent:string = 'Stick';
    static LightsOutEventName:string = 'Lights Out';
    static SpacingEventName:string = 'Space';
    static FlowerEventName:string = 'Flower';
    static ShipEventName:string = 'Ship Date';
}
