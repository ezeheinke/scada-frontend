import Ractive from 'ractive';
import * as RactiveTooltip from 'ractive-tooltip';
import * as utils from '../../utils';

declare var moment: any;
declare var $: any;

//import { EditableSignalComponent } from './editable-signal.component';
import { InputSignalComponent } from './input-signal.component';
import { AssetAlertsComponent } from './asset-alerts.component';

const AssetAlerts = AssetAlertsComponent();

import { UserAccessesService } from '../../services/user-accesses.service';
import { StateContainerService } from '../../services/state-container.service';
//import { CompactScadaService } from '../../services/compact-scada.service';
import { ResourcesService } from '../../services/resources.service';
import { EventCheckerService } from '../../services/event-checker.service';

const stateContainer = StateContainerService();
//const compactScada = CompactScadaService();
const resources = ResourcesService();
const permissions = UserAccessesService();

export function AssetsTableComponent() {     
    
    let ractive: IRactive = undefined;  

    const nodeRow = `
    <tr class="row clickable"  data-target=".row{{nodeIndex}}">
        <td>
            <span class="parent">{{name}}</span>
            <span id="arrow-{{nodeIndex}}" class="arrow-down parent arrow"><i class="icon dripicons-chevron-down"></i></span>
        </td>
        {{#tableColumns}}
            <th>
            {{#if nodeSumatory}}
                {{getNodeSignalSumatory(../../nodes[nodeIndex], signalName, this)}}
            {{elseif nodeAverage}}
                {{getNodeSignalAverage(../../nodes[nodeIndex], signalName, this)}}
            {{/if}}
            </th>
        {{/tableColumns}} 
        <td></td>
    </tr>
    `;

    const assetRow = `
    <tr class="row collapse in row{{nodeIndex}} child-row background-{{signals && signals['Availability'] ? signals['Availability'].Value : 'disconnected'}}">
        <td>
            <span class="type-icon icon-{{id ? id.split('_')[0] : ''}}"></span>
            {{#if configured}}
            <a href="#/assets/{{id}}">{{name}}</a>
            {{else}}
            <span>{{name}}</span>
            {{/if}}
        </td>
        {{#tableColumns}}                    
            {{>assetSignalCell}}
        {{/tableColumns}}
        <td class="alerts-table-cell" ><AssetAlerts asset='{{this}}'></td>
    </tr>
    `;

    const assetSignalCell = `
     {{#if inputSignal}}
        <td>
        <div id="input-signal-{{id}}">
        </div>
        </td>
    {{else}}
        <td class="{{excludeQualityStyle?'':getSignalQualityClass(signals, signalName)}} {{getSetPointAppliedStyle(signals,this,nominalPower)}} {{getSetPointReceivedStyle(signals,this)}} {{getActivePowerStyle(signals, this)}}">
        <span class="{{isOutOfService(signals, signalName)?'hide':''}}" decorator='tooltip:{{getSignalInfo(signals, signalName)}}'>
            {{formatSignal(signals, signalName, this,asset)}}
        </span>
        {{#if showBar}}
            <div class="data-bar">
                <span style="width: {{getPercentage(signals,signalName, nominalPower)}}%;
                    background-color: {{getBarColor(signals,signalName, nominalPower)}}">
                </span>
            </div>
        {{/if}}
        </td>
    {{/if}}
    `;    
    
    const ractiveData = {
        el: undefined,
        modifyArrays: false,
        partials: {
            nodeRow,
            assetRow,
            assetSignalCell
        },
        decorators: {
            tooltip: RactiveTooltip.default
        },
        components: { AssetAlerts: AssetAlerts },
        template: `
            <table id="assets-table-list" class="table table-responsive custom-table-with-theme">
            <thead id="assets-header">
                <tr class="row">
                    <th>Nodes/Assets</th>
                    {{#tableColumns}}
                        <th class="clickable" on-click="sortNodes:{{signalName}}">
                            {{name}}
                            {{#if sorter === signalName}}
                            <i class="icon dripicons-chevron-down"></i>
                            {{/if}}
                        </th>
                    {{/tableColumns}}
                    <th>Alerts</th>
                </tr>
            </thead>
            <tbody id="assets-body">
                {{#each nodes: nodeIndex}}
                    {{>nodeRow}}

                    {{#sets}}
                        {{#assets: assetIndex}}
                            {{>assetRow}}
                        {{/assets}}
                    {{/sets}}

                {{/each}}
            </tbody>
        </table>
        `,
        data: {
            nodes: [],
            sortNodes,
            sorter: undefined,
            tableColumns: [],
            getNodeSignalSumatory,
            getNodeSignalAverage,
            getSignalInfo,
            getSignalQualityClass,
            formatSignal,
            getPercentage,
            getBarColor,
            getActivePowerStyle,
            getSetPointReceivedStyle,
            getSetPointAppliedStyle,
            isOutOfService
        }      
    };

    let unsubscribes = [];
    //let editableSignals = [];
    let inputSignals = [];
    let assetsAlerts = [];
    
    function init(elem) {
        console.log("<assets-table>");
        ractiveData.el = elem;        
        ractiveData.data.nodes = resources.getNodes();
        ractive = new Ractive(ractiveData);
        const assets = resources.getAssets();      
        
        unsubscribes.push(            
            resources.subscribeToAssets(assets => {                
                setNodes();
            }),
            resources.subscribeSignalsToAssets(["Availability", "GridConnection", "SetpointMotive"]) // for alerts
        );

        ractive.on('sortNodes', function(event, sorter){
            ractive.set({sorter});
            setNodes();
        });

        function setNodes(){
            let nodes = resources.getNodes();
            const sorter = ractive.get('sorter');
            // nodes = sorter ? sortNodes(nodes, sorter) : nodes;                
            ractive.set('nodes', nodes);
            utils.fixTable('#page-view', '#assets-table', 2, 1, '#tableSelector');
        }
        console.log("</assets-table>");

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
    }

    function sortNodes(nodes, sorter){    
        nodes = nodes.slice();
        // get the sorter value
        nodes.forEach(node => {
            const sets = node.sets;
            const sorterValue = sets.reduce((accum, set) => {                
                const sorterValue = set.assets.reduce((accum, asset) => {
                    const sorterValue = asset.signals[sorter] && asset.signals[sorter].Value !== undefined ? asset.signals[sorter].Value : 0;                     
                    asset['sorterValue'] = sorterValue;
                    return accum + sorterValue;
                }, 0);              
                set['sorterValue'] = sorterValue;
                return accum + sorterValue;
            }, 0);
            node['sorterValue'] = sorterValue;
        });
        // order by sorter value
        nodes = order(nodes);
        nodes.forEach(node => {
            node.sets = order(node.sets);
            node.sets.forEach(set => set.assets = order(set.assets));
        });
        // debugger
        return nodes;
    }

    function order(_array){
        let array = _array.slice();
        array.sort((left, right) => left.name > right.name ? -1 : 1 );
        array.sort((left, right) => left.sorterValue > right.sorterValue ? -1 : 1 );
        return array;
    }

    let unsubscribeSignalColumns = undefined;    
    function loadColumns(tableColumns){        
        if (ractive){
            const assets = resources.getAssets();
            
            tableColumns = tableColumns
                .filter(column => column.needControlPrivilege === undefined 
                    ||column.needControlPrivilege === false || column.needControlPrivilege === permissions.hasAccess('control') )
            
            const signalNames = getSignalNames(tableColumns);

            if (unsubscribeSignalColumns) unsubscribeSignalColumns();
            unsubscribeSignalColumns = resources.subscribeSignalsToAssets(signalNames);

            ractive.set('tableColumns', tableColumns);
            
            if (tableColumns.find(tableColumn => tableColumn.inputSignal) ) {
                initInputSignals(assets,tableColumns);
            }
            ractive.set('sorter', tableColumns[0].signalName);
        }
    }

    function initInputSignals(assets,tableColumns) {

        const tableColumn = tableColumns.find(tableColumn => tableColumn.inputSignal);
        assets
        .forEach(asset => {
            const inputSignal = InputSignalComponent();
            inputSignal.init(`#input-signal-${asset.id}`, asset, tableColumn);
            inputSignals.push(inputSignal);
        });
    }

 
    function getPercentage(signals, signalName,  nominalPower){
        
        const signal = signals && signals[signalName];        
        const value = signal && signal.Value;
        if (value === undefined || signal === undefined) return 0;

        var numerator = signals[signalName].Value;
        
        var percentage = ( nominalPower !== 0) ? (numerator/ nominalPower) * 100 : 0;
        return Math.abs( Math.floor(percentage) );
    }

    function getBarColor(signals, signalName,  nominalPower){
        var percentage = getPercentage(signals, signalName,  nominalPower);
        var hueMin = 10;
        var hueMax = 130;
        var hueNegative = 360;
        var hue = 0;

        if (percentage<0) hue = hueNegative;
        else if (percentage>100) hue = hueMax;
        else {
            hue = hueMin + (hueMax-hueMin) * percentage/100;
        }
                
        return "hsla("+hue+", 70%, 50%, 1)";
    }

    function getSignalNames(tableColumns){
        let signalNames = [];

        tableColumns
        .forEach(column => {
            signalNames.push(column.signalName);
            //if (column.infoSignal) signalNames.push(column.infoSignal);
            if (column.additionalInfo) signalNames.push(column.additionalInfo);  
        });

        return signalNames;
    }

    function getSetPointReceivedStyle(signals, tableColumn) {

        if (tableColumn !== undefined && tableColumn.signalName === "SetpointReceived") {
            let setPointMotive = signals["SetpointMotive"];
            if (setPointMotive !== undefined && setPointMotive.Value !== 0 ) {
                return " alert-warning";
            } 
        }
        return "";
    }

    function getSetPointAppliedStyle(signals, tableColumn,nominalPower) {
        if (tableColumn !== undefined && tableColumn.signalName === "SetpointApplied") {
            let setPointApplied = signals["SetpointApplied"];
            if (setPointApplied !== undefined && setPointApplied.Value !== 0 && setPointApplied.Value < nominalPower ) {
                return " alert-warning";
            } 
        }
        return "";
    }


    function getActivePowerStyle(signals, tableColumn) {
        
        if (tableColumn !== undefined && tableColumn.signalName === "ActivePower") {
            let activePower = signals["ActivePower"];
            let setPointReceived = signals["SetpointReceived"];
            
            if (activePower !== undefined && setPointReceived !== undefined && setPointReceived.Value !== 0 ) {
                if (activePower.Value > setPointReceived.Value * 1.05)	{
                    return " alert-danger";
                }
                else if (activePower.Value > setPointReceived.Value )	{
                    return " alert-warning";
                }
            }   

        }
        return "";
        

    }

    function formatSignal(signals, signalName, tableColumn){        
        const signal = signals && signals[signalName];        
        const value = signal && signal.Value;
        if (value === undefined || tableColumn === undefined) return '';
        const multiply = tableColumn.multiply !== undefined ? tableColumn.multiply : 1;
        const decimals = tableColumn.decimals !== undefined ? tableColumn.decimals : 0;        
        return (value*multiply).toFixed(decimals);
    }

    function getNodeSignalSumatory(node, signalName, tableColumn) {    
        var sumatory = 0;
        node.sets
        .forEach(set => {
            set.assets
            .forEach(asset => {        
                if (asset.signals && asset.signals[signalName] && asset.signals[signalName].Value !== null){
                    sumatory += asset.signals[signalName].Value;
                }
            });
        });
        const simulatedSignal = {
            Value: sumatory
        };        
        return formatSignal({[signalName]: simulatedSignal}, signalName, tableColumn);
    }

    function getNodeSignalAverage(node, signalName, tableColumn) {    
        var sumatory = 0;
        var amount = 0;
        node.sets
        .forEach(set => {
            set.assets
            .forEach(asset => {        
                if (asset.signals && asset.signals[signalName] && asset.signals[signalName].Value !== null){
                    sumatory += asset.signals[signalName].Value;
                    amount++;
                }
            });
        });
        let average: any = sumatory / amount;
        average = isNaN(average) ? '' : average;
        const simulatedSignal = {
            Value: average
        };
        return formatSignal({[signalName]: simulatedSignal}, signalName, tableColumn);
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


    function clean() {
        if (unsubscribeSignalColumns) unsubscribeSignalColumns();
       
        inputSignals.forEach(inputSignal => inputSignal.clean());
        assetsAlerts.forEach(assetAlerts => assetAlerts.clean());
        unsubscribes.forEach(unsubscribe => unsubscribe());        
        ractive.teardown();
    }
    
    return {
        init,
        loadColumns,
        clean
    };
}