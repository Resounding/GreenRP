import {computedFrom} from 'aurelia-framework';
import {ActivityStatus, JournalRecordingType, JournalRecordingTypes, WorkType, WorkTypes} from './activity';
import {Recurrence, RecurrenceDocument, Time, TimeDocument} from './recurrence';

export interface Task {
    type:string;
    name:string;
    startTime:Time;
    workType:WorkType;
    description:string;
    recordingType:JournalRecordingType;
    unitOfMeasure?:string;
    recurring:boolean;
    recurrence:Recurrence;
    zones?:string[] | undefined;
}

export class TaskDocument implements Task {
    type:string;
    name:string;
    startTime:TimeDocument = new TimeDocument;
    workType:WorkType = WorkTypes.Growing;
    description:string = '';
    recordingType:JournalRecordingType = JournalRecordingTypes.CheckList;
    unitOfMeasure?:string = null;
    _recurring:boolean = false;
    recurrence:Recurrence = null;
    zones?:string[] | undefined = undefined;

    constructor(data:Task | {startTime?:Time} = {}, public index:number) {
        Object.assign(this, data);

        if(data.startTime) {
            this.startTime = new TimeDocument(data.startTime);
        }

        if(this.recurring && this.recurrence) {
            this.recurrence = new RecurrenceDocument(this.recurrence);
        }
    }

    @computedFrom('index')
    get isNew():boolean {
        return this.index === -1;
    }

    @computedFrom('_recurring')
    get recurring():boolean {
        return this._recurring;
    }

    set recurring(value:boolean) {
        if(this._recurring !== value) {
            this._recurring = value;
            
            if(value && !this.recurrence) {
                this.recurrence = new RecurrenceDocument;
            }
        }
    }

    toJSON():Task {
        const json:Task = {
            type: this.type,
            name: this.name,
            startTime: this.startTime.toJSON(),
            workType: this.workType,
            description: this.description,
            recordingType: this.recordingType,
            unitOfMeasure: this.unitOfMeasure,
            recurring: this.recurring,
            recurrence: null,
            zones: this.zones
        };
        if(this.recurring) {
            json.recurrence = this.recurrence;
        }
        return json;
    }
}