import Ractive from 'ractive';

declare var crossfilter: any;
declare var d3: any;

import { CompactScadaService } from '../../services/compact-scada.service';

/**TODO temp just for showing till finaces is ready */
let alertsByAsset = undefined;
const compactScada = CompactScadaService();
let unsubscribe = undefined;

export function SummaryWeatherComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
            {{#if alerts}}
                <div class="title-small">WEATHER ALERTS</div>
                {{#each alertsByAsset}}
                    <div style="float:left; position:relative; margin-left:15px; margin-top: 10px;">
                        <img style ="height:32px; width:32px;top:5px; position:relative;" src="../../../../data/map-europe/icons/{{@key}}.svg" title="{{getAssets(this)}}">
                        <div style="font-size: 14px; position: relative; width: 20px; float: right; top: 20px; right: 10px; background-color: red; border-radius: 20px; text-align: center;">{{getNumberAssets(this)}}</div>
                    </div>
                {{/each}}
            {{else}}
                <div class="title-small">No weather alerts detected.</div>
            {{/if}}            
            
        `,
        data: {
            alertsByAsset,
            getNumberAssets: function(s){
                return (s.match(/\$/g) || []).length + 1;
            },
            getAssets: function(s) {
               return s.split('$').join("\n");
            }
        }
    };
    
    function init(elem) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        getWeatherAlerts();
    }
    
    function getWeatherAlerts(){
        unsubscribe = compactScada.subscribe('.*WeatherAlertInfo.*', function(signals: Signal[]) {
            alertsByAsset = new Object();
            calcWeatherSummary(signals);
        });
    }

    function calcWeatherSummary(signals){
        var totAlerts = '';
        signals.forEach(s => {
            if(s.Value == "")
                alertsByAsset[s.Name.split("_")[1].split(".")[0]] = [];
            else    
                alertsByAsset[s.Name.split("_")[1].split(".")[0]] = JSON.parse(s.Value);
        });
        
        let typeOfAlerts = new Object();
        Object.keys(alertsByAsset).forEach(asset => {
            alertsByAsset[asset].forEach(alert =>{
                var actualAlert = classifyAlert(alert.type)
                typeOfAlerts[actualAlert] = (typeOfAlerts.hasOwnProperty(actualAlert))? typeOfAlerts[actualAlert]+'$'+asset : typeOfAlerts[actualAlert] = asset;
            });
        });
        ractive.set('alerts', Object.keys(typeOfAlerts).length);
        ractive.set('alertsByAsset',typeOfAlerts);
    }

    function classifyAlert(alert){
       switch (alert){
            case "HUR":	//Hurricane Local Statement
                alert = "HUR";
                break;
            case "TOR":	//Tornado Warning
                alert = "HUR";
                break;
            case "TOW":	//Tornado Watch
                alert = "HUR";
                break;
            case "WRN":	//Severe Thunderstorm Warning
                alert = "SEW";
                break;
            case "SEW":	//Severe Thunderstorm Watch
                alert = "SEW";
                break;
            case "WIN":	//Winter Weather Advisory
                alert = "WIN";
                break;
            case "FLO":	//Flood Warning
                alert = "SEW";
                break;
            case "WAT":	//Flood Watch / Statement
                alert = "FLO";
                break;
            case "WND":	//High Wind Advisory
                alert = "WND";
                break;
            case "SVR":	//Severe Weather Statement
                alert = "HUR";
                break;
            case "HEA":	//Heat  Advisory
                alert = "HEA";
                break;
            case "FOG":	//Dense Fog Advisory
                alert = "FOG";
                break;
            case "SPE":	//Special Weather Statement
                alert = "SPE";
                break;
            case "FIR":	//Fire  Weather Advisory
                alert = "FIR";
                break;
            case "VOL":	//Volcanic Activity Statement
                alert = "";
                break;
            case "HWW":	//Hurricane Wind Warning
                alert = "HUR";
                break;
            case "REC":	//Record Set
                alert = "";
                break;
            case "REP":	//Public Reports
                alert = "";
                break;
            case "PUB":	//Public Information Statement
                alert = "";
                break;
       }
        return alert;
    }
    
    function clean() {        
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}