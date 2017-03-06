import Ractive from 'ractive';
import {BudgetService} from '../../services/budget.service';
import {ManualMegaWattsFormater} from '../../utils';
declare var d3: any;
const budget = BudgetService();

export function CurrentEarningsComponent() {

    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
        <div class="summary-item half-width">
            <div class="title-small">
                Today's Earnings
            </div>
            <div class="data-number">
                {{earningsData.totalEarnings !== undefined ? formatNumber(earningsData.totalEarnings) : '_'}}<span class="small-text"> &euro;</span>
            </div>
        </div>
        <div class="summary-item half-width">
            <div class="text-small">
            <div>Energy: <span class="detail-number">{{earningsData.producedEnergy !== undefined ? megaWattsFormat(earningsData.producedEnergy):'_'}}</span></div>
            <div>Avg. Pool Price: <span class="detail-number">{{earningsData.avgPrice !== undefined ? formatNumber(earningsData.avgPrice) : '_'}} &euro;/MWh</span></div>
            <div>Forecast Energy: <span class="detail-number">{{earningsData.estimatedEnergy !== undefined ? megaWattsFormat(earningsData.estimatedEnergy) : '_'}}</span></div>
            </div>
        </div>
        `,
        data: {
            earningsData : {},
            formatNumber: formatNumber(),
            megaWattsFormat: ManualMegaWattsFormater()
        }
    };

    function setData() {
         budget.getTodaysEarningsData()
            .then(earningsData => {
                ractive.set('earningsData',earningsData); 
            });
    }
    function init(elem) {
        console.log("<assets-income>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        console.log("</assets-income>");
    }

    function formatNumber() {
        return d3.format('.3s');
    }

    function clean() {
        ractive.teardown();
        budget.clean();
    }

    return {
        init,
        clean,
        setData
    }
}