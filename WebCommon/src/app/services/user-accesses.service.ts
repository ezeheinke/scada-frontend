import { StateContainerService } from './state-container.service';

const stateContainer = StateContainerService();

export function UserAccessesService() {    
    
    function hasAccess(access, value?){
        const accesses = stateContainer.read('user.accesses');
        let currentAccess = access[access];
        let hasAccess = (currentAccess === undefined);
        
        if (hasAccess) {
            let grants = accesses[access];
            hasAccess = (grants !== undefined && grants.length > 0);

            if(hasAccess) {
                let currentGrant = grants[0];
                hasAccess = (currentGrant.includes('ALL') || currentGrant.includes(value));                
            }
        }

        return hasAccess;            
    }

    function blockAccess(access, value?){
        const accesses = stateContainer.read('user.accesses');
        let currentAccess = access[access];
        let blockAccess = (currentAccess === undefined);
        
        if (blockAccess) {
            let grants = accesses[access];
            blockAccess = (grants !== undefined && grants.length > 0);

            if(blockAccess) {
                let currentGrant = grants[0];
                blockAccess = currentGrant.includes(value);                
            }
        }

        return blockAccess;
    }

    function getAccesses(access){
        const accesses = stateContainer.read('user.accesses');
        return accesses[access];                   
    }
    
    return {
        hasAccess,
        blockAccess,
        getAccesses
    }
    
}