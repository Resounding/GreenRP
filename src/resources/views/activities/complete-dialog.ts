import {autoinject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {ActivityDocument, JournalDocument, JournalRecordingTypes} from '../../models/activity';

@autoinject
export class CompleteDialog {
    activity:ActivityDocument;
    notes:string = '';
    measurement:string = '';
    errors:string[];

    constructor(private controller:DialogController) { }

    activate(activity:ActivityDocument) {
        this.activity = activity;
    }

    save() {
        const notes = this.notes,
            measurement = this.measurement;

        this.controller.ok({ notes, measurement });
    }

    get isMeasurement():boolean {
        return this.activity && JournalRecordingTypes.equals(this.activity.recordingType, JournalRecordingTypes.Measurement);
    }
}