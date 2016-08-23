export interface Zone {
    name:string;
    tables:number;
    autoSpace:boolean;
}

export class ZoneDocument {
    name:string;
    tables:number;
    autoSpace:boolean;

    constructor(args?:Zone) {
        if(args) {
            _.extend(this, args);
        }
    }
}
