import {computedFrom} from 'aurelia-framework';
import {ActivityStatus, JournalRecordingType, WorkType} from './activity';
import {Recurrence, RecurrenceDocument, Time, TimeDocument} from './recurrence';

export interface Task {
    _id?:string;
    _rev?:string;
    type:string;
    name:string;
    startTime:Time;
    status:ActivityStatus;
    workType:WorkType;
    description:string;
    recordingType:JournalRecordingType;
    unitOfMeasure?:string;
    recurring:boolean;
    recurrence:Recurrence;
}

export class TaskDocument implements Task {
    _id?:string;
    _rev?:string;
    type:string;
    name:string;
    startTime:TimeDocument = new TimeDocument;
    status:ActivityStatus;
    workType:WorkType;
    description:string;
    recordingType:JournalRecordingType;
    unitOfMeasure?:string;
    _recurring:boolean = false;
    recurrence:Recurrence = null;

    constructor(data:Task | {startTime?:Time} = {}) {
        Object.assign(this, data);

        if(data.startTime) {
            this.startTime = new TimeDocument(data.startTime);
        }

        if(this.recurring && this.recurrence) {
            this.recurrence = new RecurrenceDocument(this.recurrence);
        }
    }

    @computedFrom('_id')
    get isNew():boolean {
        return !!this._id;
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
            _id: null,
            _rev: null,
            type: this.type,
            name: this.name,
            startTime: this.startTime.toJSON(),
            status: this.status,
            workType: this.workType,
            description: this.description,
            recordingType: this.recordingType,
            unitOfMeasure: this.unitOfMeasure,
            recurring: this.recurring,
            recurrence: null
        };
        if(this.recurring) {
            json.recurrence = this.recurrence;
        }
        if(!this.isNew) {
            json._id = this._id;
            json._rev = this._rev;
        }
        return json;
    }
}