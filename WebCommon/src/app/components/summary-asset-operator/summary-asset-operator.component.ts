import Ractive from 'ractive';

declare var crossfilter: any;
declare var d3: any;

// import { AlertsComponent } from '../common-summary/alerts.component';
import { DevicesAvailabilityComponent } from '../common-summary/devices-availability.component';
import { PowerFactorComponent } from './power-factor.component';

import { StateContainerService } from '../../services/state-container.service';
import { CompactScadaService } from '../../services/compact-scada.service';

export function SummaryComponent() {             
    
    let ractive: IRactive = undefined;

    // const alerts = AlertsComponent();
    let availability = undefined;
    //const powerFactor = PowerFactorComponent();

    const stateContainer = StateContainerService();
    const compactScada = CompactScadaService();
    
    const ractiveData = {
        el: undefined,
        template: `    
            <!--<div class="summary-line no-padding">
                <div id="alerts">
                </div>
            </div>-->
            {{#if devicesAvailability}}
            <div class="summary-line">
                <div id="devices-availability" class="summary-item full-width">
                </div>                
            </div>
            {{/if}}
            <div class="summary-line">
                <div id="power-factor" class="summary-item full-width">
                </div>
            </div>
        `,
        data: {
            devicesAvailability: false
        }
    };
    
    function init(elem) {
        console.log("<summary-asset-operator>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData); 
        // alerts.init('#alerts');

        const assetId = stateContainer.read('view');
        const asset = stateContainer.Static.Data.views[assetId];
        const deviceModels = asset.servicesData.deviceModel.models;

        const checkPattern = `^${assetId}\.(${deviceModels.join('|')})`;

        compactScada.getSignals(checkPattern)
        .then(function(signals: Signal[]) {            
            if (signals.length > 0) {
                ractive.set('devicesAvailability', true);
                availability = DevicesAvailabilityComponent();
                availability.init('#devices-availability');
            }
        });
        /*
        const promise = getDcData('/data/asset-records.json');
        powerFactor.init('#power-factor', promise);

        console.log("</summary-asset-operator>");
        */
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
        // alerts.clean();
        if (availability) availability.clean();
        //powerFactor.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}