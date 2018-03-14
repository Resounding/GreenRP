import {autoinject} from 'aurelia-framework';
import {DialogController, DialogService} from 'aurelia-dialog';
import {ZoneDialog} from './zone-dialog';
import {Zone} from '../../models/zone';
import {ZoneAssignment} from '../../models/zone-assignment';
import {Notifications} from '../../services/notifications';
import {ReferenceService} from '../../services/data/reference-service';

@autoinject
export class ZoneList {
    zones:Zone[];
    assignments:ZoneAssignment;

    constructor(private referenceService:ReferenceService, private dialogService:DialogService) { }

    async activate() {
        await this.loadZones();        
    }

    async loadZones() {
        try {
            
            this.assignments = await this.referenceService.getZoneAssignments();
            this.zones = await this.referenceService.zones();

        } catch(e) {
            Notifications.error(e);
        }
    }

    detail(zone:Zone) {
        try {

            this.dialogService.open({
                viewModel: ZoneDialog,
                model: zone
            }).whenClosed(async result => {
                if(result.wasCancelled) return;
    
                await this.loadZones();
            });

        } catch(e) {
            Notifications.error(e);
        }
    }

    growerFor(zone:Zone):string {
        return this.assignments.growers[zone.name];
    }

    labourFor(zone:Zone):string {
        return this.assignments.labour[zone.name];
    }
}