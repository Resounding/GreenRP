import {Zone} from '../../models/zone';
import {autoinject} from "aurelia-framework";
import {ActivitiesService, ActivitiesByCropItem} from '../../services/data/activities-service';

@autoinject
export class ActivitiesByCrop {
    crops:ActivitiesByCropItem[]; 

    constructor(private service:ActivitiesService) { }

    async activate() {
        this.crops = await this.service.byCrop();
    }

    getZoneNames(zones:Zone[]) {
        return zones.map(z => z.name).join(', ');
    }
}