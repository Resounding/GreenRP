import {computedFrom} from 'aurelia-framework';
import {TaskCategory, TaskCategoryDoc} from './task-category';
import {Zone} from './zone';

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
    recipeId?:string;
    assignedTo?:string;
    recordingType:JournalRecordingType;
    unitOfMeasure?:string;
    journal?:Journal;
    changed:boolean | undefined;
    groupActivitiesTogether:boolean | undefined;
    category:TaskCategory | null;
}

export interface Journal {
    completedDate?:Date;
    notes:string;
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
    recipeId?:string = null;
    assignedTo?:string = null;
    recordingType:JournalRecordingType = JournalRecordingTypes.CheckList;
    unitOfMeasure?:string = null;
    journal?:JournalDocument = null;
    changed:boolean = false;
    groupActivitiesTogether:boolean | undefined;
    category:TaskCategory | null;

    constructor(args?:Activity) {
        if(args) {
            _.extend(this, args);

            if(this.date) {
                const date = moment(this.date);
                if(date.isValid()) {
                    this.date = date.toDate();
                }
            }

            if(args.journal) {
                this.journal = new JournalDocument(args.journal);
            }

            if(args.category) {
                this.category = new TaskCategoryDoc(args.category);
            }
        }

    }

    @computedFrom('_id')
    get isNew():boolean {
        return !this._id;
    }

    @computedFrom('status')
    get done():boolean {
        return ActivityStatuses.equals(this.status, ActivityStatuses.Complete) || ActivityStatuses.equals(this.status, ActivityStatuses.Incomplete);
    }

    @computedFrom('date')
    get weekId():string {
        return moment(this.date).toWeekNumberId();
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
            recipeId: this.recipeId,
            assignedTo: this.assignedTo,
            recordingType: this.recordingType,
            unitOfMeasure: this.unitOfMeasure,
            changed: this.changed,
            groupActivitiesTogether: this.groupActivitiesTogether,
            category: null
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
        if(this.category) {
            json.category = new TaskCategoryDoc(this.category).toJSON()
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
    measurement?:string|number;

    constructor(args?:Journal) {
        if(args) {
            _.extend(this, args);
        }
    }

    toJSON():Journal {
        const json:Journal = {            
            notes: this.notes
        };

        if(this.completedDate && Object.prototype.toString.call(this.completedDate) === '[object Date]') {
            json.completedDate = this.completedDate;
        }

        if(this.measurement != null) {
            json.measurement = this.measurement;
        }

        return json;
    }
}

export class ActivityStatuses {
    public static NotStarted:ActivityStatus = 'Not Started';
    public static InProgress:ActivityStatus = 'In Progress';
    public static Incomplete:ActivityStatus = 'Incomplete';
    public static Complete:ActivityStatus = 'Complete';

    public static getAll():ActivityStatus[] {
        return [
            ActivityStatuses.NotStarted,
            ActivityStatuses.InProgress,
            ActivityStatuses.Incomplete,
            ActivityStatuses.Complete            
        ];
    }

    public static equals(a:ActivityStatus, b:ActivityStatus):boolean {
        return equals(a, b);
    }
}

export type ActivityStatus = 'Not Started' | 'In Progress' | 'Incomplete' | 'Complete';

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

export function equals(a:string, b:string) {
    if(a == null || b == null) return false;
    return a.toLowerCase() === b.toLowerCase();
}