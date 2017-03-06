import Ractive from 'ractive';
import * as RactiveTooltip from 'ractive-tooltip';
import * as RactiveEventsKeys from 'ractive-events-keys';

import { CompactScadaService } from '../../services/compact-scada.service';

declare var moment: any;
const compactScada = CompactScadaService();

export function EditableItemRowComponent() {             
    
    let ractive: IRactive = undefined;    
    
    const ractiveData = {
        el: undefined,
        decorators: { tooltip: RactiveTooltip.default },
        events: { 
            enter: RactiveEventsKeys['enter'],
            escape: RactiveEventsKeys['escape']
        },
        template: `
        {{#item}}
        <td>{{Name}}</td>
        <td><span 
                   decorator='tooltip:Click to set new value.'
                   on-click="editValue"
                   class="clickable {{editMode ? 'hidden' : ''}}">
                   {{Value}}
            </span>
            <input class="{{editMode ? '' : 'hidden'}}"
                   type="text" 
                   value="{{newValue}}"
                   on-enter="writeValue"
                   on-escape="quitEditMode"
                   on-blur="quitEditMode">
        </td>                   
        <td>{{signalTime(Timestamp)}}</td>
        <td>{{translateSignalQuality(Quality)}}</td>
        {{/item}}

        `,
        data: {
            editMode: false,
            newValue: undefined,
            translateSignalQuality,
            signalTime,
            item: undefined
        }
    };


    let unsubscribe = undefined;
    
    function init(elem, item) {

        ractiveData.el = elem;        
        ractive = new Ractive(ractiveData);
        
        ractive.set('item',item);

        ractive.on("editValue", function(event){
            const currentSignalValue = item.Value;
            ractive.set('newValue', currentSignalValue);
            ractive.set('editMode', true);
          
            const inputElement = event.node.parentNode.children[1];
            inputElement.focus();
        });

        ractive.on('quitEditMode', function(event){
            
            ractive.set('editMode', false);
        });

        ractive.on("writeValue", function(event){
            const newValue = ractive.get('newValue');             
                   
            compactScada.setSignal(item.Name, newValue)
            .then(response => {
                ractive.set('editMode', false); 

            });
        });

        
        unsubscribe = compactScada.subscribe(`${item.Name}$`, function(signals: Signal[]) {                    
            
            if (signals != undefined && signals.length > 0) {

                const item = signals[0]
                ractive.set('item',item);
            }
        });    

    }

    const opcQualities = {
        0xC0: "GOOD",
        0x40: "UNCERTAIN",
        'default': "BAD"
    }
    
    function translateSignalQuality(quality) {
        return opcQualities[quality] || opcQualities['default'];
    }

    function signalTime(timestamp) {
        return moment(timestamp).format("YYYY-MM-DD HH:mm:ss");
    }

       
    function clean() {
        unsubscribe();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}
