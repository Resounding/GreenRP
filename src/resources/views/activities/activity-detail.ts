import {autoinject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {log} from '../../services/log';
import {ActivitiesService} from '../../services/data/activities-service';
import {ReferenceService} from '../../services/data/reference-service';
import {UsersService, User} from '../../services/data/users-service';
import {ActivityDocument, ActivityStatus, ActivityStatuses, WorkType, WorkTypes} from '../../models/activity';
import {Plant} from "../../models/plant";
import {Zone} from '../../models/zone';

@autoinject
export class ActivityDetail {
    errors:string[] = [];
    activity:ActivityDocument;
    plants:Plant[];
    zones:Zone[];
    workTypes:WorkType[];
    statuses:ActivityStatus[];
    users:User[]
    
    constructor(private controller:DialogController, private service:ActivitiesService,
        private referenceService:ReferenceService, private usersService:UsersService, private element:Element) {

        controller.settings.lock = true;
        controller.settings.position = position;
        
    }

    activate(activity:ActivityDocument) {
        this.activity = activity || new ActivityDocument;

        this.workTypes = WorkTypes.getAll();
        this.statuses = ActivityStatuses.getAll();

        return Promise.all([
            this.usersService.getAll()
                .then(result => this.users = result),
            this.referenceService.zones()
                .then(result => this.zones = result),
            this.referenceService.plants()
                .then(result => this.plants = result)
        ]);
    }

    attached() {
        $('.dropdown.status', this.element)
            .dropdown({ onChange: this.onStatusChange.bind(this) })
            .dropdown('set selected', this.activity.status);
        $('.dropdown.assignedTo', this.element)
            .dropdown({ onChange: this.onAssignedToChange.bind(this) })
            .dropdown('set selected', this.activity.assignedTo);
        $('.dropdown.workType', this.element)
            .dropdown({ onChange: this.onWorkTypeChange.bind(this) })
            .dropdown('set selected', this.activity.workType);
        const $plant = $('.dropdown.plant', this.element)
            .dropdown({ onChange: this.onPlantChange.bind(this) });
        if(this.activity.plant) {
            $plant.dropdown('set selected', this.activity.plant.id);
        }
        const $zone = $('.dropdown.zone', this.element)
            .dropdown({ onChange: this.onZoneChange.bind(this) });
        if(this.activity.zone) {
            $zone.dropdown('set selected', this.activity.zone.name);
        }
        $('.calendar', this.element).calendar({
            type: 'date',
            onChange: this.onDateChange.bind(this)
        });
    }

    detached() {
        $('.dropdown', this.element).dropdown('destroy');
        $('.calendar', this.element).calendar('destroy');
    }

    save() {
        this.errors = [];
        this.service.save(this.activity)
            .then(result => {
                if(result.ok) {
                    return this.controller.ok(result.activity);
                } else {
                    this.errors = result.errors;
                }
            })
            .catch(err => {
                log.error(err);
                alert(err);
            });
    }

    delete() {

    }

    onDateChange(value:string) {
        const date = moment(value).toDate();
        this.activity.date = date;
    }
    onStatusChange(value:ActivityStatus) {
        this.activity.status = value;
    }
    onAssignedToChange(value:string) {
        this.activity.assignedTo = value;
    }
    onWorkTypeChange(value:WorkType) {
        this.activity.workType = value;
    }
    onPlantChange(value:string) {
        const id = numeral(value).value(),
            plant = _.find(this.plants, p => p.id === id) || null;
        this.activity.plant = plant;
    }
    onZoneChange(value:string) {
        const zone = _.find(this.zones, z => z.name === value) || null;
        this.activity.zone = zone;
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