import {autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Configuration} from '../configuration';
import {Authentication} from '../authentication';

interface UserDoc {
    id:string;
    key:string;
    value:User;
}

export interface User {
    name:string;
    roles:string[]
}

@autoinject
export class UsersService {
    constructor(private auth:Authentication, private config: Configuration, private httpClient:HttpClient) { }

    getAll():Promise<User[]> {
        return new Promise((resolve, reject) => {
            const name = this.auth.userInfo.name,
                pass = this.auth.userInfo.password,
                key = btoa(`${name}:${pass}`),
                headers = { Authorization: `Basic ${key}` },
                url = `${this.config.remote_server}/_users/_design/user-filters/_view/boekestyn-users`;

            return this.httpClient.fetch(url, { headers })
                .then((result) => {
                    if(result.ok) {
                        return result.json()
                            .then((json:PouchDB.Core.AllDocsResponse<UserDoc>) => {
                                const users = json.rows.map(r => r.value);
                                return resolve(users);
                            })
                            .catch(reject);
                    }

                    return result.json()
                        .then(reject)
                        .catch(reject);
                })
                .catch(reject);
        });
    }
}