declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';

import {MonthlyCompoundGainComponent} from './monthly-compound-gain.component';
import {MonthlyPenaltiesCumulativeComponent} from './monthly-penalties-cumulative.component';

import {DailyProductionPrevisionComponent} from './daily-production-prevision.component';
import {DailyPriceComponent} from './daily-price.component';
import {DailyCompoundGain} from './daily-compound-gain.component';

import {numberScaleFormatter} from '../../utils';
export function YearlyProductionAssetsComponent() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small">
                YEARLY NET PRODUCTION
            </div>
            <div id="chart-yearly-production" class="info-chart">
            </div>
        `
    };

    const dateFormat = d3.time.format('%B');
    const monthlyCompoundGain = MonthlyCompoundGainComponent();
    const monthlyPenaltiesCumulative = MonthlyPenaltiesCumulativeComponent();

    const dailyCompoundGain = DailyCompoundGain();
    const dailyProductionPrevision = DailyProductionPrevisionComponent();
    const dailyPrice = DailyPriceComponent();    
    let dcDataYearly;
    function init(elem,dcData) {
        dcDataYearly = dcData;
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        drawChart('#chart-yearly-production', dcData);
        
    }
    
    function drawChart(elem, dcData) {
        const assetDimension = dcData.assetDimension;
        const producedEnergyGroup = assetDimension.group().reduceSum(function (record: BudgetAssetRecord) {return record.producedEnergy});
        
        const width = $('#chart-yearly-production').parent().innerWidth();
        var chart = dc.barChart('#chart-yearly-production', 'summaryGroup');
        chart
            .width(width)
            .height(250)
            .dimension(assetDimension)
            .group(producedEnergyGroup,"Produced Energy")
            .title(function(point: Point){ return `Energy produced ${numberScaleFormatter(point.value)} MWh`;})
            .yAxisLabel("Energy (MWh)")
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .barPadding(0.1)
            .elasticY(true)
            .margins({top: 25, right: 0, bottom: 65, left: 65});
                    
        chart.yAxis().tickFormat(d3.format('.3s')); 

        chart.on("preRedraw",function(chart) {   
            monthlyCompoundGain.init("monthly-compound-gain",dcDataYearly, dailyProductionPrevision, dailyPrice, dailyCompoundGain);                           
            monthlyPenaltiesCumulative.init("monthly-penalties",dcDataYearly);
            dailyCompoundGain.init("daily-composed",dcDataYearly, "#chart-daily-composed", $('#current-year').html());   
            dailyPrice.init("daily-prices",dcDataYearly, "#chart-daily-prices", $('#current-year').html());         
            dailyProductionPrevision.init("daily-production-prevision",dcDataYearly, "#chart-daily-production-prevision", $('#current-year').html());
        });

        chart.render();
    }

    function clean() {
        if (ractive)
            ractive.teardown();
        monthlyCompoundGain.clean();
        monthlyPenaltiesCumulative.clean();
        dailyCompoundGain.clean();
        dailyProductionPrevision.clean();
        dailyPrice.clean();

    }

    return {
        init,
        clean
    };
}