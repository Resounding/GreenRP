import { Prompt } from '../controls/prompt';
import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogController, DialogService} from 'aurelia-dialog';
import {log} from '../../services/log';
import {ActivitiesService, ActivitySaveResult} from '../../services/data/activities-service';
import {OrdersService} from '../../services/data/orders-service';
import {ReferenceService} from '../../services/data/reference-service';
import {UsersService, User} from '../../services/data/users-service';
import {
    ActivityDocument,
    ActivityStatus,
    ActivityStatuses,
    JournalDocument,
    JournalRecordingType,
    JournalRecordingTypes,
    WorkType,
    WorkTypes
} from '../../models/activity';
import {OrderDocument} from '../../models/order';
import {Zone} from '../../models/zone';

@autoinject
export class ActivityDetail {
    errors:string[] = [];
    activity:ActivityDocument;
    orders:string[];
    zones:Zone[];
    workTypes:WorkType[];
    users:User[];
    journalShowing:boolean = false;
    journalRecordingTypes:JournalRecordingType[];
    
    constructor(private controller:DialogController, private service:ActivitiesService,
        private referenceService:ReferenceService, private usersService:UsersService,
        private ordersService:OrdersService, private dialogService:DialogService, private element:Element) {

        controller.settings.lock = true;
        controller.settings.position = position;
        
    }

    activate(activity:ActivityDocument) {
        this.activity = activity || new ActivityDocument;

        this.workTypes = WorkTypes.getAll();
        this.journalRecordingTypes = JournalRecordingTypes.getAll();

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
        $('.dropdown.recording-type', this.element)
            .dropdown({ onChange: this.onRecordingTypeChange.bind(this) })
            .dropdown('set selected', this.activity.recordingType);
        $('.calendar', this.element).calendar({
            type: 'date',
            onChange: this.onDateChange.bind(this)
        });
        $('ux-dialog-body.journal', this.element).transition('hide');
    }

    detached() {
        $('.dropdown', this.element).dropdown('destroy');
        $('.calendar', this.element).calendar('destroy');
        $('ux-dialog-body', this.element).transition('destroy');
    }

    save() {
        this.saveActivity()
            .then(result => {
                if(result.ok) {
                    return this.controller.ok(result.activity);
                } else {
                    this.errors = result.errors;
                }
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

    addJournal() {        
        this.saveActivity()
            .then(result => {
                if(result.ok) {
                    if(this.activity.status !== ActivityStatuses.Incomplete) {
                        this.completed = true;
                    }
                    if(!this.activity.journal) {
                        this.activity.journal = new JournalDocument;
                    }
                    if(this.activity.recordingType.toLowerCase() === JournalRecordingTypes.CheckList.toLowerCase()) {
                        if(!this.activity.journal.checklist) {
                            this.activity.journal.checklist = [];
                        }
                        if(!this.activity.journal.checklist.length) {
                            this.activity.journal.checklist.push('');
                        }
                    }
                    this.showJournal();
                }
            });
    }

    editActivity() {
        this.saveActivity()
            .then(result => {
                if(result.ok) {                    
                    this.showActivity();
                }
            });
    }

    showJournal() {
        const el = this.element;
        $('ux-dialog-body.activity', el).transition({
            animation: 'fade',
            onHide: () => {
                $('ux-dialog-body.journal').transition('fade');
                this.journalShowing = true;                
            }
        });
    }

    showActivity() {
        const el = this.element;
        $('ux-dialog-body.journal', el).transition({
            animation: 'fade',
            onHide: () => {
                $('ux-dialog-body.activity').transition('fade');
                this.journalShowing = false;
            }
        });
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
    onRecordingTypeChange(value:JournalRecordingType) {
        this.activity.recordingType = value;
        if(value.toLowerCase() === JournalRecordingTypes.CheckList.toLowerCase()) {
            this.activity.unitOfMeasure = null;
        }
    }
    onCropChange(value:string) {
        this.activity.crop = value;
    }
    onZoneChange(value:string) {
        const zone = _.find(this.zones, z => z.name === value) || null;
        this.activity.zone = zone;
    }

    addToChecklist() {
        if(!this.activity.journal.checklist) {
            this.activity.journal.checklist = [];
        }
        this.activity.journal.checklist.push('');
    }
    removeFromChecklist(index:number) {
        this.activity.journal.checklist.splice(index, 1);
    }

    @computedFrom('activity.status')
    get completed():boolean {
        return this.activity.status === ActivityStatuses.Complete;
    }
    set completed(value:boolean) {
        this.activity.status = value ? ActivityStatuses.Complete : ActivityStatuses.Incomplete;
    }

    @computedFrom('activity.recordingType')
    get isMeasurement():boolean {
        return this.activity.recordingType.toLowerCase() === JournalRecordingTypes.Measurement.toLowerCase();
    }

    private saveActivity():Promise<ActivitySaveResult> {
        this.errors = [];
        return new Promise((resolve, reject) => {
            return this.service.save(this.activity)
                .then(result => {
                    if(result.ok) {
                        if(this.activity.isNew) {
                            this.activity._id = result.activity._id;
                        }
                        this.activity._rev = result.activity._rev;
                    }

                    resolve(result);
                })
                .catch(err => {
                    log.error(err);
                    alert(err);
                });
        });
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