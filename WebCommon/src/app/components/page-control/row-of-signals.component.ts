import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';
import { CompactScadaService } from '../../services/compact-scada.service';

export function RowOfSignalsComponent() {             
    
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    const compactScada = CompactScadaService();
    
    const ractiveData = {
        el: undefined,
        template: `            
            {{#displaySignals}}
                <div class="col-sm-2 info-item">
                    <div class="title-small">
                        {{name}}
                    </div>
                    <div class="info-number">
                        {{signal ? signal.Value.toFixed(decimals !== undefined ? decimals : 0) : '_'}}<span class="small-text"> {{units}}</span>
                    </div>
                </div>
            {{/displaySignals}}
        `,
        data: {
            displaySignals: []
        }
    };

    //let unsubcribe = undefined;
    let unsubscribes = [];

    function init(elem, displaySignals: DisplaySignal[]) {
        console.log("<row-of-signals>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        ractive.set('displaySignals', displaySignals);

        const assetId = stateContainer.read('view');
        const asset = stateContainer.Static.Data.views[assetId];


        
        
        const signalNames = displaySignals.map(displaySignal => displaySignal.signalName).join('|');
        
        
        const setpointReceived = displaySignals.find(displaySignal => displaySignal.signalName === 'SetpointReceived');
        if (setpointReceived !== undefined ) {

            unsubscribes.push(compactScada.subscribe('^CCR\.RoleApplied$'+'|'+`^${assetId}\.(CECOELSetpointReceived|CECORESetpointReceived)`, signals => {
                    
                    const roleApplied = signals.filter(signal => signal.Name === 'CCR.RoleApplied')[0].Value;
                    const CECOEL = signals.filter(signal => signal.Name === `${assetId}.CECOELSetpointReceived`)[0];
                    const CECORE = signals.filter(signal => signal.Name === `${assetId}.CECORESetpointReceived`)[0];                
                    const signal = roleApplied === 1 ? CECORE : CECOEL;
                    setpointReceived.signal  = signal;   
                    ractive.animate('displaySignals['+displaySignals.indexOf(setpointReceived)+'].signal.Value', signal.Value);
                    
                    ractive.update();  
                })
            );

        }

        unsubscribes.push(compactScada.subscribe(`^${assetId}\.(${signalNames})`, function(signals: Signal[]) {

                displaySignals.forEach(function(displaySignal, index) {
                    const signal = signals.filter(signal => signal.Name === `${assetId}.${displaySignal.signalName}`)[0];
                    if (signal !== undefined){                   
                        displaySignal.signal = signal;
                        ractive.animate('displaySignals['+index+'].signal.Value', signal.Value);
                    }
                });
                ractive.update();            
                
            })
        );

        console.log("</row-of-signals>");
    }


    
    function clean() {
        //unsubcribe();
        unsubscribes.forEach(unsubcribe => unsubcribe());
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}