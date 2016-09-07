interface CuttingsPerTable {
    tight: number;
    half?: number;
    full: number
}

export interface Plant {
    name:string;
    crop:string;
    size:string;
    cuttingsPerPot:number;
    cuttingsPerTable:CuttingsPerTable;
    hasLightsOut:boolean;
}

export class PlantDocument implements Plant {
    name:string;
    crop:string;
    size:string;
    cuttingsPerPot:number;
    cuttingsPerTable:CuttingsPerTable;
    hasLightsOut:boolean;

    constructor(args?:Plant) {
        if(args) {
            _.extend(this, args);
        }
    }
}

export class Crops {
    static Mums:string = 'Mums';
    static Kalanchoe:string = 'Kalanchoe';
    static Cyclamen:string = 'Cyclamen';
    static Gerbera:string = 'Gerbera';
}

export class Spacings {
    static Tight:string = 'tight';
    static Half:string = 'half';
    static Full:string = 'full';
}

export type SpacingOptions = 'tight' | 'half' | 'full';
