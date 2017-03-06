import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';
import { CompactScadaService } from '../../services/compact-scada.service';
import { ModalWindowService } from '../../services/modal-window.service';
import { UserAccessesService } from '../../services/user-accesses.service';

const stateContainer = StateContainerService();
const compactScada = CompactScadaService();
const modalWindow = ModalWindowService();
const permissions = UserAccessesService();

export function InputSignalsComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `            
            {{#inputSignals: index}}                        
                <div class="col-sm-3 {{index !== 0 ? 'col-sm-offset-3' : ''}} info-item">
                    <div class="title-small">
                        {{name}} <span class="class-text">{{units ? '('+units+')' : ''}}</span>
                    </div>
                    <div class="info-number">                     
                        <span class="{{controlPermission ? 'editable' : ''}} {{editMode ? 'hidden' : ''}}" 
                              on-click="editSignal:{{this}}">{{signal ? signal.Value.toFixed(decimals !== undefined ? decimals : 0) : '_'}}
                        </span>
                        <input class="{{editMode ? '' : 'hidden'}}"
                               type="text" 
                               value="{{newValue}}"
                               on-change="writeSignal:{{this}}"
                               on-blur="quitEditMode:{{this}}">
                    </div>
                </div>
            {{/inputSignals}}
        `,
        data: {
            inputSignals: [],
            controlPermission: false
        }
    };

    let unsubcribe = undefined;
    
    function init(elem, inputSignals) {
        console.log("<input-signals>");
        ractiveData.el = elem;
        ractiveData.data.controlPermission = permissions.hasAccess('control');
        ractive = new Ractive(ractiveData);

        const assetId = stateContainer.read('view');
        const asset = stateContainer.Static.Data.views[assetId];

        inputSignals = inputSignals.map(inputSignal => {
            inputSignal.oldValue = undefined;
            inputSignal.newValue = undefined;
            return inputSignal;
        });
        ractive.set('inputSignals', inputSignals);

        ractive.on("editSignal", function(event, inputSignal){
            if(permissions.hasAccess('control')){
                inputSignal.editMode = true;
                inputSignal.oldValue = inputSignal.signal.Value;
                inputSignal.newValue = inputSignal.oldValue;
                ractive.update();
                const inputElement = event.node.parentElement.children[1];
                inputElement.focus();
            }
        });

        ractive.on("writeSignal", function(event, inputSignal){
            const oldValue = inputSignal.oldValue;
            const newValue = parseFloat(inputSignal.newValue);
            
            if(newValue !== oldValue) {
                modalWindow.confirm(
                    `Are you sure to set ${inputSignal.name} to ${newValue}${inputSignal.units?' '+inputSignal.units:''}?`,
                    function confirm() {
                        const signalName = assetId+'.'+inputSignal.writeSignal;
                        compactScada.setSignal(signalName, newValue)
                        .then(response => {
                            console.info(`Signal ${signalName} changed to value ${newValue}`);
                        });
                    }
                );
            }
        });

        ractive.on('quitEditMode', function(event, inputSignal){
            inputSignal.editMode = false;
            ractive.update();
        });        
        
        const signalNames = inputSignals.map(inputSignal => inputSignal.signalName).join('|');

        unsubcribe = compactScada.subscribe(`^${assetId}\.(${signalNames})`, function(signals: Signal[]) {

        inputSignals = inputSignals.map(function(inputSignal, index) {
            const signal = signals.filter(signal => signal.Name === `${assetId}.${inputSignal.signalName}`)[0];
            inputSignal.signal = signal;
            if (signal !== undefined){
                ractive.animate('inputSignals['+index+'].signal.Value', signal.Value);
            }    
            return inputSignal;
        });

        });

        console.log("</input-signals>");
    }
    
    function clean() {
        unsubcribe();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}