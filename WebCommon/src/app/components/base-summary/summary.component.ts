import Ractive from 'ractive';

import { SummaryNavbarComponent } from './summary-navbar.component';
import { SummaryLoaderComponent } from './summary-loader.component';
import { SummaryActionsComponent } from './summary-actions.component';

export function SummaryComponent() {             
    
    let ractive: IRactive = undefined;
    
    const summaryNavbar = SummaryNavbarComponent();
    const summaryLoader = SummaryLoaderComponent();
    const summaryActions = SummaryActionsComponent();
    
    const ractiveData = {
        el: undefined,
        template: `
            <div id="summary-navbar" class="summary-fixed-bar">
            </div>
            
            <div id="summary-loader">
            </div>

            <div id="summary-actions" class="summary-fixed-bar">
            </div>
        `
    };
    
    let unsubscribes = [];
    
    function init(elem) {
        console.log("<summary>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        summaryNavbar.init('#summary-navbar');
        summaryLoader.init('#summary-loader');
        summaryActions.init('#summary-actions');

        console.log("</summary>");
    }
    
    function clean() {
        summaryNavbar.clean();
        summaryLoader.clean();
        summaryActions.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}