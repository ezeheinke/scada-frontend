import Ractive from 'ractive';

import { PowerCurveComponent } from './power-curve.component';
import { ProductionComponent } from './production.component';
import { CapacityFactorComponent } from './capacity-factor.component';
import { AvailabilityTimeComponent } from './availability-time.component';

export function AnalysisChartsComponent() {

    let ractive: IRactive = undefined;    

    const powerCurve = PowerCurveComponent();
    const production = ProductionComponent();
    const capacityFactor = CapacityFactorComponent();
    const availabilityTime = AvailabilityTimeComponent();

    const ractiveData = {
        el: undefined,
        template: `            
            <div id="power-curve" class="analysis-main-chart">
            </div>
            <div id="production" class="analysis-main-chart">
            </div>
            <div id="availability-time" class="analysis-main-chart">
            </div>
            <div id="capacity-factor" class="analysis-main-chart">
            </div>
            
        `
    };

    function init(elem, dataId) {
        console.log("<analysis-charts>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        powerCurve.init('#power-curve', dataId);
        production.init('#production', dataId);
        availabilityTime.init('#availability-time', dataId);
        capacityFactor.init('#capacity-factor', dataId);

        console.log("</analysis-charts>");
    }

    function clean() {
        powerCurve.clean();
        capacityFactor.clean();
        availabilityTime.clean();
        ractive.teardown();
    }

    return {
        init,
        clean
    };
}