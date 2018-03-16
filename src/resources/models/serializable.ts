import {CouchDoc} from './couch-doc'

export interface ISerializable<T> {
    toJSON():T;
}