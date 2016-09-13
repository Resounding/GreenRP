import {autoinject} from "aurelia-framework";
import {CapacityService} from "../../services/data/capacity-service";
import {CapacityWeek} from "../../models/capacity-week";

@autoinject()
export class Index {
    weeks:Map<string, CapacityWeek>;

    constructor(capacityService:CapacityService) {
        const all = capacityService.getCapacityWeeks(new Date().getFullYear())
            .then(result => {
                this.weeks = result;
            })
            .catch(error => {
                console.error(error);
            });
    }
}
