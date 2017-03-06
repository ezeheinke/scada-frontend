import Ractive from 'ractive';

import { SummaryComponent } from '../base-summary/summary.component';
import { DetailsComponent } from '../base-details/details.component';

export function DashboardComponent() {             
    
    let ractive: IRactive = undefined;
    
    const summary = SummaryComponent();
    const details = DetailsComponent();
    
    const ractiveData = {
        el: undefined,
        template: `
            <div id="summary"></div>
            <div id="details"></div>
            <div id="mobile-shadow" on-click="hideSummary"></div>
        `
    };
    
    function init(elem) {
        console.log("<dashboard>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        ractive.on("hideSummary", function(){
            document.getElementById("summary").classList.add("mobile-hidden"); 
            document.getElementById("mobile-shadow").classList.add("mobile-hidden");
        });
        summary.init('#summary');
        details.init('#details');
        console.log("</dashboard>");
    }
    
    function clean() {
        summary.clean();
        details.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}