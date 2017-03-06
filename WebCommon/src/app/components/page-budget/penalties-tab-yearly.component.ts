declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {PenaltiesTabMonthly} from './penalties-tab-monthly.component';
import {PenaltiesTabDaily} from './penalties-tab-daily.component';

import {numberScaleFormatter} from '../../utils';

export function PenaltiesTabYearly() {

    let ractive: IRactive = undefined;
    const penaltyRealEuro = -86.998;
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small">
                YEARLY PENALTIES
            </div>
            <div id="chart-yearly-penalties-tab" class="info-chart">
            </div>
        `
    };

    const dateFormat = d3.time.format('%B');
    const penaltiesMonthlyTab= PenaltiesTabMonthly();    
    const penaltiesDailyTab = PenaltiesTabDaily();

    function init(elem,dcData) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);        
        drawChart('#chart-yearly-penalties-tab', dcData);        
    }
    
    function drawChart(elem, dcData) {
        const assetDimension = dcData.assetDimension;
        const penaltiesGroup = assetDimension.group().reduceSum(function (record: BudgetAssetRecord) {return record.realPenalties * penaltyRealEuro});
        
        const width = $('#chart-yearly-penalties-tab').parent().innerWidth();
        var chart = dc.barChart('#chart-yearly-penalties-tab', 'PenaltiesGroup');
        chart
            .width(width)
            .height(250)
            .dimension(assetDimension)
            .group(penaltiesGroup,"Penalties")
            .title(function(point: Point){ return `Penalties ${numberScaleFormatter(point.value)} €`;})
            .yAxisLabel("Penalty (€)")
            .x(d3.scale.ordinal())
            .colors('#93b940')
            .xUnits(dc.units.ordinal)
            .barPadding(0.1)
            .elasticY(true)
            .margins({top: 25, right: 0, bottom: 65, left: 65});
                    
        chart.yAxis().tickFormat(d3.format('.3s')); 

        chart.on("preRedraw",function(chart) {
            penaltiesMonthlyTab.init('monthly-penalties-tab',dcData, penaltiesDailyTab);                                    
            penaltiesDailyTab.init('daily-penalties-tab',dcData, "#chart-daily-penalties-tab", $('#current-year').html());
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