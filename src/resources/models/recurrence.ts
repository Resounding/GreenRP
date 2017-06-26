import {computedFrom} from 'aurelia-framework';

export interface Recurrence {
    numberOfPeriods:number;
    weekDays:number[];
    numberOfOccurrences:number;
    endTime:Time;
    period:Period;
    endingType:EndingType;
}

export class RecurrenceDocument implements Recurrence {
    private _period:Period = Periods.Day;
    private _endingType:EndingType = EndingTypes.NoEnd;

    numberOfPeriods:number = 1;
    weekDays:number[] = [];

    numberOfOccurrences:number = null;
    endTime:TimeDocument = null;

    constructor(data:Recurrence | {endTime?:any} = {}) {
        Object.assign(this, data);

        if(data.endTime) {
            this.endTime = new TimeDocument(data.endTime);
        }
    }

    @computedFrom('_period')
    get period():Period {
        return this._period;
    }
    set period(value:Period) {
        if(!equals(this._period, value)) {
            this._period = value;

            if(equals(value, Periods.Week)) {
                if(!this.weekDays || !this.weekDays.length) {
                    this.weekDays = [1];
                }
            }            
        }        
    }

    @computedFrom('_endingType')
    get endingType():EndingType {
        return this._endingType;
    }
    set endingType(value:EndingType) {
        if(!equals(this._endingType, value)) {
            this._endingType = value;

            if(equals(value, EndingTypes.EndAfter)) {
                if(!this.numberOfOccurrences) {
                    this.numberOfOccurrences = 1;
                }
            } else {
                if(!this.endTime) {
                    this.endTime = new TimeDocument;
                }
            }
        }
    }

    toJSON():Recurrence {
        const json = {
            numberOfPeriods: this.numberOfPeriods,
            weekDays: null,
            numberOfOccurrences: null,
            endTime: null,
            period: this.period,
            endingType: this.endingType
        };
        if(equals(this.period, Periods.Week)) {
            json.weekDays = this.weekDays;
        }
        if(equals(this.endingType, EndingTypes.EndAfter)) {
            json.numberOfOccurrences = this.numberOfOccurrences;
        } else if(equals(this.endingType, EndingTypes.EndDate)) {
            json.endTime = this.endTime.toJSON();
        }
        return json;
    }
}

export interface Time {
    event:Event;
    weekday:number;
    relativePeriod:Period;
    numberOfRelativePeriods:number;
    relativeTime:RelativeTime;
    anyDay:boolean;
}

export class TimeDocument implements Time {
    private _relativeTime:RelativeTime;
    private _anyDay:boolean = true;

    event:Event = Events.Stick;
    weekday:number;
    relativePeriod:Period = null;
    numberOfRelativePeriods:number = null;

    constructor(data:Time | {} = {}) {
        Object.assign(this, data);
    }

    @computedFrom('_relativeTime')
    get relativeTime():RelativeTime {
        return this._relativeTime;
    }
    set relativeTime(value:RelativeTime) {
        if(!equals(this._relativeTime, value)) {
            this._relativeTime = value;

            if(!equals(value, RelativeTimes.On)) {
                if(!this.relativePeriod) {
                    this.relativePeriod = Periods.Day;
                }
                if(!this.numberOfRelativePeriods) {
                    this.numberOfRelativePeriods = 1;
                }
            }
        }
    }

    @computedFrom('_anyDay')
    get anyDay():boolean {
        return this._anyDay;
    }

    set anyDay(value:boolean) {
        if(this._anyDay !== value) {
            this._anyDay = value;

            if(value === false && !this.weekday) {
                this.weekday = 1;
            }            
        }
    }

    toJSON():Time {
        const json:Time = {
            event: this.event,
            relativeTime: this.relativeTime,
            anyDay: this.anyDay,
            weekday: null,
            relativePeriod: null,
            numberOfRelativePeriods: null            
        };
        if(!equals(this.relativeTime, RelativeTimes.On)) {
            json.numberOfRelativePeriods = this.numberOfRelativePeriods;
            json.relativePeriod = this.relativePeriod;
        }
        if(!this.anyDay) {
            json.weekday = this.weekday;
        }
        return json;
    }
}

export type Period = 'Day' | 'Week';
export class Periods {
    public static Day:Period = 'Day';
    public static Week:Period = 'Week';

    public static equals(a:Period, b:Period):boolean {
        return equals(a, b);
    }
}

export type RelativeTime = 'On' | 'Before' | 'After';
export class RelativeTimes {
    public static On:RelativeTime = 'On';
    public static Before:RelativeTime = 'Before';
    public static After:RelativeTime = 'After';
}

export type Event = 'Stick' | 'Space' | 'Lights-out' | 'Flower';
export class Events {
    public static Stick:Event = 'Stick';
    public static Space:Event = 'Space';
    public static LightsOut:Event = 'Lights-out';
    public static Flower:Event = 'Flower';

    public static equals(a:Event, b:Event):boolean {
        return equals(a, b);
    }
}

export type EndingType = 'NoEnd' | 'EndAfter' | 'EndDate';
export class EndingTypes {
    public static NoEnd:EndingType = 'NoEnd';
    public static EndAfter:EndingType = 'EndAfter';
    public static EndDate:EndingType = 'EndDate';

    public static equals(a:EndingType, b:EndingType):boolean {
        return equals(a, b);
    }
}

function equals(a:string, b:string) {
    if(a == null || b == null) return false;
    return a.toLowerCase() === b.toLowerCase();
}