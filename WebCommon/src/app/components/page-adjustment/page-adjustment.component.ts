import * as RactiveTooltip from 'ractive-tooltip';
import Ractive from 'ractive';
import { PieChartProduced } from './pie-chart-produced.component';
import * as RactiveEventsKeys from 'ractive-events-keys';
import {StateContainerService} from '../../services/state-container.service';
import { PieChartError } from './pie-chart-error.component';
import { ResourcesService } from '../../services/resources.service';
import { ModalWindowService } from '../../services/modal-window.service';
import { CompactScadaService } from '../../services/compact-scada.service';

declare var $: any;
declare var moment: any;

const resources = ResourcesService();
const modalWindow = ModalWindowService();
const compactScada = CompactScadaService();
const stateContainer = StateContainerService();

export function PageComponent() {

    const pieChartProduced = PieChartProduced();
    const pieChartError = PieChartError();
    let ractive: IRactive = undefined;
    let refreshUProgs;    
    const ractiveData = {
        el: undefined,
        template: `
                <div id="uProg-body">
                {{#each uProgs: numUprog}}
                    <div id="uProg-{{numUprog}}" class="margin5 uProg">
                        <div id="uProg-{{numUprog}}-header" class="uProg-header"> {{uProgName}} </div>                    
                        <div id="uProg-Global-State-{{numUprog}}" class="uProg-Global-State">
                            <div id="Body-Resume-{{numUprog}}" class="uProg-body-Resume">
                                <div class="resume-title" style="{{checkAncillaryServices(signals, 'AncillaryEnergy')}}"><span style="font-weight:bold;">Ancillary services:</span> {{formatSignalAncillaryServicesInfo(signals, 'AncillaryEnergyInfo')}} <span class="{{formatUpDown(signals, 'AncillaryEnergyInfo')}}"/> {{formatSignalAncillaryServices(signals, 'AncillaryEnergy')}}</div>
                                <div class="resume-title"><span style="font-weight:bold;">Hourly target:</span> {{formatSignalHourlyProgramInfo(signals, 'DesiredEnergyInfo')}} <span class="{{formatUpDown(signals, 'DesiredEnergyInfo')}}"/> {{formatSignalHourlyProgram(signals, 'DesiredEnergy')}}</div>
                                <div class="resume-title"><span style="font-weight:bold;">Program limitation:</span> {{formatSignalProgramLimitation(signals, 'LimitationEnergy')}} {{formatSignalProgramLimitationInfo(signals, 'LimitationEnergyInfo')}}</div>
                            </div>
                        </div> 
                        <div id="uProg-Charts-{{numUprog}}" class="uProg-Charts">
                            <div id="container-ChartPie-Produced-{{numUprog}}" class="container-ChartPie-Produced">
                                <div id="title-Produced-{{numUprog}}" class="title-produced">Hourly energy balance</div>
                                <div id="container-chart-Produced-{{numUprog}}" class="container-chart-produced">
                                    <div id="chartPie-Produced-{{numUprog}}" class="chart-produced"/>
                                </div>
                                <div id="description-Produced-{{numUprog}}" class="description-Produced">  
                                    <div id="description-Produced-title-{{numUprog}}">
                                        <div><span class="description-generated"/>&nbsp;Energy Generated</div>
                                        <div><span class="description-future"/>&nbsp;Future estimated energy</div>
                                    </div>                                    
                                    <div id="description-Signals-title-{{numUprog}}" style="margin-top:50px;">                                        
                                        <div><span style="font-weight:bold;">Energy generated:</span> {{formatSignal(signals, 'Energy')}} MWh</div>
                                        <div><span style="font-weight:bold;">Future estimated energy:</span> {{formatSignal(signals, 'EnergyFuture')}} MWh</div>
                                        <div><span style="font-weight:bold;">Hourly Proyected Energy:</span> {{formatSignal(signals, 'EstimatedEnergy')}} MWh</div>
                                    </div>
                                </div>
                            </div>
                            <div id="spacer-Div" class="spacer-Div"/>
                            <div id="container-ChartPie-Error-{{numUprog}}" class="container-ChartPie-Error">
                                <div id="title-Error-{{numUprog}}" class="title-error">Estimated Error</div>
                                <div id="container-chart-Error-{{numUprog}}" class="container-chart-Error">
                                    <div id="chartPie-Error-{{numUprog}}" style="width:150px"/>
                                </div>
                                <div id="description-Error-{{numUprog}}" class="description-Error">  
                                    <div id="description-Error-title-{{numUprog}}">
                                        <div><span class="hourly-proyected"/>&nbsp;Hourly Proyected Energy</div>
                                        <div><span class="estimated-error"/>&nbsp;Estimated error</div>
                                    </div>
                                    <div id="description-Signals-title-{{numUprog}}" style="margin-top:50px;">
                                        <div><span style="font-weight:bold;">Hourly Proyected Energy:</span> {{formatSignal(signals, 'EstimatedEnergy')}} MWh</div>
                                        <div><span style="font-weight:bold;">Estimated error:</span> {{formatSignal(signals, 'ASEnergyDifference')}} MWh </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="uProg-Status-{{numUprog}}" class="uProg-Status">
                            <div class="uProg-Status-element" style="width:20%" decorator='tooltip:{{getSignalInfo(signals, 'ActivePower')}}'>Active Power: {{formatSignal(signals, 'ActivePower')}} MW</div>
                            <div class="uProg-Status-element" style="width:25%;{{checkSPDifference(signals, 'SetpointApplied', 'ASSPRecommended')}}" decorator='tooltip:{{getSignalInfo(signals, 'ASSPRecommended')}}'>SP. Recommended: {{formatSignal(signals, 'ASSPRecommended')}} MW</div>
                            <div class="uProg-Status-element" style="width:20%" decorator='tooltip:{{getSignalInfo(signals, 'SetpointApplied')}}'>SP. Applied: {{formatSignal(signals, 'SetpointApplied')}} MW</div>                            
                            <div class="uProg-Status-element" style="width:20%" decorator='tooltip:{{getSignalDifferenceInfo(signals, 'SetpointApplied', 'ASSPRecommended')}}'>SP. Diff.: {{getSignalDifference(signals, 'SetpointApplied', 'ASSPRecommended')}} MW</div>                            
                            <div class="uProg-Status-element" style="width:5%">Alerts:</div>
                            <div class="uProg-Status-element" style="display:none;">Regulation Mode:</div>
                        </div>
                        <div id="container-table-{{numUprog}}" class="container-table">
                            <table id="table-{{numUprog}}" class="table-assets-uprog">
                                <tr>    
                                    <th class="table-header-cell" style="width: 200px;">Assets</th>
                                    <th class="table-header-cell" style="width: 140px;">Active P. (MW)</th>
                                    <th class="table-header-cell">Energy Gen.</th>
                                    <th class="table-header-cell">L. Prog</th>
                                    <th class="table-header-cell">SP. Applied</th>
                                    <th class="table-header-cell">SP. Order</th>
                                    <th class="table-header-cell">Alerts</th>
                                </tr>
                                {{#each uProgAssets: numUprogAsset}}
                                <tr>
                                    <td class="table-cell-data">
                                        <span class="type-icon icon-{{id ? id.split('_')[0] : ''}}"></span>
                                        <a style="color: #5D6D7E;" href="#/assets/{{id}}">{{name}}</a>
                                    </td>
                                    <td class="table-cell-data" decorator='tooltip:{{getSignalInfo(signals, 'ActivePower')}}'>
                                        <span>{{formatSignal(signals, 'ActivePower')}}</span>
                                        <div class="data-bar">
                                            <span style="display: inline-block; height: 100%;width: {{getPercentage(signals,'ActivePower')}}%;
                                                background-color: {{getBarColor(signals, 'ActivePower')}}">
                                            </span>
                                        </div>
        
                                    </td>
                                    <td class="table-cell-data" decorator='tooltip:{{getSignalInfo(signals, 'Energy')}}'>{{formatSignal(signals, 'Energy')}}</td>
                                    <td class="table-cell-data" decorator='tooltip:{{getSignalInfo(signals, 'LimitationEnergy')}}'>{{formatSignalLimitation(signals, 'LimitationEnergy')}}</td>
                                    <td class="table-cell-data" decorator='tooltip:{{getSignalInfoSetpointReference(signals, 'SetpointApplied', 'SetpointReference')}}'>{{formatSignal(signals, 'SetpointApplied')}}</td>
                                    <td class="table-cell-data">
                                        <div class="input-signal">                     
                                            <span decorator='tooltip:Click to enter new value' class="editable {{editMode ? 'hidden' : ''}}" on-click="editSignal:{{this}}">
                                                --
                                            </span>
                                            <input class="{{editMode ? '' : 'hidden'}}"
                                                type="text" 
                                                value="{{newValue}}"
                                                on-enter="writeSignal:{{this}}"
                                                on-blur="quitEditMode:{{this}}">
                                        </div>
                                    </td>
                                    <td class="table-cell-data"></td>
                                </tr>
                                {{/each}}
                            </table>
                        </div>
                        <div class="ancillary-daily" style="display:none;">
                            <div class="ancillary-daily-title">Daily ancillary overview</div>
                            <table class="table-daily">
                                <tr>
                                    <th class="col-header label-clock"><i class="margin5 icon dripicons-clock"></i></th>
                                    <th class="text-center">00h</th><th class="text-center-aliceblue">01h</th>
                                    <th class="text-center">02h</th><th class="text-center-aliceblue">03h</th>
                                    <th class="text-center">04h</th><th class="text-center-aliceblue">05h</th>
                                    <th class="text-center">06h</th><th class="text-center-aliceblue">07h</th>
                                    <th class="text-center">08h</th><th class="text-center-aliceblue">09h</th>
                                    <th class="text-center">10h</th><th class="text-center-aliceblue">11h</th>
                                </tr>
                                <tr style="border-bottom: 1px solid #cecece;">                          
                                    <td class="col-header label-margin" style="border-bottom: 1px solid #89b3fb;"></td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 0)}}>00%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 1)}} class="text-center-aliceblue">01%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 2)}}>02%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 3)}} class="text-center-aliceblue">03%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 4)}}>04%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 5)}} class="text-center-aliceblue">05%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 6)}}>06%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 7)}} class="text-center-aliceblue">07%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 8)}}>08%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 9)}} class="text-center-aliceblue">09%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 10)}}>10%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 11)}} class="text-center-aliceblue">11%</td>
                                </tr>
                                <tr>
                                    <th class="col-header label-margin"></th>
                                    <th class="text-center">12h</th><th class="text-center-aliceblue">13h</th>
                                    <th class="text-center">14h</th><th class="text-center-aliceblue">15h</th>
                                    <th class="text-center">16h</th><th class="text-center-aliceblue">17h</th>
                                    <th class="text-center">18h</th><th class="text-center-aliceblue">19h</th>
                                    <th class="text-center">20h</th><th class="text-center-aliceblue">21h</th>
                                    <th class="text-center">22h</th><th class="text-center-aliceblue">23h</th>
                                </tr>
                                <tr>
                                    <td class="col-header label-margin"></td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 12)}}>12%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 13)}} class="text-center-aliceblue">13%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 14)}}>14%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 15)}} class="text-center-aliceblue">15%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 16)}}>16%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 17)}} class="text-center-aliceblue">17%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 18)}}>18%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 19)}} class="text-center-aliceblue">19%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 20)}}>20%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 21)}} class="text-center-aliceblue">21%</td>
                                    <td class="text-center" data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 22)}}>22%</td><td data-container="body" data-toggle="tooltip" title={{getTooltipInfo(this, 23)}} class="text-center-aliceblue">23%</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                {{/each}}
            <div>`,
        data: {
            uProgs: undefined,
            formatSignal,
            getSignalInfo,
            getSignalInfoSetpointReference,
            getSignalDifference,
            getSignalDifferenceInfo,         
            getTooltipInfo,   
            getPercentage,
            getBarColor,
            checkSPDifference,
            formatSignalProgramLimitation,
            formatSignalProgramLimitationInfo,
            checkAncillaryServices,
            formatSignalAncillaryServices,
            formatSignalAncillaryServicesInfo,
            formatUpDown,
            formatSignalLimitation,
            formatSignalHourlyProgram,
            formatSignalHourlyProgramInfo
        },
        decorators: {
            tooltip: RactiveTooltip.default
        },
        events: { 
            enter: RactiveEventsKeys['enter']
        }
    };

    let unsubscribes = [];

    function init(elem, resolve) {
        console.log("<page-adjustment>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        let uprogs = resources.getUProgs();

        uprogs.forEach(function (d, i) {
            unsubscribes.push(
                resources.subscribeToUProgs(uProg => {
                }), resources.subscribeSignalsToUProgs(["Energy", "EnergyFuture", "EstimatedEnergy", "DesiredEnergy", "DesiredEnergyInfo", "LimitationEnergy", "LimitationEnergyInfo",
                                                        "SetpointApplied", "ActivePower", "ASSPRecommended", "ASEnergyDifference", "AncillaryEnergy", "AncillaryEnergyInfo" ]));

            unsubscribes.push(
                resources.subscribeToUProgsAsset(uProgAsset => {
                    setUProgs();
                }), resources.subscribeSignalsToUProgsAsset(["SetpointReference", "NominalPower", "SetpointRequest", "ActivePower", "EstimatedEnergy", "EnergyFuture", "SetpointReceived", 
                                                                "SetpointApplied", "Energy", "LimitationEnergyInfo", "LimitationEnergy"]));
        });

        ractive.set("uProgs", uprogs);

        ractive.on("editSignal", function(event, input){            
            input.editMode = true;
            input.oldValue = input.signals["SetpointApplied"].Value;
            input.newValue = formatSignal(input.signals,"SetpointRequest");
            ractive.update();
            const inputElement = event.node.parentElement.children[1];
            inputElement.focus();            
        });

        ractive.on("writeSignal", function(event, input){
            const oldValue = input.signals["SetpointApplied"].Value;;
            const newValue = parseFloat(event.node.value);
            
            if(newValue !== oldValue) {
                modalWindow.confirm(
                    `Are you sure to set Setpoint Request to ${newValue} MW ?`,
                    function confirm() {
                        const signalName = input.id+'.SetpointRequest';
                        compactScada.setSignal(signalName, inverseFormat(newValue))
                        .then(response => {
                            console.info(`Signal ${signalName} changed to value ${inverseFormat(newValue)}`);
                        });
                    }
                );
            }
        });

        ractive.on('quitEditMode', function(event, inputSignal){
                inputSignal.editMode = false;
                ractive.update();
        })

        uprogs.forEach(function (d, i) {
            pieChartProduced.init("chartPie-Produced-" + i, i, d);
            pieChartError.init("chartPie-Error-" + i, i, d);
        });

        resolve(1);

        $(document).ready(function(){
            $('[data-toggle="tooltip"]').tooltip({html: true, placement: "auto"}); 
        });

        $(window).resize(function () {
            uprogs.forEach(function (d, i) {
                pieChartProduced.init("chartPie-Produced-" + i, i, d);
                pieChartError.init("chartPie-Error-" + i, i, d);
            });
        });                             

        refreshUProgs = setInterval(function () {
            uprogs.forEach(function (d, i) {
                pieChartProduced.init("chartPie-Produced-" + i, i, d);
                pieChartError.init("chartPie-Error-" + i, i, d);
            });
        }, 15000); 

        console.log("</page-adjustment>");
    }

	
	function formatSignal(signals, signalName) {
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        if (value === undefined) return '';
        const multiply = 0.001;
        const decimals = 2;
        return (value * multiply).toFixed(decimals);
    }
	
	function getSignalInfo(signals, signalName) {
        const signal = signals && signals[signalName];
        if (!signal) return "Signal no available";
        const quality = signalQualities[signal.Quality] || signalQualities['default'];
        return moment(signal.Timestamp).format("YYYY-MM-DD HH:mm:ss") + ' - ' + quality;
    }
	
	function getSignalInfoSetpointReference(signals, signalName, setpointReference){
        const signal = signals && signals[signalName];
        if (!signal) return "Signal no available";
        const quality = signalQualities[signal.Quality] || signalQualities['default'];
        if(signals[setpointReference])
            return moment(signal.Timestamp).format("YYYY-MM-DD HH:mm:ss") + ' - ' + quality + ' - ' + 'SP Reference: ' + (signals[setpointReference].Value)/1000 + "MW";
        else
            return moment(signal.Timestamp).format("YYYY-MM-DD HH:mm:ss") + ' - ' + quality;
    }
	
	function getSignalDifference(signals, spApplied, spRecommended){
        const signalSpApplied = signals && signals[spApplied];
        const signalSpRecommended = signals && signals[spRecommended];
        const valueApplied = signalSpApplied && signalSpApplied.Value;
        const valueRecommended = signalSpRecommended && signalSpRecommended.Value;
        if (valueRecommended === undefined || valueApplied === undefined) return '';
        const multiply = 0.001;
        const decimals = 2;
        return ((valueApplied - valueRecommended) * multiply).toFixed(decimals);
    }

    function getSignalDifferenceInfo(signals, spApplied, spRecommended){
        const signalSpApplied = signals && signals[spApplied];
        const signalSpRecommended = signals && signals[spRecommended];
        if (!signalSpApplied || !signalSpRecommended) return "Signal no available";

        const quality = signalQualities[getLower(signalSpApplied.Quality, signalSpRecommended.Quality)] || signalQualities['default'];
        return moment(getLower(signalSpApplied.Timestamp, signalSpRecommended.Timestamp)).format("YYYY-MM-DD HH:mm:ss") + ' - ' + quality;
    }

    function getLower(a, b){
        if(a>=b)
            return a;
        else
            return b;
    }
	
    function getTooltipInfo(signals, hour){
        var res= 'Limites actuales: <br />'+
                'Energía maxima a generar: 120MW <br />'+
                'Energía mínima: 0MW <br />'+
                '<br />'+
                'Contadores <br />'+
                '- Actual horario: 20MWh <br />'+
                '- Estimación prod. constante: 100MWh<br />'+
                '- Consigna recomendada: 130MWh<br />'+
                '<br />'+
                'Registro intrahorario:<br />'+
                '- 14:10h SUBIR 100 MWh TERCIARIA<br />'+
                '- 14:30h BAJAR 120MWh DESVIO<br />'+
                '- 14:40h LIMITACION PROG 50MWh<br />'+
                '<br />';
        return res;
    }
	
	function getPercentage(signals, signalName){        
        const signal = signals && signals[signalName];
        let nominalPower = signals && signals["NominalPower"];        
        const value = signal && signal.Value;
        if (value === undefined || signal === undefined) return 0;

        var numerator = signals[signalName].Value;
        
        var percentage = ( nominalPower.Value !== 0) ? (numerator/ nominalPower.Value) * 100 : 0;
        return Math.abs( Math.floor(percentage) );
    }

    function getBarColor(signals, signalName){
        var percentage = getPercentage(signals, signalName);
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

    const signalQualities = {
        0xC0: "GOOD",
        0x40: "UNCERTAIN",
        0x1C: "OUT_OF_SERVICE",
        'default': "BAD"
    }
	
    function checkSPDifference(signals, setpointApplied, aSSPRecommended){
        const signalSpApplied = signals && signals[setpointApplied];
        const signalSpRecommended = signals && signals[aSSPRecommended];
        const valueApplied = signalSpApplied && signalSpApplied.Value;
        const valueRecommended = signalSpRecommended && signalSpRecommended.Value;
        if (valueRecommended === undefined || valueApplied === undefined) return '';
        let multiply = 0.001;
        let decimals = 2;
        let res = ((valueApplied - valueRecommended) * multiply).toFixed(decimals);
        if(Number(res) == 0){
            return '';
        }else{
            return 'background-color:orange; color:white;';
        }
    }

	function formatSignalProgramLimitation(signals, signalName){
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        if (value === undefined) return '';
        if (value === -1) return 'No limitation';
        let multiply = 0.001;
        let decimals = 2;
        return '  ' + (value * multiply).toFixed(decimals) + ' MWh';
    }

    function formatSignalProgramLimitationInfo(signals, signalName) {
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        
        if (value === undefined)    
            return '';
        else
            return value.split(';')[1];           
    }

    function checkAncillaryServices(signals, signalName){
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        if (value === undefined) return '';
        if (value === -1) 
            return '';
        else    
            return 'background-color:orange; color:white;'
    }
    function formatSignalAncillaryServices(signals, signalName){
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        if (value === undefined) return '';
        if (value === -1) return 'No limitation';
        let multiply = 0.001;
        let decimals = 2;
        return '  ' + (value * multiply).toFixed(decimals) + ' MWh';
    }

    function formatSignalAncillaryServicesInfo(signals, signalName) {
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        
        if (value === undefined)    
            return '';
        else{
            var updown = value.split(';')[0];            
            var desv = value.split(';')[1];
            var msg = ""

            switch(desv) {
                case "DESV":
                    msg = " Deviation";
                    break;
                case "TER":
                    msg = " Tertiary";
                    break;
                default:
                    msg = "";
                    break;
            }

             switch(updown) {
                case "1":
                    msg += " no asignation";
                    break;
                case "2": // Down
                    msg += " ";
                    break;
                case "4": // Up
                    msg += " ";
                    break;
                case "5":
                    msg += " no action";
                    break;
            }

            return msg;
        }
    }
    
    function formatUpDown(signals, signalName) {
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        
        if (value === undefined)    
            return '';
        else{
            var updown = value.split(';')[0]; 
            var msg = ""

            switch(updown) {
                case "1":
                    msg += "";
                    break;
                case "2": // Down
                    msg += "arrow-down";
                    break;
                case "4": // Up
                    msg += "arrow-up";
                    break;
                case "5":
                    msg += "";
                    break;
            }

            return msg;
        }
    }

    function inverseFormat(value) {
        const factor = 0.001;
        return value / factor;
    }

    function formatSignalLimitation(signals, signalName) {
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        
        if (value === undefined)    
            return '';
        else{            
            if(value == -1)
                return 'No Limitation';
            else {
                let multiply = 0.001;
                let decimals = 2;
                return (value * multiply).toFixed(decimals);
            }
        }
    }

    function formatSignalHourlyProgram(signals, signalName){
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        if (value === undefined) return '';
        if (value === -1) return 'No limitation';
        let multiply = 0.001;
        let decimals = 2;
        return '  ' + (value * multiply).toFixed(decimals) + ' MWh';
    }

    function formatSignalHourlyProgramInfo(signals, signalName) {
        const signal = signals && signals[signalName];
        const value = signal && signal.Value;
        
        if (value === undefined)    
            return '';
        else{
            var part = value.split(';')[1];
            var msg = "";
            if(part != "MAX" && part != "MIN") {
                switch(part) {
                    case "DESV":
                        msg = " Deviation";
                        break;
                    case "TER":
                        msg = " Tertiary";
                        break;
                    default:
                        msg = "";
                        break;
                }

                var updown = value.split(';')[0];
                switch(updown) {
                    case "1":
                        msg += " no asignation";
                        break;
                    case "2": // Down
                        msg += " ";
                        break;
                    case "4": // Up
                        msg += " ";
                        break;
                    case "5":
                        msg += " no action";
                        break;
                }                
            }
            else {
                msg = part;
            }

            return msg;
        }
    }

    function setUProgs() {
        let uprogs = resources.getUProgs();
        ractive.set("uProgs", uprogs);
    }

    function clean() {
        clearInterval(refreshUProgs);
        pieChartProduced.clean();
        pieChartError.clean();
        ractive.teardown();
    }

    /*function getInfoFromUP(){
        const serverPath = stateContainer.Static.Data.serverPath;
        const token = stateContainer.read('user.token');  
        const promise = new Promise(resolve => {

            fetch(serverPath+`/api/ancillary/data`,{
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: {}
            })
            .then(response => response.json())
            .then(dataset => {                
                // Do Stuff
                })
                .catch(error => console.log());
        });
    }*/

    return {
        init,
        clean
    };
}