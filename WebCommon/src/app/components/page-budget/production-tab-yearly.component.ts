declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {ProductionTabMonthly} from './production-tab-monthly.component';
import {ProductionTabDaily} from './production-tab-daily.component';

import {numberScaleFormatter} from '../../utils';

export function ProductionTabYearly() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small">
                YEARLY PRODUCTION
            </div>
            <div id="chart-yearly-production-tab" class="info-chart">
            </div>
        `
    };

    const dateFormat = d3.time.format('%B');
    const productionMonthlyTab= ProductionTabMonthly();    
    const productionDailyTab = ProductionTabDaily();

    function init(elem,dcData) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);        
        drawChart('#chart-yearly-production-tab', dcData);        
    }
    
    function drawChart(elem, dcData) {
        const assetDimension = dcData.assetDimension;
        const producedEnergyGroup = assetDimension.group().reduceSum(function (record: BudgetAssetRecord) {return record.producedEnergy});
        
        const width = $('#chart-yearly-production-tab').parent().innerWidth();
        var chart = dc.barChart('#chart-yearly-production-tab', 'ProductionGroup');
        chart
            .width(width)
            .height(250)
            .dimension(assetDimension)
            .group(producedEnergyGroup,"Production")
            .title(function(point: Point){ return `Production at ${numberScaleFormatter(point.value)} MWh`;})
            .yAxisLabel("Production (MWh)")
            .x(d3.scale.ordinal())
            .colors('#1f77b4')
            .xUnits(dc.units.ordinal)
            .barPadding(0.1)
            .elasticY(true)
            .margins({top: 25, right: 0, bottom: 65, left: 65});
                    
        chart.yAxis().tickFormat(d3.format('.3s')); 
        
        chart.on("preRedraw",function(chart) {
            productionMonthlyTab.init('monthly-production-tab',dcData, productionDailyTab);                                    
            productionDailyTab.init('daily-production-tab',dcData, "#chart-daily-production-tab", $('#current-year').html());
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