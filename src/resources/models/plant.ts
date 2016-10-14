interface CuttingsPerTable {
    tight: number;
    half?: number;
    full: number
}

export interface Plant {
    name:string;
    abbreviation:string;
    crop:string;
    size:string;
    cuttingsPerPot:number;
    cuttingsPerTable:CuttingsPerTable;
    potsPerCase:number;
    hasLightsOut:boolean;
}

export class PlantDocument implements Plant {
    name:string;
    abbreviation:string;
    crop:string;
    size:string;
    cuttingsPerPot:number;
    cuttingsPerTable:CuttingsPerTable;
    potsPerCase:number;
    hasLightsOut:boolean;

    constructor(args?:Plant) {
        if(args) {
            _.extend(this, args);
        }
    }
}

export class Spacings {
    static Tight:string = 'tight';
    static Half:string = 'half';
    static Full:string = 'full';
}

export type SpacingOptions = 'tight' | 'half' | 'full';
