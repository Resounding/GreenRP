interface PropagationTimeSeasons {
    spring: number;
    winter: number;
    fall: number;
    summer: number;
}

export interface PropagationTime {
    plant: string;
    year: number;
    propagationTimes: PropagationTimeSeasons;
}

export class PropagationTimeDocument {
    plant: string;
    year: number;
    propagationTimes: PropagationTimeSeasons;

    constructor(args?:PropagationTime) {
        if (args) {
            _.extend(this, args);
        }
    }
}
