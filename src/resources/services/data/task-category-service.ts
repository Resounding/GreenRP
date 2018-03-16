import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {ServiceBase} from './service-base';
import {Database} from '../database';
import {TaskCategory, TaskCategoryDoc} from '../../models/task-category';

@autoinject
export class TaskCategoryService extends ServiceBase<TaskCategory> {

    constructor(database:Database, events:EventAggregator) {
        super(database, events, 'filters/task-categories');
    }
}