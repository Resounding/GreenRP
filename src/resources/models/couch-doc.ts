import {ISerializable} from './serializable'
import {IValidatable, ValidationResult} from './validation'

export interface CouchDoc extends PouchDB.Core.IdMeta, PouchDB.Core.RevisionIdMeta, PouchDB.Core.TypeMeta { }

export abstract class CouchDocBase<T extends CouchDoc> implements CouchDoc, IValidatable, ISerializable<T> {
    _id:string;
    _rev:string;
    type:string;

    constructor(data:T | {} = {}) {
        Object.assign(this, {
            _id: '',
            _rev: '',
            type: ''
        }, data);
    }

    validate():ValidationResult {
        return {
            ok: true,
            errors: []
        };
    }

    toJSON():T {
        return Object.assign(<T>{}, this);
    }
}