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
    crops?:string[];
    zones?:Zone[];
    assignedTo?:string;
    recordingType:JournalRecordingType;
    unitOfMeasure?:string;
    journal?:Journal;
}

export interface Journal {
    completedDate?:Date;
    notes:string;
    checklist?:ChecklistItem[];
    measurement?:string|number;
}

export class ActivityDocument implements Activity {
    _id?:string;
    _rev?:string;
    type:string  = ActivityDocument.ActivityDocumentType;
    name:string;
    date:Date = new Date;
    status:ActivityStatus = ActivityStatuses.NotStarted;
    workType:WorkType = null;
    description:string;
    crops?:string[] = [];
    zones?:Zone[] = [];
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

    toJSON() {
        const json:Activity = {
            type: this.type,
            name: this.name,
            date: this.date,
            workType: this.workType,
            status: this.status,
            description: this.description,
            crops: null,
            zones: null,
            assignedTo: this.assignedTo,
            recordingType: this.recordingType,
            unitOfMeasure: this.unitOfMeasure,
        };
        if(Array.isArray(this.crops) && this.crops.length) {
            json.crops = this.crops;
        }
        if(Array.isArray(this.zones) && this.zones.length) {
            json.zones = this.zones;
        }
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
    completedDate?:Date;
    notes:string;    
    checklist?:ChecklistItem[];
    measurement?:string|number;

    constructor(args?:Journal) {
        if(args) {
            _.extend(this, args);

            if(Array.isArray(args.checklist)) {
                this.checklist = args.checklist.reduce((memo, item) => {
                    if(typeof item === 'string') {
                        memo.push(new ChecklistItem(item));
                    } else if(item.value) {
                        memo.push(item);
                    }

                    return memo;
                }, []);
            }
        }
    }

    toJSON():Journal {
        const json:Journal = {
            notes: this.notes
        };

        if(this.measurement != null) {
            json.measurement = this.measurement;
        }
        if(Array.isArray(this.checklist) && this.checklist.length) {
            json.checklist = this.checklist.filter(i => i.value);
        }

        return json;
    }
}

export class ActivityStatuses {
    public static NotStarted:ActivityStatus = 'Not Started';
    public static Incomplete:ActivityStatus = 'Incomplete';
    public static Complete:ActivityStatus = 'Complete';
    public static Reviewed:ActivityStatus = 'Reviewed';

    public static getAll():ActivityStatus[] {
        return [
            ActivityStatuses.NotStarted,
            ActivityStatuses.Incomplete,
            ActivityStatuses.Complete,
            ActivityStatuses.Reviewed
        ];
    }

    public static equals(a:ActivityStatus, b:ActivityStatus):boolean {
        return equals(a, b);
    }
}

export type ActivityStatus = 'Not Started' | 'Incomplete' | 'Complete' | 'Reviewed';

export class WorkTypes {
    public static Labour:WorkType = 'Labour';
    public static Growing:WorkType = 'Growing';

    public static getAll():WorkType[] {
        return [
            WorkTypes.Growing,
            WorkTypes.Labour
        ];
    }

    public static ALL_WORK_TYPES:WorkType = <WorkType>'All';

    public static equals(a:WorkType, b:WorkType):boolean {
        return equals(a, b);
    }
}

export type WorkType = 'Labour' | 'Growing';

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

    public static equals(a:JournalRecordingType, b:JournalRecordingType):boolean {
        return equals(a, b);
    }
}

export class AssignedTo {
    public static UNASSIGNED:string = 'Unassigned';
}

export class ChecklistItem {
    constructor(public value:string = '') { }

    toJSON() {
        return this.value;
    }
}

function equals(a:string, b:string) {
    if(a == null || b == null) return false;
    return a.toLowerCase() === b.toLowerCase();
}