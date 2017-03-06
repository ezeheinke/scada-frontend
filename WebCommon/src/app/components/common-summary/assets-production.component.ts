import Ractive from 'ractive';

import { ResourcesService } from '../../services/resources.service';
import { CompactScadaService } from '../../services/compact-scada.service';

const resources = ResourcesService();
const compactScada = CompactScadaService();

export function AssetsProductionComponent() {
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
            {{#assetsSum}}
            <div class="summary-item half-width">
                <div class="title-small">
                    Production
                </div>
                <div class="data-number">
                    {{activePowerSum}}<span class="small-text">MW</span>
                </div>
            </div>
            <div class="summary-item half-width">
                <div class="text-small">
                    <div>Power Ads: <span class="detail-number">{{powerAdsSum}}</span></div>
                    <div>SP Received: <span class="detail-number">{{setpointReceived}}</span></div>
                    <div>SP Applied: <span class="detail-number">{{setpointAppliedSum}}</span></div>
                    <div>Rated Power: <span class="detail-number">{{ratedPowerSum}}</span></div>
                </div>
            </div>
            <div class="summary-item full-width">
                <div class="data-bar-wrapper">
                    <div class="data-bar">
                        <span title="Active Power" style="
                            width: {{getPercentage(assetsSum.activePowerSum, assetsSum.ratedPowerSum)}}%;
                            background-color: {{getBarColor(assetsSum.activePowerSum, assetsSum.setpointReceived)}};
                        "></span>
                    </div>
                    <span class="caret bar-indicator" title="Setpoint Received" style="
                        left: {{getPercentage(assetsSum.setpointReceived,  assetsSum.ratedPowerSum)}}%;
                    "></span>
                </div>   
            </div>
            {{/assetsSum}}
        `,
        data: {
            assetsSum: {},
            getPercentage,
            getBarColor
        }
    };

    let unsubscribes = undefined;
    
    function init(elem) {
        console.log("<assets-production>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        unsubscribes = [
            resources.subscribeSignalsToAssets(["Availability", "ActivePower", /*"SetpointReceived"*/, "SetpointApplied"]),
            resources.subscribeToAssets(assets => {                
                const assetsSum = getAssetsSum(assets);                
                ractive.set('assetsSum', Object.assign({}, ractive.get('assetsSum'), assetsSum) ); // asssign to an object to not delete assetsSum.setpointReceived
            }),
            compactScada.subscribe('^CCR\\.(RoleApplied|CECOELSetpointReceived|CECORESetpointReceived)$', signals => {
                const roleApplied = signals.filter(signal => signal.Name === 'CCR.RoleApplied')[0].Value;
                const CECOEL = signals.filter(signal => signal.Name === 'CCR.CECOELSetpointReceived')[0].Value;
                const CECORE = signals.filter(signal => signal.Name === 'CCR.CECORESetpointReceived')[0].Value;                
                const setpointReceived = roleApplied === 1 ? CECORE : CECOEL;                
                ractive.set('assetsSum.setpointReceived', (setpointReceived / 1000).toFixed(2) );
            })
        ];

        console.log("</assets-production>");
    }

    function getAssetsSum(assets: Asset[]){
        const assetsSumInitial = {
            activePowerSum: 0,
            powerAdsSum: 0,
            // setpointReceivedSum: 0,
            setpointAppliedSum: 0,
            ratedPowerSum: 0
        };        
        const assetsSum = assets.reduce(function(accum, asset){
            const activePower = asset.signals['ActivePower'] ? asset.signals['ActivePower'].Value / 1000 : 0;
            // const setpointReceived = asset.signals['SetpointReceived'] ? asset.signals['SetpointReceived'].Value / 1000 : 0;
            const setpointApplied = asset.signals['SetpointApplied'] ? asset.signals['SetpointApplied'].Value / 1000 : 0;

            accum['activePowerSum'] +=  activePower;
            accum['powerAdsSum'] += asset.powerAds ? activePower : 0;
            // accum['setpointReceivedSum'] += setpointReceived;
            accum['setpointAppliedSum'] += setpointApplied;
            accum['ratedPowerSum'] += asset.nominalPower !== undefined ? asset.nominalPower / 1000 : 0;

            return accum;
        }, assetsSumInitial);
        return format(assetsSum);
    }

    function getPercentage(numerator,  denominator){
        let percentage = ( denominator !== 0) ? (numerator/ denominator) * 100 : 0;
        percentage = percentage > 100 ? 100 : percentage;
        return Math.abs( Math.floor(percentage) );
    }

    function getBarColor(value, trigger){
        const statusOkColor = '#7ED321';
        const statusAlarmColor = 'red';
        return value <= trigger ? statusOkColor : statusAlarmColor;
    }

    function format(assetsSum){
        const assetsSumFormated = {
            activePowerSum: assetsSum['activePowerSum'].toFixed(0),
            powerAdsSum: assetsSum['powerAdsSum'].toFixed(2),
            // setpointReceivedSum: assetsSum['setpointReceivedSum'].toFixed(2),
            setpointAppliedSum: assetsSum['setpointAppliedSum'].toFixed(2),
            ratedPowerSum: assetsSum['ratedPowerSum'].toFixed(2)
        };
        return assetsSumFormated;
    }

    function clean() {        
        unsubscribes.forEach(unsubscribe => unsubscribe());
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}