import Ractive from 'ractive';

import { RoleSelectorComponent } from './role-selector.component';

import { StateContainerService } from '../../services/state-container.service';

export function SummaryNavbarComponent() {                 
    let ractive: IRactive = undefined;
    
    const roleSelector = RoleSelectorComponent();

    const stateContainer = StateContainerService();
    
    const ractiveData = {
        el: undefined,
        template: `
            <div id="title-wrapper">
                {{#if viewLevel === 'CCR'}}
                <img id="park-logo" src="styles/images/logo_white.png" alt="Green Eagle">
                {{else}}
                <i id="back-button-icon" class="icon dripicons-arrow-thin-left clickable" on-click="returnToCCR" aria-hidden="true"></i>
                <div id="park-name">
                    {{viewName}}
                </div>
                {{/if}}
            </div>
            <div id="role-selector">
            </div>
        `,
        data: {
            viewName: undefined,
            viewLevel: undefined
        }
    };

    let unsubscribes = [];
    
    function init(elem) {
        console.log("<summary-navbar>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        unsubscribes.push(            
            stateContainer.subscribe("view", function(view){
                const viewName = stateContainer.Static.Data.views[view].name;
                ractive.set('viewName', viewName);
            }),
            stateContainer.subscribe("viewLevel", function(viewLevel){                
                ractive.set('viewLevel', viewLevel);
            })
        );

        ractive.on('returnToCCR', function(){
            location.assign('#/assets');
        });

        roleSelector.init('#role-selector');
        console.log("</summary-navbar>");
    }
    
    function clean() {
        unsubscribes.forEach(unsubscribe => unsubscribe());
        roleSelector.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}