import PouchDb = require("pouchdb-core");

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

interface PouchDebug {
    enable(what:string);
}

import GetOptions = PouchDB.Core.GetOptions;

declare global {
    
    interface PouchDB {
        destroy():Promise<PouchDestroyResponse>;
        plugin(plugin:any);
        find<T>(request?:FindRequest):Promise<DocList<T>>;
        get(id: string, opts?: GetOptions):Promise<any>;
        put(item:any):Promise<PouchDB.Core.Response>;
        bulkDocs(items:any[]):Promise<PouchDB.Core.Response[]>;
        remove(item:any):Promise<PouchDB.Core.Response>;
        sync(remote:PouchDB, opts?:PouchSyncOptions):PouchEventEmitter;
        debug:PouchDebug;
    }
}

declare module 'pouchdb-find' {
    export = PouchDB;
}
