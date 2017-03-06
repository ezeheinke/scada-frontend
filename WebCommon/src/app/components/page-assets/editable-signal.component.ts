import Ractive from 'ractive';
import * as RactiveTooltip from 'ractive-tooltip';
import * as RactiveEventsKeys from 'ractive-events-keys';

import { CompactScadaService } from '../../services/compact-scada.service';
import { ResourcesService } from '../../services/resources.service';
import { ModalWindowService } from '../../services/modal-window.service';
import { UserAccessesService } from '../../services/user-accesses.service';

const compactScada = CompactScadaService();
const resources = ResourcesService();
const modalWindow = ModalWindowService();
const permissions = UserAccessesService();

export function EditableSignalComponent() {             
    
    let ractive: IRactive = undefined;    
    
    const ractiveData = {
        el: undefined,
        decorators: { tooltip: RactiveTooltip.default },
        events: { 
            enter: RactiveEventsKeys['enter'],
            escape: RactiveEventsKeys['escape']
        },
        template: `
            {{#if tableColumn.writeSignal && controlPermission}}
                <span 
                      decorator='tooltip:{{tableColumn.infoSignalName}}: {{signals[tableColumn.infoSignal].Value}} - Click to apply.'
                      on-click="editSignal"
                      class="clickable {{editMode ? 'hidden' : ''}}">
                    {{format(signals[tableColumn.signalName], tableColumn)}}
                </span>
                <input class="{{editMode ? '' : 'hidden'}}"
                       type="text" 
                       value="{{newValue}}"
                       on-enter="writeSignal"
                       on-escape="quitEditMode"
                       on-blur="quitEditMode">
            {{else}}
                <span decorator='tooltip:{{tableColumn.infoSignalName}}: {{signals[tableColumn.infoSignal].Value}}'>
                    {{format(signals[tableColumn.signalName], tableColumn)}}
                </span>
            {{/if}}
        `,
        data: {
            controlPermission: false,
            editMode: false,
            newValue: undefined,
            tableColumn: {},
            signals: {},
            format
        }
    };


    let unsubscribe = undefined;
    
    function init(elem, asset, tableColumn) {
        // console.log("<editable-signal>");
        ractiveData.el = elem;        
        ractiveData.data.tableColumn = tableColumn;
        ractiveData.data.signals = asset.signals;
        ractiveData.data.controlPermission = permissions.hasAccess('control');
        ractive = new Ractive(ractiveData);

        ractive.on("editSignal", function(event){
            const currentSignalValue = asset.signals[tableColumn.signalName] ? asset.signals[tableColumn.signalName].Value : undefined;
            ractive.set('newValue', currentSignalValue);
            ractive.set('editMode', true);            
            const inputElement = event.node.parentNode.children[1];
            inputElement.focus();
        });

        ractive.on('quitEditMode', function(event){
            ractive.set('editMode', false);
        });

        ractive.on("writeSignal", function(event){
            const newValue = ractive.get('newValue');             
            
            modalWindow.confirm(
                `Are you sure to set signal ${asset.id}.${tableColumn.writeSignal} to ${newValue}?`,
                function confirm() {
                    const signalName = asset.id+'.'+tableColumn.writeSignal;
                    compactScada.setSignal(signalName, newValue)
                    .then(response => {
                        console.info(`Signal ${signalName} changed to value ${newValue}`);
                    });
                }
            );
        });

        unsubscribe = resources.subscribeToAssets(assets => {                                
            ractive.update();
        })

        // console.log("</editable-signal>");
    }

    function format(signal, tableColumn){
        const value = signal && signal.Value;
        if (value === undefined) return '';
        const multiply = tableColumn.multiply !== undefined ? tableColumn.multiply : 1;
        const decimals = tableColumn.decimals !== undefined ? tableColumn.decimals : 0;         
        return (value*multiply).toFixed(decimals);
    }    
    
    function clean() {
        unsubscribe()
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}

/*
<table class="table">
<thead>
    <tr>
        <th>Availability</th>
        <th>Name</th>
        {{#tableColumns}}
        <th>{{name}}</th>
        {{/tableColumns}}
        <th>Alerts</th>
    </tr>
</thead>
<tbody>
    {{#assets}}
    <tr>
        <td>
            <span class="color-block-success availability-{{getAvailability(signals)}}">                            
                {{getAvailabilityName(signals)}}
            </span>
        </td>
        <td class="large">
            {{#if name}}
            <a href="#/assets/{{id}}">{{name}}</a>
            {{else}}
            <span>{{id}}</span>
            {{/if}}
        </td>
        {{#tableColumns}}
        <td>{{signals[signalName].Value}}</td>
        {{/tableColumns}}
        <td>-</td>
    </tr>
    {{/assets}}                   
</tbody>
</table>
 */