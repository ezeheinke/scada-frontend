import {BudgetService} from '../../services/budget.service';
import Ractive from 'ractive';

declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

const budget = BudgetService();

export function DailyProductionComponent() {

    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small-chart">
                DAILY PRODUCTION - POOL PRICE
            </div>
            <div class="title-small {{showMessage ? '' : 'hidden'}}">Loading...</div>
            <div id="chart-daily-production" class="info-chart">
            </div>
        `,
        data: {
            showMessage: true
        } 
    };

    function setData() {
        
        budget.getSummaryDailyData().then( dcData => {
            drawChart('#chart-daily-production', dcData);
        });
    }
    
    function init(elem) {
        console.log("<daily-production>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        console.log("</daily-production>");
    }

    
    
    function drawChart(elem, dcData) {
        const hourDimension = dcData.hourDimension;
        const energyGroup = hourDimension.group().reduceSum(function (record: BudgetAssetRecord){ return record.producedEnergy / 1000 });
        const priceGroup = hourDimension.group().reduceSum(function (record: BudgetAssetRecord){ return record.marketPrice});
        const estimatedPriceGroup = hourDimension.group().reduceSum(function (record: BudgetAssetRecord){ return record.estimatedPrice});

        const width = $(elem).parent().innerWidth();       
       
        var chart = dc.compositeChart(elem);
        
        chart
        .width(width)
        .height(190)
        .x(d3.scale.linear().domain([0.5,24.5]))
        .margins({top: 15, right: 40, bottom: 20, left: 35})
        .xUnits(function(){ return 25;})
        .brushOn(false)
        .shareTitle(false)
        .yAxisLabel("MWh")
        .elasticY(true)
        .dimension(hourDimension)
        .compose([
                dc.barChart(chart)
                    .group(energyGroup)
                    .colors("#93b940")
                    .gap(0)
                    .centerBar(true)
                    .title(function(point: Point){ return `Energy at ${point.key} hs : ${(point.value).toFixed(2)}MWh`;}),
                dc.lineChart(chart)
                    .group(priceGroup)
                    .colors("#5D6D7E")
                    .useRightYAxis(true)
                    .renderDataPoints(true)
                    .title(function(point: Point){ return `Price at ${point.key} hs : ${(point.value).toFixed(2)}€`;}),
                dc.lineChart(chart)
                    .group(estimatedPriceGroup)
                    .colors("#E74C3C")
                    .useRightYAxis(true)
                    .renderDataPoints(true)
                    .title(function(point: Point){ return `MTP price at ${point.key} hs : ${(point.value).toFixed(2)}€`;})
        ]);

        
        chart.rightYAxisLabel("€/MWh"); 
        chart.yAxis().tickFormat(d3.format('.3s'));            

        chart.render();
        ractive.set('showMessage',false);
       
    }

    function clean() {
        ractive.teardown();
        budget.clean();
        
    }

    return {
        init,
        clean,
        setData
    };
}