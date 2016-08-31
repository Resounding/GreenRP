import {PropagationTime} from '../../models/propagation-time';
import {Season} from "../../models/season";

export class PropagationTimeSelector {
    constructor(public propagationTimes:PropagationTime[]) { }

    get(season:Season, plant:string):PropagationTime {
        return _.find(this.propagationTimes, pt => {
            return pt.year === season.year && pt.plant === plant;
        });
    }
}
