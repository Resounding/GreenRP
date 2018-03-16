import {autoinject} from 'aurelia-framework';
import {DialogController, DialogService} from 'aurelia-dialog';
import {TaskCategoryDoc, TaskCategory} from '../../models/task-category';
import {TaskCategoryService} from '../../services/data/task-category-service';
import { Notifications } from '../../services/notifications';

@autoinject
export class TaskCategoryDetail {
    el:Element;
    category:TaskCategoryDoc;
    errors:string[]

    constructor(private service:TaskCategoryService, private dialogService:DialogService,
        private controller:DialogController) {
        controller.settings.lock = true;
        controller.settings.position = position;
    }

    activate(category:TaskCategory) {
        this.category = new TaskCategoryDoc(category):
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
            this.errors = [];

            const saved = await this.service.save(this.category);

            if(saved.ok) {
                this.controller.close(true);
                Notifications.success('Category saved successfully');
            } else {
                this.errors = saved.errors;
            }

        } catch(e) {
            Notifications.error(e);
        }
    }

    async delete() {
        try {

            this.errors = [];

            const deleted = await this.service.delete(this.category);

            if(deleted) {
                this.controller.close(true);
                Notifications.success('Category deleted successfully');
            } else {
                this.errors.push('Could not delete category');
            }

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