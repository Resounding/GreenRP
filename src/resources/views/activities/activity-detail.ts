import { Prompt } from '../controls/prompt';
import {autoinject} from 'aurelia-framework';
import {DialogController, DialogService} from 'aurelia-dialog';
import {log} from '../../services/log';
import {ActivitiesService} from '../../services/data/activities-service';
import {OrdersService} from '../../services/data/orders-service';
import {ReferenceService} from '../../services/data/reference-service';
import {UsersService, User} from '../../services/data/users-service';
import {ActivityDocument, ActivityStatus, ActivityStatuses, WorkType, WorkTypes} from '../../models/activity';
import {OrderDocument} from '../../models/order';
import {Zone} from '../../models/zone';

@autoinject
export class ActivityDetail {
    errors:string[] = [];
    activity:ActivityDocument;
    orders:string[];
    zones:Zone[];
    workTypes:WorkType[];
    statuses:ActivityStatus[];
    users:User[];
    
    constructor(private controller:DialogController, private service:ActivitiesService,
        private referenceService:ReferenceService, private usersService:UsersService,
        private ordersService:OrdersService, private dialogService:DialogService, private element:Element) {

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
            this.ordersService.getAll()
                .then(orders => {
                    const now = moment().toWeekNumberId(),
                        ordersInHouse = orders.filter(o => {
                            const weeks = Object.keys(o.weeksInHouse),
                                isInHouse = weeks.indexOf(now) !== -1;  

                            return isInHouse;
                        })
                        .map(o => o.orderNumber)
                        .sort();
                    this.orders = ordersInHouse;
                })
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
        $('.dropdown.crop', this.element)
            .dropdown({ onChange: this.onCropChange.bind(this) })
            .dropdown('set selected', this.activity.crop);
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
        this.dialogService.open({ viewModel: Prompt, model: 'Are you sure you want to delete this activity?'})
            .whenClosed(result => {
                if(result.wasCancelled) return;

                this.service.delete(this.activity)
                    .then(result => {
                        if(result.ok) {
                            return this.controller.ok();
                        } else {
                            this.errors = result.errors;
                        }
                    })
                    .catch(err => log.error(err))
            })
            .catch(err => {
                log.error(err);
            })
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
    onCropChange(value:string) {
        this.activity.crop = value;
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