import {autoinject} from 'aurelia-framework';
import {DialogController, DialogService, DialogResult} from 'aurelia-dialog';
import {log} from '../../services/log';
import {ReferenceService} from '../../services/data/reference-service';
import {Plant,Spacings} from '../../models/plant';

@autoinject
export class PlantDetail {
    private plant:Plant;

    constructor(private referenceService:ReferenceService, private dialogService:DialogService,
        private controller:DialogController, private element:Element) {
        controller.settings.lock = true;
        controller.settings.position = position;
    }

    attached() {
        $('.ui.checkbox', this.element).checkbox();
    }

    detached() {
        $('.ui.checkbox', this.element).checkbox('destroy');
    }

    activate(plant:Plant) {
        this.plant = _.clone(plant);

        if(!this.plant.size.endsWith('"')) this.plant.size += '"';        
    }

    cancel() {
        this.controller.cancel();
    }

    save() {
        this.plant.size = numeral(this.plant.size).value().toString();
        this.plant.name = `${this.plant.size}" ${this.plant.crop}`;

        this.referenceService.savePlant(this.plant)
            .then(() => {
                this.controller.close(true, this.plant);
            })
            .catch(err => {
                log.error(err);
                alert(err);
            })

        
    }
}

function position(modalContainer:Element, modalOverlay:Element) {
    const $container = $(modalContainer),
        $aiHeader = $container.find('ai-dialog-header'),
        $aiFooter = $container.find('ai-dialog-footer'),
        $aiBody = $container.find('ai-dialog-body'),
        headerHeight = $aiHeader.outerHeight(),
        footerHeight = $aiFooter.outerHeight(),
        bodyHeight = `calc(100% - ${footerHeight + headerHeight}px)`;

    $aiBody.css({ height: bodyHeight });
}