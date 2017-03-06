import Ractive from 'ractive';
declare var $: any;

import { StateContainerService } from '../../services/state-container.service';
import { CompactScadaService } from '../../services/compact-scada.service';

export function ActivePowerComponent() {
    
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    const compactScada = CompactScadaService();
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small">
                Active Power
            </div>
            <div class="data-bar-wrapper">
                <div class="data-number">
                    {{formatPower(activePower)}}<span class="small-text"> / {{formatPower(nominalPower)}} MW</span>
                </div>
                <div class="data-bar">
                    <span style="width: {{getPercentage(activePower, nominalPower)}}%;
                                 background-color: {{getBarColor(activePower, nominalPower)}}">
                    </span>
                </div>
            </div>
            <div id="chart-active-power">
            </div>
        `,
        data: {
            activePower: undefined,
            nominalPower: undefined,
            formatPower,
            getPercentage,
            getBarColor
        }
    };

    let unsubcribe = undefined;
    
    function init(elem) {
        console.log("<active-power>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        const assetId = stateContainer.read('view');

        unsubcribe = compactScada.subscribe(`^${assetId}\.ActivePower$`, function(signals: Signal[]) {
            ractive.animate('activePower', signals[0].Value/1000); // to MW        
        });
            
        compactScada.getSignals(`^${assetId}\.NominalPower$`) // request once
        .then(function(signals: Signal[]) {
            if(signals[0]) ractive.set('nominalPower', signals[0].Value/1000); // to MW            
        });

        console.log("</active-power>");
    }

    function formatPower(power){
        return power !== undefined ?
            power < 0.01  ?
                power.toFixed(3):
                power.toFixed(2):                        
            '_';
    }

    function getPercentage(numerator,  denominator){
        var percentage = ( denominator !== 0) ? (numerator/ denominator) * 100 : 0;
        return Math.abs( Math.floor(percentage) );
    }

    function getBarColor(numerator,  denominator){
        var percentage = getPercentage(numerator,  denominator);
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

    function clean() {
        unsubcribe();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}