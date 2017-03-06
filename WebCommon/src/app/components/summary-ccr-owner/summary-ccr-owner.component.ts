import Ractive from 'ractive';

import { AssetsAvailabilityComponent } from '../common-summary/assets-availability.component';
import { CurrentEarningsComponent } from './current-earnings.component';
import { DailyProductionComponent } from './daily-production.component';

let interval = undefined;
const time = 600000;

export function SummaryComponent() {

    let ractive: IRactive = undefined;
    const availability = AssetsAvailabilityComponent();
    const income = CurrentEarningsComponent();
    const dailyProduction = DailyProductionComponent();

    const ractiveData = {
        el: undefined,
        template: `
            <div class="summary-line">
                <div id="assets-availability" class="summary-item full-width">
                </div>                
            </div>
            <div class="summary-line">
                <div id="assets-income" class="summary-item full-width">
                </div>                          
            </div>
            <div class="summary-line">
                <div id="daily-production" class="summary-item full-width">
                </div>
            </div>
        `
        } ;
    function init(elem) {
        console.log("<summary-ccr-owner>")
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        availability.init('#assets-availability');

        income.init('#assets-income');
        dailyProduction.init('#daily-production');
        
        setData(income,dailyProduction);
        interval = window.setInterval(function(){
            setData(income,dailyProduction);         
        }, time);

        console.log("</summary-ccr-owner>")
    }

    function setData(income,dailyProduction) {

        income.setData();
        dailyProduction.setData();

    }
    
    function clean() {
        window.clearInterval(interval);
        availability.clean();
        dailyProduction.clean();
        income.clean();
        ractive.teardown();
    }

    return {
        init,
        clean
    } 
}