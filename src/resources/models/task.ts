import {computedFrom} from 'aurelia-framework';
import {ActivityStatus, JournalRecordingType, JournalRecordingTypes, WorkType, WorkTypes} from './activity';
import {Recurrence, RecurrenceDocument, Time, TimeDocument} from './recurrence';
import { TaskCategory, TaskCategoryDoc } from './task-category';

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
    groupActivitiesTogether:boolean | undefined;
    enabled:boolean;
    category:TaskCategory | undefined | null;
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
    recurrence:RecurrenceDocument = null;
    zones?:string[] | undefined = undefined;
    groupActivitiesTogether:boolean | undefined = false;
    enabled:boolean;
    category:TaskCategory | undefined | null;

    constructor(data:Task | {startTime?:Time} = {}, public index:number) {
        Object.assign(this, data);

        if(data.startTime) {
            this.startTime = new TimeDocument(data.startTime);
        }

        if(this.recurring && this.recurrence) {
            this.recurrence = new RecurrenceDocument(this.recurrence);
        }

        if(this.enabled !== false) {
            this.enabled = true;
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
            zones: this.zones,
            groupActivitiesTogether: !!this.groupActivitiesTogether,
            enabled: !!this.enabled,
            category: null
        };
        if(this.category) {
            json.category = new TaskCategoryDoc(this.category).toJSON();
        }
        if(this.recurring) {
            json.recurrence = new RecurrenceDocument(this.recurrence).toJSON();
        }
        return json;
    }
}