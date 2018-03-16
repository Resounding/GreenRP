import {autoinject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Notifications} from '../notifications';
import {Database} from '../database';
import {CouchDoc} from '../../models/couch-doc';
import {ISerializable} from '../../models/serializable';
import {IValidatable, ValidationResult} from '../../models/validation';

@autoinject
export abstract class ServiceBase<T extends CouchDoc> {
    
    constructor(protected database:Database, protected events:EventAggregator, private getAllFilter:string) { }

    get db():PouchDB.Database {
        return this.database.db;
    }

    async getAll(includeInactive:boolean = false):Promise<T[]> {
        try {

            const result = await this.db.query<T>(this.getAllFilter, { include_docs: true }),
                docs = result.rows
                    .map(row => row.doc)
                    .filter(doc => includeInactive || (<any>doc).active);

                return docs;

        } catch(e) {
            throw e;
        }
    }

    async getOne(id:string):Promise<T> {
        try {
            const result = await this.database.db.get<T>(id),
                doc = result;

            return doc;
        } catch(e) {
            throw e;
        }
    }

    async save(item:T & ISerializable<T> & IValidatable, options?:any):Promise<ValidationResult> {
        const valid = item.validate(),
            json = item.toJSON(),
            isNew = !item._id;

        if(!valid.ok) return valid;

        try {
            const result = await (isNew ? this.database.db.post(json) : this.database.db.put(<PouchDB.Core.PutDocument<T>>json)),
                ok = result.ok;

            valid.ok = ok;
            if(!ok) {
                valid.errors.push('There was a problem saving.')
            }
        } catch(e) {
            valid.ok = false;
            valid.errors.push(e);
        }

        return valid;
    }

    async delete(item:T):Promise<boolean> {
        try {

            const result = await this.database.db.remove(item);

            if(result.ok) return true;

            Notifications.error('There was a problem deleting.');
            return false;

        } catch(e) {
            Notifications.error(e);
            return false;
        }
    }
}