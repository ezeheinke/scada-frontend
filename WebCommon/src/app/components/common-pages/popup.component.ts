import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';
import { CompactScadaService } from '../../services/compact-scada.service';

export function PopupComponent() {
    
    const stateContainer = StateContainerService();
    const compactScada = CompactScadaService();
    let unsubscribes = [];
    let ractive: IRactive = undefined; 
    
    const ractiveData = {
        el: undefined,
        template: `
               <div>
                    <div class="popUpTitle">
                        <span><img src="{{icon}}"/> {{assetName}}</span>
                    </div>
                    <div class="popUpBody">
                        {{#popupSignals}}
                            <span>{{name}}: {{values[signalName]}}</span><br>
                        {{/popupSignals}}
                    </div>
               </div>
            `,
        data: {
            icon: undefined,
            assetName :undefined,            
            popupSignals: [],
            values : {}
        }
    };    


    function init(elem,mapMarker) {

        const popupSignals = stateContainer.Static.Data.views['CCR']['map'].signals;
        
        ractiveData.el = elem;
        ractiveData.data.popupSignals = popupSignals;
        var folderUrl = mapMarker.options.icon.options.iconUrl.split("/");
        ractiveData.data.icon  = "/" + folderUrl[1] + "/" + folderUrl[2] + "/" + folderUrl[3] + "/" +"ico_"+ (elem.split("_")[0].toLowerCase()) + ".png"
        ractiveData.data.assetName = mapMarker.displayName;
        
        ractive = new Ractive(ractiveData);
        
        popupSignals.forEach((popupSignal)=> {
            //init reactive values
            ractive.get('values')[popupSignal.signalName] = '';
            unsubscribes.push(compactScada.subscribe(`^${mapMarker.index}\.${popupSignal.signalName}$`, function(signals: Signal[]) {
                //we expect one signal..
                if (signals !== undefined && signals.length > 0) {

                    const signal = signals[0];
                    if (signal.Name.includes(mapMarker.index)) {

                        ractive.get('values')[popupSignal.signalName] = formatSignal(signal,popupSignal);
                        ractive.update();
                        mapMarker.getPopup().setContent(ractive.toHTML());

                    }
                }
            
            }));
        });

    }

    function formatSignal(signal, signalColumn){        
                
        const value = signal && signal.Value;
        if (value === undefined || signalColumn === undefined) return '';

        const multiply = signalColumn.multiply !== undefined ? signalColumn.multiply : 1;
        const decimals = signalColumn.decimals !== undefined ? signalColumn.decimals : 0;        
        return (value*multiply).toFixed(decimals);
    }

    function toHTML() {
        ractive.toHTML();
    }
    function clean () {
        unsubscribes.forEach(unsubscribe => unsubscribe());  
        ractive.teardown();
    }

    return {
        init,
        clean,
        toHTML
    };
}