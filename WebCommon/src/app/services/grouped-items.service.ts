import { StateContainerService } from './state-container.service';
import { ResourcesService } from './resources.service';
import { UserAccessesService } from './user-accesses.service';
const stateContainer = StateContainerService();
const resources = ResourcesService();
const permissions = UserAccessesService();

export function GroupedItemsService() {    

    function get(){        
        const token = stateContainer.read('user.token');
        const serverPath = stateContainer.Static.Data.serverPath;
        let responseOk = false;
        return fetch(serverPath+'/api/report/groupedItems', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            }
        })
        .then(response => {            
            responseOk = response.ok;
            return response.json()
        })
        .then(groupedItems => {
            let groups = processGroupedItems(groupedItems);
            groups = allowedGroups(groups);
            return responseOk === true ? 
                        groups:
                        [{id: undefined, name: 'Error on load groups.'}];
        });
    }

    function processGroupedItems(groupedItems){
        const groups = Object.keys(groupedItems)
        .map(assetId => {
            const asset = resources.getAsset(assetId);
            const assetName = asset !== undefined && asset.name ? asset.name : assetId;            
            const group = {
                id: assetId,
                name: assetName,
            };
            const items = Object.keys(groupedItems[assetId])
            .map(itemId => {
                return {id: assetId+'.'+itemId, name: assetName+': '+groupedItems[assetId][itemId] };
            })
            group['items'] = items;
            return group;
        });            
        return groups;
    }

    function allowedGroups(groups) {
        const filterGroups = groups
        .filter(group => permissions.hasAccess('assets', group.id) );
        return filterGroups;
    }
    
    return {
        get,
    }
    
}

// groupedItems = {
//     "PARK_Carcelen":{
//         "SetpointReceived": "Setpoint Recibido (kW)"
//     },
//     "PARK_ElCastre":{
//         "SetpointReceived": "Setpoint Recibido (kW)",
//         "ReactivePower": "Potencia Reactiva (kVAr)"
//     },
//     "PARK_CabezoDeSanRoque":{
//         "ReactivePower": "Potencia Reactiva (kVAr)"
//     }
// }