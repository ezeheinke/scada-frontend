import Ractive from 'ractive';

declare var crossfilter: any;
declare var d3: any;

import { ReportsFilterComponent } from './reports-filter.component';
import { ReportsTableComponent } from './reports-table.component';

export function PageComponent() {             
    
    let ractive: IRactive = undefined;

    const reportsFilter = ReportsFilterComponent();
    const reportsTable = ReportsTableComponent();
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="bottom-tab-view-container">
                <div class="bottom-tab-bar responsive-large">
                    <div id="reports-filter">
                    </div>
                </div>
                <div class="content-container">
                    <div id="reports-table">
                    </div>
                </div>
            </div>
        `
    };
    
    function init(elem) {
        console.log("<page-reports>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        reportsFilter.init('#reports-filter');
        reportsTable.init('#reports-table');
        console.log("</page-reports>");
    }
    
    function clean() {
        reportsFilter.clean();
        reportsTable.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}