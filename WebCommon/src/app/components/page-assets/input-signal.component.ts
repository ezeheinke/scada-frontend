import Ractive from 'ractive';

import * as RactiveTooltip from 'ractive-tooltip';
import * as RactiveEventsKeys from 'ractive-events-keys';

import { StateContainerService } from '../../services/state-container.service';
import { CompactScadaService } from '../../services/compact-scada.service';
import { ModalWindowService } from '../../services/modal-window.service';

const stateContainer = StateContainerService();
const compactScada = CompactScadaService();
const modalWindow = ModalWindowService();

export function InputSignalComponent() {

    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        decorators: { tooltip: RactiveTooltip.default },
        events: { 
            enter: RactiveEventsKeys['enter']
        },
        template: `            
             {{#if tableColumn.writeSignal && controlAvailable}}
                    <div class="input-signal">                     
                        <span 
                            decorator='tooltip:Click to enter new value'
                            class="editable {{editMode ? 'hidden' : ''}}" on-click="editSignal:{{this}}">
                              --
                        </span>
                        <input class="{{editMode ? '' : 'hidden'}}"
                               type="text" 
                               value="{{newValue}}"
                               on-enter="writeSignal:{{this}}"
                               on-blur="quitEditMode:{{this}}">
                    </div>
             {{else}}
                   <span>
                    N/A
                </span>  
             {{/if}}
        `,
        data: {
            controlAvailable: false,
            newValue: undefined,
            tableColumn: {},
            signals: {},
            formatSignal     
        }
    };

    let unsubscribe = undefined;
    
    function init(elem, asset, tableColumn) {

        ractiveData.el = elem;        
        ractiveData.data.tableColumn = tableColumn;
        ractiveData.data.controlAvailable = asset.controlAvailable;
        ractiveData.data.signals = asset.signals;
        
        const actualAsset = asset;

        ractive = new Ractive(ractiveData);

        ractive.on("editSignal", function(event, input){
            
            input.editMode = true;
            input.oldValue = input.signals[input.tableColumn.signalName].Value;
            input.newValue = formatSignal(input.signals,input.tableColumn.signalName,input.tableColumn);
            ractive.update();
            const inputElement = event.node.parentElement.children[1];
            inputElement.focus();
            
        });

        ractive.on("writeSignal", function(event, input){
            const oldValue = input.signals[input.tableColumn.signalName].Value;;
            const newValue = parseFloat(input.newValue);
            
            if(newValue !== oldValue) {
                modalWindow.confirm(
                    `Are you sure to set ${input.tableColumn.writeSignal} to ${newValue} ${input.tableColumn.units?' '+input.tableColumn.units:''} ?`,
                    function confirm() {
                        const signalName = actualAsset.id+'.'+input.tableColumn.writeSignal;
                        compactScada.setSignal(signalName, inverseFormat(newValue,input.tableColumn))
                        .then(response => {
                            console.info(`Signal ${signalName} changed to value ${inverseFormat(newValue,input.tableColumn)}`);
                        });
                    }
                );
            }
        });

        ractive.on('quitEditMode', function(event, inputSignal){
                inputSignal.editMode = false;
                ractive.update();
        }); 

    }

    function inverseFormat(value,tableColumn) {

        const factor = tableColumn.multiply !== undefined ? tableColumn.multiply : 1;
        return value / factor;
    }

    function formatSignal(signals, signalName, tableColumn){        
        const signal = signals && signals[signalName];        
        const value = signal && signal.Value;
        if (value === undefined || tableColumn === undefined) return '';
        const multiply = tableColumn.multiply !== undefined ? tableColumn.multiply : 1;
        const decimals = tableColumn.decimals !== undefined ? tableColumn.decimals : 0;        
        return (value*multiply).toFixed(decimals);
    }

    function clean() {

         ractive.teardown();
    }

    
    return {
        init,
        clean
    };

}