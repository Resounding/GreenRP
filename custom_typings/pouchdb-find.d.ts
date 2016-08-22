import {Promise} from 'bluebird';

interface FindRequest {
    selector?: any;
    fields?: string[];
    sort?: string[] | Object;
}

interface DocList<T> {
    docs:T[];
}

interface PouchDestroyResponse {
    ok:boolean;
}

type eventFunction = (e?:any) => PouchEventEmitter;

interface PouchEventEmitter {
    on(event:string, callback:eventFunction);
}

interface PouchSyncOptions {
    live?: boolean
}

declare global {
    interface PouchDB {
        destroy():Promise<PouchDestroyResponse>;
        plugin(plugin:any);
        find<T>(request?:FindRequest):Promise<DocList<T>>;
        get(id: string, opts?: PouchGetOptions):Promise<any>;
        put(item:any):Promise<PouchUpdateResponse>;
        sync(remote:PouchDB, opts?:PouchSyncOptions):PouchEventEmitter;
    }
}

declare module 'pouchdb-find' {
    export = PouchDB;
}