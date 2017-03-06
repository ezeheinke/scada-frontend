import Ractive from 'ractive';

declare var crossfilter: any;
declare var d3: any;

import { AssetsAvailabilityComponent } from '../common-summary/assets-availability.component';
import { AssetsProductionComponent } from '../common-summary/assets-production.component';
import { DailyProductionComponent } from '../summary-ccr-owner/daily-production.component';
import { SummaryWeatherComponent } from './summary-weather-alerts.component';

/**TODO temp just for showing till finaces is ready */
let interval = undefined;
const time = 600000;

export function SummaryComponent() {             
    
    let ractive: IRactive = undefined;

    const availability = AssetsAvailabilityComponent();
    const production = AssetsProductionComponent();
    const dailyProduction = DailyProductionComponent();
    const weatherSummary = SummaryWeatherComponent();
    
    const ractiveData = {
        el: undefined,
        template: `               
            <div class="summary-line">
                <div id="assets-availability" class="summary-item full-width">
                </div>                
            </div>
            <div class="summary-line">
                <div id="assets-production" class="summary-item full-width">
                </div>                          
            </div>
            <div class="summary-line">
                <div id="daily-production" class="summary-item full-width">
                </div>
            </div>
            <div class="summary-line">
                <div id="alert-summary" class="summary-item full-width">
                </div>
            </div>
        `
    };
    
    function init(elem) {
        console.log("<summary-ccr-operator>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData); 

        availability.init('#assets-availability');
        production.init('#assets-production');

        dailyProduction.init('#daily-production');
        dailyProduction.setData();
        interval = window.setInterval(function(){
            dailyProduction.setData();         
        }, time);

        weatherSummary.init('#alert-summary');

        console.log("</summary-ccr-operator>");
    }
    
    function clean() {     
        availability.clean();
        production.clean();
        ractive.teardown();
        window.clearInterval(interval);
        dailyProduction.clean();
        weatherSummary.clean();
    }
    
    return {
        init,
        clean
    };
}