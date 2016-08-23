export interface Plant {
    name:string;
    size:string;
    cuttingsPerPot:number;
    potsPerCase:number;
    cuttingsPerTable:number;
    weeksFromLightsOutToFlower:number;
}

export class PlantDocument implements Plant {
    name:string;
    size:string;
    cuttingsPerPot:number;
    potsPerCase:number;
    cuttingsPerTable:number;
    weeksFromLightsOutToFlower:number;

    constructor(args?:Plant) {
        if(args) {
            _.extend(this, args);
        }
    }
}
