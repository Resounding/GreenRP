import {autoinject} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {TaskCategoryDetail} from './detail';
import {TaskCategoryDoc, TaskCategory} from '../../models/task-category';
import {TaskCategoryService} from '../../services/data/task-category-service';

@autoinject
export class TaskCategories {
    taskCategories:TaskCategory[];

    constructor(private service:TaskCategoryService, private dialogService:DialogService) { }

    async activate() {
        await this.load();
    }

    addCategory() {
        this.dialogService
            .open({ viewModel: TaskCategoryDetail, model: new TaskCategoryDoc() })
            .whenClosed(async result => {
                if(result.wasCancelled) return;

                await this.load();
            });
    }

    detail(category:TaskCategory) {
        this.dialogService
            .open({ viewModel: TaskCategoryDetail, model: category })
            .whenClosed(async result => {
                if(result.wasCancelled) return;

                await this.load();
            });
    }

    async load() {
        this.taskCategories = await this.service.getAll();
        console.log(this.taskCategories);
    }
}