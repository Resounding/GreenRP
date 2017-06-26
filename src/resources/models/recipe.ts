import {computedFrom} from 'aurelia-framework';
import {Plant} from './plant';
import {Task, TaskDocument} from './task';
import {Zone} from './zone';

export interface Recipe {
    _id?:string;
    _rev?:string;
    type:string;
    name:string;
    plant?:Plant;
    zone?:Zone;
    instructions:string;
    tasks:Task[];
}

export class RecipeDocument implements Recipe {
    _id?:string;
    _rev?:string;
    type:string;
    instructions:string;
    tasks:TaskDocument[] = [];
    private _plant:Plant = null;
    private _zone:Zone = null;

    constructor(data:Recipe | {} = {}) {
        Object.assign(this, data);

        if(Array.isArray(this.tasks)) {
            this.tasks = this.tasks.map(t => new TaskDocument(t));
        }
    }


    @computedFrom('_plant', '_zone')
    get name():string {
        if(this._plant) return this._plant.name;
        if(this._zone) return this._zone.name;

        return 'New Recipe';
    }
    set name(value:string) {
        /* just here to prevent errors */
    }

    @computedFrom('_plant')
    get plant():Plant {
        return this._plant;
    }
    set plant(value:Plant) {
        if(this._plant === value) return;

        this._plant = value;
        if(this._plant) {
            this.zone = null;
        }
    }

    @computedFrom('_zone')
    get zone():Zone {
        return this._zone;
    }
    set zone(value:Zone) {
        if(this._zone === value) return;

        this._zone = value;
        if(this._zone) {
            this.plant = null;
        }
    }

    @computedFrom('_id')
    get isNew():boolean {
        return !this._id;
    }

    getTask(id:string) {
        return this.tasks.find(t => t._id === id);
    }

    updateTask(task:TaskDocument) {
        const index = this.tasks.findIndex(t => t._id === task._id);
        if(index === -1) {
            this.tasks.push(task);
        } else {
            this.tasks[index] = task;
        }
    }

    toJSON():Recipe {
        const json:Recipe = {
            type: RecipeDocument.RecipeDocumentType,
            name: this.name,
            plant: this.plant,
            zone: this.zone,
            instructions: this.instructions,
            tasks: null
        };

        if(Array.isArray(this.tasks)) {
            json.tasks = this.tasks.map(t => {
                return t.toJSON();
            });
        }

        if(!this.isNew) {
            json._id = this._id;
            json._rev = this._rev;
        }

        return json;
    }

    public static RecipeDocumentType:string = 'recipe';
}