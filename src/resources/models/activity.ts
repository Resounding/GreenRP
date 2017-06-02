import { Zone } from './zone';
import {Plant} from './plant';

export interface Activity {
    _id?:string;
    _rev?:string;
    type:string;
    name:string;
    date:Date;
    status:ActivityStatus;
    workType:WorkType;
    description:string;
    plant?:Plant;
    zone?:Zone;
    assignedTo?:string;
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
    plant?:Plant = null;
    zone?:Zone = null;
    assignedTo?:string = null;

    constructor(args?:Activity) {
        if(args) {
            _.extend(this, args);
        }

    }

    get isNew():boolean {
        return !this._id;
    }

    get dateDisplay():string {
        if(!this.date) return 'Not Set';

        return moment(this.date).format('ddd, MMM D, YYYY');
    }
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
            plant: this.plant,
            zone: this.zone,
            assignedTo: this.assignedTo
        };
        if(!this.isNew) {
            json._id = this._id;
            json._rev = this._rev;
        }
        return json;
    }

    public static ActivityDocumentType:string = 'activity';
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