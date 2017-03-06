declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {IncomeTabMonthly} from './income-tab-monthly.component';
import {IncomeTabDaily} from './income-tab-daily.component';
import {numberScaleFormatter} from '../../utils';

export function IncomeTabYearly() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small">
                YEARLY INCOME
            </div>
            <div id="chart-yearly-income-tab" class="info-chart">
            </div>
        `
    };

    const dateFormat = d3.time.format('%B');
    const incomeMonthlyTab= IncomeTabMonthly();    
    const incomeDailyTab = IncomeTabDaily();

    function init(elem,dcData) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);        
        drawChart('#chart-yearly-income-tab', dcData);        
    }
    
    function drawChart(elem, dcData) {
        const assetDimension = dcData.assetDimension;
        const incomeGroup = assetDimension.group().reduceSum(function (record: BudgetAssetRecord) {return record.totalIncome});
        
        const width = $('#chart-yearly-income-tab').parent().innerWidth();
        var chart = dc.barChart('#chart-yearly-income-tab', 'IncomeGroup');
        chart
            .width(width)
            .height(250)
            .dimension(assetDimension)
            .group(incomeGroup,"Income")
            .title(function(point: Point){ return `Income at ${numberScaleFormatter(point.value)} €`;})
            .yAxisLabel("Income (€)")
            .x(d3.scale.ordinal())
            .colors('#93b940')
            .xUnits(dc.units.ordinal)
            .barPadding(0.1)
            .elasticY(true)
            .margins({top: 25, right: 0, bottom: 65, left: 65});
                    
        chart.yAxis().tickFormat(d3.format('.3s')); 

        chart.on("preRedraw",function(chart) {
            incomeMonthlyTab.init('monthly-income-tab',dcData, incomeDailyTab);                                    
            incomeDailyTab.init('daily-income-tab',dcData, "#chart-daily-income-tab", $('#current-year').html());
        });

        
        chart.render();
    }

    function clean() {
        if (ractive)
            ractive.teardown();
    }

    return {
        init,
        clean
    };
}