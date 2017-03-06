import Ractive from 'ractive';

declare var crossfilter: any;
declare var d3: any;

import { AlertsComponent } from '../common-summary/alerts.component';
import { ActivePowerComponent } from './active-power.component';
import { ActivePowerHistoryComponent } from './active-power-history.component';
import { DevicesAvailabilityComponent } from '../common-summary/devices-availability.component';
import { DevicesAvailabilityChartComponent } from './devices-availability-chart.component';


export function SummaryComponent() {             
    
    let ractive: IRactive = undefined;

    const alerts = AlertsComponent();
    const activePower = ActivePowerComponent();
    const activePowerHistory = ActivePowerHistoryComponent();
    const availability = DevicesAvailabilityComponent();
    const availabilityChart = DevicesAvailabilityChartComponent();
    
    const ractiveData = {
        el: undefined,
        template: `   
            <div class="summary-line no-padding">
                <div id="alerts">
                </div>
            </div>            
            <div class="summary-line">
                <div id="active-power" class="summary-item full-width">
                </div>
            </div>
            <div class="summary-line">
                <div id="devices-availability" class="summary-item full-width availability-stacked-chart-colors">
                </div>                
            </div>
        `
    };
    
    function init(elem) {
        console.log("<summary-asset-maintainer>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData); 
        alerts.init('#alerts');        

        const promise = getDcData('/data/devices-records.json');

        activePower.init('#active-power');
        activePowerHistory.init('#chart-active-power', promise);

        availability.init('#devices-availability');
        availabilityChart.init('#devices-availability-chart', promise);        

        console.log("</summary-asset-maintainer>");
    }

    function getDcData(url){
        const promise = new Promise(resolve => {                
            fetch(url)
            .then(response => response.json())
            .then(dataset => {
                const dateFormat = d3.time.format('%d/%m/%Y %H:%M');
                dataset.forEach(function (record: AssetRecord) {
                    record.dateParsed = dateFormat.parse(record.date);                
                });        
                const ndx = crossfilter(dataset);
                const dcData = {
                    ndx
                };
                resolve(dcData);                
            });
        });
        return promise;
    }
    
    function clean() {
        alerts.clean();
        activePower.clean();
        activePowerHistory.clean();
        availability.clean();
        availabilityChart.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}