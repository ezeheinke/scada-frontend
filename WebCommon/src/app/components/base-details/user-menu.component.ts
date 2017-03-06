import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';

const stateContainer = StateContainerService();

export function UserMenuComponent() {             
    
    let ractive: IRactive = undefined;          
    
    const ractiveData = {
        el: undefined,
        template: `
            <button class="system-control-icon" on-click="displaySettings">
                <span class="icon dripicons-gear" title="Settings" aria-hidden="true"></span>
            </button>
            
        `,
        data: {
            activeUrl: undefined 
        }
    };        
    
    function init(elem) {
        console.log("<user-menu>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        ractive.on('displaySettings', function(){
            stateContainer.change('window', 'users');
        });
        console.log("</user-menu>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}