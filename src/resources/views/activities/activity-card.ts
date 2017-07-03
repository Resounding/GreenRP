import {autoinject, computedFrom, bindable, containerless} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {CompleteDialog} from './complete-dialog';
import {IncompleteDialog} from './incomplete-dialog';
import {Authentication, Roles} from '../../services/authentication';
import {Notifications} from '../../services/notifications';
import {ActivitiesService} from '../../services/data/activities-service';
import {
    ActivityDocument,
    ActivityStatus,
    ActivityStatuses,
    AssignedTo,
    JournalDocument,
    JournalRecordingTypes,
    WorkTypes
} from '../../models/activity';

const WITH_COMMENT:ActivityStatus = <ActivityStatus>'With Comment';

@containerless
@autoinject
export class ActivityCard {    
    @bindable activity:ActivityDocument;
    @bindable users:string[];
    statuses:StatusItem[];
    el:Element;

    constructor(private service:ActivitiesService, private auth:Authentication,
        private dialogService:DialogService) { }

    attached() {
        if(!this.activity.done || this.auth.isInRole(Roles.ProductionManager)) {

            this.statuses = [
                { status: ActivityStatuses.NotStarted, text: 'Not Started' },
                { status: ActivityStatuses.InProgress, text: 'In Progress' },
                { status: ActivityStatuses.Incomplete, text: 'Incomplete' },
                { status: ActivityStatuses.Complete, text: 'Complete' },
                { status: WITH_COMMENT, text: 'Complete (with comment)' }
            ];

            $('.dropdown.assigned-to', this.el).dropdown({
                forceSelection: true,
                onChange: this.onAssignedToChange.bind(this)
            });

            $('.calendar.snooze', this.el).calendar({
                type: 'date',
                firstDayOfWeek: 1,
                onChange: this.onDueDateChange.bind(this),
                formatter: {
                    cell: (cell:jQuery, date:Date, cellOptions:any) => {
                        if(cellOptions.mode === 'day' && date.getDay() === 1) {
                            const week = moment(date).isoWeek(),
                                text = cell.text(),
                                html =  `<span class="ui blue basic ribbon label">${week}</span>&nbsp;${text}`;
                            cell.html(html);
                        }
                    }
                }
            });
        
            $('.dropdown.status', this.el).dropdown({
                forceSelection: true,
                onChange: this.onStatusChange.bind(this)
            });
        }
    }

    detached() {
        $('.calendar.snooze', this.el).calendar('destroy');
    }

    @computedFrom('activity.date')
    get dateDisplay():string {
        if(!this.activity.date) return 'Not Set';

        return moment(this.activity.date).format('ddd, MMM D, YYYY');
    }

    @computedFrom('activity.assignedTo')
    get assignedToDisplay():string {
        return this.activity.assignedTo || AssignedTo.UNASSIGNED;
    }

    @computedFrom('activity.workType')
    get colour():string {
        if(WorkTypes.equals(this.activity.workType, WorkTypes.Growing)) return 'green';
        if(WorkTypes.equals(this.activity.workType, WorkTypes.Labour)) return 'blue';
        return 'grey';
    }

    @computedFrom('activity.status')
    get statusClass():string {
        if(!this.activity || !this.activity.status) return '';

        if(ActivityStatuses.equals(this.activity.status, ActivityStatuses.NotStarted) && moment(this.activity.date).isBefore(moment(), 'day')) return 'overdue';

        return this.activity.status.replace(' ', '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    }

    @computedFrom('activity.crops')
    get cropNames():string {
        if(!this.activity || !Array.isArray(this.activity.crops) || !this.activity.crops.length) return '';

        return this.activity.crops.sort().join(', ');
    }

    @computedFrom('activity.zones')
    get zoneNames():string {
        if(!this.activity || !Array.isArray(this.activity.zones) || !this.activity.zones.length) return '';

        return this.activity.zones.map(z => z.name).sort().join(', ');
    }

    onDueDateChange(value:string) {
        const date = moment(value).toDate();
        this.activity.date = date;
        this.service.save(this.activity)
            .then(result => {
                if(result.ok) {
                    Notifications.success('Due Date changed successfully.');
                } else {
                    Notifications.error(result.errors[0]);
                }
            })
            .catch(Notifications.error);
    }

    onStatusChange(value:ActivityStatus) {
        if(ActivityStatuses.equals(value, this.activity.status)) return;

        const save = () => {
            this.activity.status = value;

            if(ActivityStatuses.equals(this.activity.status, ActivityStatuses.Complete)) {
                if(!this.activity.journal) {
                    this.activity.journal = new JournalDocument;
                }
                this.activity.journal.completedDate = new Date;
            }

            this.service.save(this.activity)
                .then(result => {
                    if(result.ok) {
                        Notifications.success('Status changed successfully.')
                    } else {
                        Notifications.error(result.errors[0]);
                    }
                })
                .catch(Notifications.error);
        };

        if(ActivityStatuses.equals(value, ActivityStatuses.Incomplete)) {
            this.dialogService.open({ viewModel: IncompleteDialog })
                .whenClosed(result => {
                    if(result.wasCancelled) return;

                    if(!this.activity.journal) {
                        this.activity.journal = new JournalDocument;
                    }

                    this.activity.journal.notes = result.output;
                    save();
                });
        } else if(ActivityStatuses.equals(value, WITH_COMMENT) ||
            ((ActivityStatuses.equals(value, ActivityStatuses.Complete) &&
            JournalRecordingTypes.equals(this.activity.recordingType, JournalRecordingTypes.Measurement)))) {

            // fix the WITH_COMMENT ones...    
            value = ActivityStatuses.Complete;

            const model = new ActivityDocument(this.activity);

            this.dialogService.open({ viewModel: CompleteDialog, model })
                .whenClosed(result => {
                    if(result.wasCancelled) return;

                    if(!this.activity.journal) {
                        this.activity.journal = new JournalDocument;
                    }
                    
                    Object.assign(this.activity.journal, result.output);

                    save();
                });

        } else {
            save();
        }
    }

    onAssignedToChange(value:string) {
        this.activity.assignedTo = value;
        this.service.save(this.activity)
            .then(result => {
                if(result.ok) {
                    Notifications.success('Assignment changed successfully.')
                } else {
                    Notifications.error(result.errors[0]);
                }
            })
            .catch(Notifications.error);
    }
}

interface StatusItem {
    status:ActivityStatus,
    text:string    
}