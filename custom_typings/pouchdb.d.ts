export {};

declare global {
    namespace PouchDB {
        interface Database {
            sync<Content extends {}>(remote:string | Database, options?:SyncOptions):Core.Sync<Content>;
            query<Content extends {}>(filter:string, options?:QueryOptions):Promise<Core.QueryResponse<Content>>;
        }

        interface SyncOptions {
            live?:boolean;
            batch_size?:number;
        }

        interface QueryOptions {
            include_docs?:boolean;
            startkey?:string;
            endkey?:string;
            key?:string | string[];
        }
        
        namespace Core {
            interface TypeMeta {
                type:string;
            }

            interface QueryResponse<Content extends {}> {
                /** The `skip` if provided, or in CouchDB the actual offset */
                offset: number;
                total_rows: number;
                rows: Array<{
                    /** Only present if `include_docs` was `true`. */
                    doc?: ExistingDocument<Content & AllDocsMeta>;
                    id: DocumentId;
                    key: DocumentKey;
                    value: Content
                }>;
            }

            interface Sync<Content extends {}> extends EventEmitter, Promise<ChangesResponse<SyncResponseContent>> {
                on(event: 'change', listener: (value: SyncResponseChange) => any): this;
                on(event: 'complete', listener: () => any): this;
                on(event: 'paused', listener: (value: ChangesResponse<Content>) => any): this;
                on(event: 'error', listener: (value: any) => any): this;
    
                cancel(): void;
            }
    
            interface SyncResponseChange {
                direction:SyncDirection;
                change:SyncResponse;
            }
    
            interface SyncResponse {
                docs:(SyncResponseContent & any)[];
                docs_read:number;
                docs_written:number;
                errors:string[];
                last_seq:string;
                start_time:string;
            }
    
            interface SyncResponseContent {
                _id:string;
                _rev:string;
                _deleted?:boolean;
            }
    
            type SyncDirection = 'push' | 'pull';
        }        
    }
}