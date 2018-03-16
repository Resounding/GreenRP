import {computedFrom} from 'aurelia-framework';
import {CouchDoc, CouchDocBase} from './couch-doc';
import {ValidationResult} from './validation';

export interface TaskCategory extends CouchDoc {
    name:string;
    colour:string;
    active:boolean;
}

export class TaskCategoryDoc extends CouchDocBase<TaskCategory> implements TaskCategory {
    name:string;
    colour:string;
    active:boolean;

    constructor(data:TaskCategory | {} = {}) {
        super(Object.assign({
                type: TaskCategoryDoc.TaskCategoryType,
                name: '',
                colour: '',
                active: true
            }, data));

        if(this.active !== false) {
            this.active = true;
        }
    }

    @computedFrom('_id')
    get isNew():boolean {
        return !this._id;
    }
    set isNew(value:boolean) { }

    get type():string {
        return TaskCategoryDoc.TaskCategoryType;
    }
    set type(value:string) { }

    validate():ValidationResult {
        return validateTaskCategory(this.toJSON());
    }

    toJSON():TaskCategory {
        const json = {
            _id: this._id || null,
            _rev: this._rev || null,
            type: TaskCategoryDoc.TaskCategoryType,
            name: this.name,
            colour: this.colour,
            active: !!this.active
        };
        return json;
    }

    static TaskCategoryType:string = 'task-category';
}

function validateTaskCategory(category:TaskCategory):ValidationResult {
    const result:ValidationResult = {
        ok: true,
        errors:[]
    };

    if(!category.name) {
        result.ok = false;
        result.errors.push('Please enter the name of the Category')
    }

    return result;
}