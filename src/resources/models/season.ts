interface SeasonCropWeeks {
    Mums: number;
    Kalanchoe: number;
    Cyclamen: number;
    Gerbera: number;
}

export interface Season {
    name: string;
    year: number;
    week: number | SeasonCropWeeks;
}

export class SeasonDocument implements Season {
    name: string;
    year: number;
    week: number | SeasonCropWeeks;

    constructor(args?:Season) {
        if(args) {
            _.extend(this, args);
        }
    }
}
