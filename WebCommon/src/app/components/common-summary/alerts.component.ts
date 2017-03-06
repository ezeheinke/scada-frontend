import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';

export function AlertsComponent() {             
    
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    
    const ractiveData = {
        el: undefined,
        template: `            
            <a href="#/control" class="summary-alert normal" on-click="changeRole:operator">
                <span class="icon dripicons-toggles alert-icon" aria-hidden="true"></span>
                Reactive regulation is fulfilled.
                <span class="icon dripicons-chevron-right alert-arrow pull-right" aria-hidden="true"></span>
            </a>
            <a href="#/control" class="summary-alert warning" on-click="changeRole:operator">
                <span class="icon dripicons-warning alert-icon" aria-hidden="true"></span>
                Active regulation is not fulfilled.
                <span class="icon dripicons-chevron-right alert-arrow pull-right" aria-hidden="true"></span>
            </a>
            <a href="#/devices" class="summary-alert warning" on-click="changeRole:maintainer">
                <span class="icon dripicons-warning alert-icon" aria-hidden="true"></span>
                Turbine 012 has disconnected.
                <span class="icon dripicons-chevron-right alert-arrow pull-right" aria-hidden="true"></span>
            </a>
        `
    };
    
    function init(elem) {
        console.log("<alerts>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        ractive.on('changeRole', function(event, role){            
            stateContainer.change('role', role);
        });

        console.log("</alerts>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}