import { StateContainerService } from './state-container.service';
import { UserAccessesService } from './user-accesses.service';
const stateContainer = StateContainerService();
const permissions = UserAccessesService();

import * as fmt from "myers";

export function UsersManagerService() {

    const token = stateContainer.read('user.token');
    const serverPath = stateContainer.Static.Data.serverPath;

    function get(){                
        return fetch(serverPath+'/api/userdb/ls', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            }
        })
        .then(response => response.json());       
    }

    function add(user){
        user.password = fmt.default(user.password);
        return fetch(serverPath+'/api/userdb/add', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(user)
        })
        .then(response => response.text());            
    }

    function remove(username){
        return fetch(serverPath+'/api/userdb/rm', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({username})
        })
        .then(response => response.text());              
    }
    
    return {
        get,
        add, 
        remove
    }
    
}