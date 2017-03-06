import Ractive from 'ractive';
import {BudgetService} from '../../services/budget.service';
declare var d3: any;
const budget = BudgetService();

export function AssetsIncomeComponent() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `
        <div class="summary-item half-width">
            <div class="title-small">
                Today's Earnings
            </div>
            <div class="data-number">
                {{summaryData.totalEarnings !== undefined ? formatIncome(summaryData.totalEarnings) : '_'}}<span class="small-text"> &euro;</span>
            </div>
        </div>
        <div class="summary-item half-width">
            <div class="text-small">
            <div>Energy: <span class="detail-number">{{summaryData.energy !== undefined ? formatIncome(summaryData.energy):'_'}} MWh</span></div>
            <div>Pool price: <span class="detail-number">{{summaryData.price !== undefined ? formatIncome(summaryData.price):'_'}} &euro;/MWh</span></div>
            <div>Budget Energy: <span class="detail-number">{{summaryData.estimatedEnergy !== undefined ? formatIncome(summaryData.estimatedEnergy) : '_'}} MWh</span></div>
            <div>Avg. Pool Price: <span class="detail-number">{{summaryData.avgPrice !== undefined ? formatIncome(summaryData.avgPrice) : '_'}} &euro;</span></div>
            </div>
        </div>
        `,
        data: {
            summaryData : {},
            formatIncome: formatIncome(),
        }
    };

    function setData() {
         budget.getSummaryHourlyData()
            .then(summaryData => {
                ractive.set('summaryData',summaryData); 
            });
    }
    function init(elem) {
        console.log("<assets-income>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        console.log("</assets-income>");
    }

    function formatIncome() {
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