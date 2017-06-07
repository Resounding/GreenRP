import {computedFrom} from 'aurelia-framework';
import { Zone } from './zone';

export interface Activity {
    _id?:string;
    _rev?:string;
    type:string;
    name:string;
    date:Date;
    status:ActivityStatus;
    workType:WorkType;
    description:string;
    crop?:string;
    zone?:Zone;
    assignedTo?:string;
    recordingType:JournalRecordingType;
    unitOfMeasure?:string;
    journal?:Journal;
}

export interface Journal {
    notes:string;
    checklist?:string[];
    measurement?:string|number;
}

export class ActivityDocument implements Activity {
    _id?:string;
    _rev?:string;
    type:string  = ActivityDocument.ActivityDocumentType;
    name:string;
    date:Date = new Date;
    status:ActivityStatus = ActivityStatuses.NotStarted;
    workType:WorkType = WorkTypes.Other;
    description:string;
    crop?:string = null;
    zone?:Zone = null;
    assignedTo?:string = null;
    recordingType:JournalRecordingType = JournalRecordingTypes.CheckList;
    unitOfMeasure?:string = null;
    journal?:JournalDocument = null;

    constructor(args?:Activity) {
        if(args) {
            _.extend(this, args);

            if(args.journal) {
                this.journal = new JournalDocument(args.journal);
            }
        }

    }

    @computedFrom('_id')
    get isNew():boolean {
        return !this._id;
    }

    @computedFrom('date')
    get dateDisplay():string {
        if(!this.date) return 'Not Set';

        return moment(this.date).format('ddd, MMM D, YYYY');
    }

    @computedFrom('assignedTo')
    get assignedToDisplay():string {
        return this.assignedTo || 'Unassigned';
    }

    toJSON() {
        const json:Activity = {
            type: this.type,
            name: this.name,
            date: this.date,
            workType: this.workType,
            status: this.status,
            description: this.description,
            crop:this.crop,
            zone: this.zone,
            assignedTo: this.assignedTo,
            recordingType: this.recordingType,
            unitOfMeasure: this.unitOfMeasure,
        };
        if(this.journal) {
            json.journal = this.journal.toJSON();
        }
        if(!this.isNew) {
            json._id = this._id;
            json._rev = this._rev;
        }
        return json;
    }

    public static ActivityDocumentType:string = 'activity';
}

export class JournalDocument implements Journal {
    notes:string;    
    checklist?:string[];
    measurement?:string|number;

    constructor(args?:Journal) {
        if(args) {
            _.extend(this, args);
        }
    }

    toJSON():Journal {
        return {
            notes: this.notes,
            checklist: this.checklist,
            measurement: this.measurement
        };
    }
}

export class ActivityStatuses {
    public static NotStarted:ActivityStatus = 'Not Started';
    public static Incomplete:ActivityStatus = 'Incomplete';
    public static Snoozed:ActivityStatus = 'Snoozed';
    public static Complete:ActivityStatus = 'Complete';
    public static Reviewed:ActivityStatus = 'Reviewed';

    public static getAll():ActivityStatus[] {
        return [
            ActivityStatuses.NotStarted,
            ActivityStatuses.Incomplete,
            ActivityStatuses.Snoozed,
            ActivityStatuses.Complete,
            ActivityStatuses.Reviewed
        ];
    }
}

export type ActivityStatus = 'Not Started' | 'Incomplete' | 'Snoozed' | 'Complete' | 'Reviewed';

export class WorkTypes {
    public static Labour:WorkType = 'Labour';
    public static Growing:WorkType = 'Growing';
    public static Other:WorkType = 'Other';

    public static getAll():WorkType[] {
        return [
            WorkTypes.Labour,
            WorkTypes.Growing,
            WorkTypes.Other
        ];
    }
}

export type WorkType = 'Labour' | 'Growing' | 'Other';

export type JournalRecordingType = 'Measurement' | 'Checklist';

export class JournalRecordingTypes {
    public static CheckList:JournalRecordingType = 'Checklist';
    public static Measurement:JournalRecordingType = 'Measurement';

    public static getAll():JournalRecordingType[] {
        return [
            JournalRecordingTypes.CheckList,
            JournalRecordingTypes.Measurement
        ]
    }
}