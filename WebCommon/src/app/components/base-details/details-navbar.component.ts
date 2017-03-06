import Ractive from 'ractive';

import { PageTabsComponent } from './page-tabs.component';
import { SystemControlComponent } from './system-control.component';

export function DetailsNavbarComponent() {             
    
    let ractive: IRactive = undefined;

    const pageTabs = PageTabsComponent();
    const systemControl = SystemControlComponent();        
    
    const ractiveData = {
        el: undefined,
        template: `
            <div id="page-tabs">
            </div>
            <div id="system-control">
            </div>
        `
    };

    let unsubscribe = undefined;      
    
    function init(elem) {
        console.log("<details-navbar>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        pageTabs.init('#page-tabs');
        systemControl.init('#system-control');
        console.log("</details-navbar>");
    }
    
    function clean() {
        pageTabs.clean();
        systemControl.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}