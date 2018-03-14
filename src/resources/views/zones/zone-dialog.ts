import {autoinject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {Notifications} from '../../services/notifications';
import {ReferenceService} from '../../services/data/reference-service';
import {UsersService, User} from '../../services/data/users-service';
import {Zone} from '../../models/zone';

@autoinject
export class ZoneDialog {
    el:Element;
    private zone:Zone;
    users:User[];
    grower:string;
    labour:string;

    constructor(private referenceService:ReferenceService, private controller:DialogController, private usersService:UsersService) {
        controller.settings.lock = true;
        controller.settings.position = position;
    }

    async activate(zone:Zone) {
        this.zone = _.clone(zone);
        this.users = await this.usersService.getAll();

        const assignment = await this.referenceService.getZoneAssignments();
        this.grower = assignment.growers[this.zone.name];
        this.labour = assignment.labour[this.zone.name];
    }

    attached() {
        $('.ui.checkbox', this.el).checkbox();
    }

    detached() {
        $('.ui.checkbox', this.el).checkbox('destroy');
    }

    cancel() {
        this.controller.cancel();
    }

    async save() {
        try {
        
            await this.referenceService.saveZone(this.zone, this.grower, this.labour);
            this.controller.close(true, this.zone);

        } catch(e) {
            Notifications.error(e);
        }
    }
}

function position(modalContainer:Element, modalOverlay:Element) {
    const $container = $(modalContainer),
        $aiHeader = $container.find('ux-dialog-header'),
        $aiFooter = $container.find('ux-dialog-footer'),
        $aiBody = $container.find('ux-dialog-body'),
        headerHeight = $aiHeader.outerHeight(),
        footerHeight = $aiFooter.outerHeight(),
        bodyHeight = `calc(100% - ${footerHeight + headerHeight}px)`;

    $aiBody.css({ height: bodyHeight });
}