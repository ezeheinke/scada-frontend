import Ractive from 'ractive';
import * as RactiveTooltip from 'ractive-tooltip';
import * as utils from '../../utils';

declare var moment: any;
declare var $: any;

import { UserAccessesService } from '../../services/user-accesses.service';
import { StateContainerService } from '../../services/state-container.service';
import { ResourcesService } from '../../services/resources.service';
import { EventCheckerService } from '../../services/event-checker.service';
//import { DevicesAlertsComponent } from './devices-alerts.component';

//const DevicesAlerts = DevicesAlertsComponent();
const stateContainer = StateContainerService();
const resources = ResourcesService();
const permissions = UserAccessesService();

export function DevicesTableComponent() {             
    
    let ractive: IRactive = undefined;

    const parentRow = `
    <tr class="row clickable" data-target=".row{{parentIndex}}">
        <td>
            <span class="parent">{{name}}</span>
            <span id="arrow-{{parentIndex}}" class="arrow-down parent arrow"><i class="icon dripicons-chevron-down"></i></span>
        </td>
        {{#tableColumns}}
            <th>
            {{#if parentSumatory}}
                {{getParentSignalSumatory(../../elements[parentIndex], signalName, this)}}
            {{elseif parentAverage}}
                {{getParentSignalAverage(../../elements[parentIndex], signalName, this)}}
            {{/if}}
            </th>
        {{/tableColumns}} 
        <td></td>
    </tr>
    `;

    const deviceRow = `
    <tr class="row collapse in row{{parentIndex}} child-row">
        <td>            
            <span>{{name}}</span>
        </td>
        {{#tableColumns}}                    
            {{>deviceSignalCell}}
        {{/tableColumns}}
        <td class="elements-table-cell" ></td>
    </tr>
    `;

    const deviceSignalCell = `
        <td class="{{excludeQualityStyle?'':getSignalQualityClass(signals, signalName)}}">
        <span class="{{isOutOfService(signals, signalName)?'hide':''}}" decorator='tooltip:{{getSignalInfo(signals, signalName)}}'>
            {{formatSignal(signals, signalName, this)}}
        </span>        
    `;    
    
    const ractiveData = {
        el: undefined,
        modifyArrays: false,
        partials: {
            parentRow,
            deviceRow,
            deviceSignalCell
        },
        decorators: {
            tooltip: RactiveTooltip.default
        },
        //components: { ElementAlerts: DevicesAlerts },
        template: `
            <table id="devices-table-list" class="table table-responsive custom-table-with-theme">
            <thead id="devices-header">
                <tr class="row">
                    <th>Device</th>
                    {{#tableColumns}}
                        <th>
                            {{name}}                            
                        </th>
                    {{/tableColumns}}
                    <th>Alerts</th>
                </tr>
            </thead>
            <tbody id="devices-body">
                {{#each elements: parentIndex}}
                    {{>parentRow}}
                    {{#children}}
                        {{>deviceRow}}
                    {{/children}}
                {{/each}}
            </tbody>
        </table>
        `,
        data: {
            elements: [],
            tableColumns: [],
            getSignalInfo,
            getSignalQualityClass,
            getParentSignalAverage,
            getParentSignalSumatory,
            formatSignal,
            isOutOfService
        }
    };
    
    let unsubscribes = [];    
    let inputSignals = [];
    let devicesAlerts = [];

    function init(elem, elements, columns, deviceType, assetId) {
        console.log("<devices-table>");
        
        ractiveData.el = elem;        
        ractiveData.data.elements = elements;
        ractiveData.data.tableColumns = columns; 
        ractive = new Ractive(ractiveData);
        let devices = new Array();
        elements.forEach(element => element.children.forEach(child => devices.push(child)));  
        unsubscribes.push(            
            resources.subscribeToDevices(devices => {                
                setParents(assetId, deviceType);
            }),
            resources.subscribeSignalsToDevices(getSignalNames(columns), resources.getCurrentAsset().id, deviceType) // for alerts
        );

    function setParents(assetId: string, deviceType: string){
        let devices = resources.getDevices(resources.getAsset(assetId));
        ractive.set('elements', eval('devices[0].' + deviceType + '.elements')); 
        utils.fixTable('#page-view', '#park-devices-table', 1, 1);   
    }

    $('tr.row.clickable').click(function() {
        var target  =this.getAttribute('data-target');
        var elems  = $('table > tbody > ' + target);
        var ind = target.substring(4);
        if($("#arrow-" + ind).hasClass("arrow-down")){
            $("#arrow-" + ind).removeClass("arrow-down");
            $("#arrow-" + ind).addClass("arrow-right");
        }else{
            $("#arrow-" + ind).removeClass("arrow-right");
            $("#arrow-" + ind).addClass("arrow-down");
        }
        elems.each(function(){
            $(this).slideToggle('slow');            
        });
    });
        console.log("</devices-table>");
    }



    let unsubscribeSignalColumns = undefined;   

    function loadColumns(tableColumns, assetId, deviceType){
        if (ractive){
            const signalNames = getSignalNames(tableColumns);
        
            if (unsubscribeSignalColumns)
                unsubscribeSignalColumns();
            unsubscribeSignalColumns = resources.subscribeSignalsToDevices(signalNames, assetId, deviceType);
        }
    }

   function formatSignal(signals, signalName, tableColumn){        
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        if (value === undefined || tableColumn === undefined) return '';
        const multiply = tableColumn.multiply !== undefined ? tableColumn.multiply : 1;
        const decimals = tableColumn.decimals !== undefined ? tableColumn.decimals : 0;        
        return (value*multiply).toFixed(decimals);
    }

    const signalQualities = {
      0xC0: "GOOD",
      0x40: "UNCERTAIN",
      0x1C: "OUT_OF_SERVICE",
      'default': "BAD"
    }

    function getSignalInfo(signals, signalName){
        const signal = signals && signals[signalName];
        if (!signal) return "Signal no available";
        const quality = signalQualities[signal.Quality] || signalQualities['default']; 
        return moment(signal.Timestamp).format("YYYY-MM-DD HH:mm:ss") + ' - ' + quality;
    }

    function isOutOfService(signals, signalName) {
        const signal = signals && signals[signalName];
        if (!signal) return false;
        const qualityName = signalQualities[signal.Quality] || signalQualities['default'];
        return qualityName === 'OUT_OF_SERVICE';

    }

    function getSignalQualityClass(signals, signalName) {
        const signal = signals && signals[signalName];
        if (!signal) return '';
        const quality = signalQualities[signal.Quality] || signalQualities['default'];
        const minutesLastUpdate = moment().diff(moment(signal.Timestamp), 'minutes');
        if ( quality!== 'OUT_OF_SERVICE'  &&  (quality === 'BAD' || minutesLastUpdate > 5) ) {
            return 'signal-bad-quality';
        }
        return '';
    }

    function getParentSignalSumatory(element, signalName, tableColumn) {    
        var sumatory = 0;
        element.children
        .forEach(child => {       
            if (child.signals && child.signals[signalName] && child.signals[signalName].Value !== null){
                sumatory += child.signals[signalName].Value;
            }
        });
        const simulatedSignal = {
            Value: sumatory
        };        
        return formatSignal({[signalName]: simulatedSignal}, signalName, tableColumn);
    }

    function getParentSignalAverage(element, signalName, tableColumn) {    
        var sumatory = 0;
        var amount = 0;
        element.children
        .forEach(child => {         
            if (child.signals && child.signals[signalName] && child.signals[signalName].Value !== null){
                sumatory += child.signals[signalName].Value;
                amount++;
            }
        });
        let average: any = sumatory / amount;
        average = isNaN(average) ? '' : average;
        const simulatedSignal = {
            Value: average
        };
        return formatSignal({[signalName]: simulatedSignal}, signalName, tableColumn);
    }

    function getSignalNames(signals){
        let signalNames = [];

        signals
        .forEach(signal => {
            signalNames.push(signal.signalName);
            if (signal.additionalInfo) 
                signalNames.push(signal.additionalInfo);  
        });

        return signalNames;
    }

    function clean() {
        if (unsubscribeSignalColumns) unsubscribeSignalColumns();
        //devicesAlerts.forEach(deviceAlerts => deviceAlerts.clean());
        unsubscribes.forEach(unsubscribe => unsubscribe());        
        ractive.teardown();
    }
    
    return {
        init,
        loadColumns,
        clean
    };
}