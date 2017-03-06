declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';

export function ProductionTabMonthly() {
    
    let ractive: IRactive = undefined;
    let _dmonthlychart;    
    let _ddailychart; 

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small col-sm-12">
                MONTHLY - NET PRODUCTION VS BUDGET AND FORECAST
            </div>
            
            <div id="chart-monthly-production-tab" class="info-chart"></div>
            <br>
            Production vs Forecast
            <br>
            <div id="titleTableMonthly" style="position: relative;display: block;float: left;">
                <table width="77px" border="1px solid #cecece;" style="border: 1px solid #cecece; border-right:0px solid;height: 32px;">                    
                    <tr id="monthly">
                        <td style="font-weight: bold; font-size:10px;" class="blackValue">Monthly (%)</td>
                    </tr>
                    <tr id="accumMonth">                        
                        <td style="font-weight: bold;" class="blackValue">Accum (%)</td>
                    </tr>
                </table>
            </div>
            <div id="dataTableMonthly" style="position: relative;float:left; display:block;">
                <table width="100%" border="1px solid #cecece;" style="border: 1px solid #cecece;height: 32px;">                            
                    <tr id="monthly">
                        {{#forecastMonthly}}
                        <td width="8.3333%;" class="{{valueMonthClass}}" style="border-left: 1px solid #cecece;">{{valueMonth}}</td>
                        {{/forecastMonthly}}
                    </tr>
                    <tr id="accumMonth">
                        {{#forecastAccMonth}}
                        <td class="{{accClass}}" style="border-left: 1px solid #cecece;">{{acc}}</td>
                        {{/forecastAccMonth}}
                    </tr>
                </table>
            </div>
            <br>
            Production vs Budget
            <br>
            <div id="titleTableMonthlyProduction" style="position: relative;display: block;float: left;">
                <table width="77px" border="1px solid #cecece;" style="border: 1px solid #cecece; border-right:0px solid;height: 32px;">                    
                    <tr id="monthly">
                        <td style="font-weight: bold; font-size:10px;" class="blackValue">Monthly (%)</td>
                    </tr>
                    <tr id="accumMonth">                        
                        <td style="font-weight: bold;" class="blackValue">Accum (%)</td>
                    </tr>
                </table>
            </div>
            <div id="dataTableMonthlyProduction" style="position: relative;float:left; display:block;">
                <table width="100%" border="1px solid #cecece;" style="border: 1px solid #cecece;height: 32px;">                            
                    <tr id="monthly">
                        {{#budgetMonthly}}
                        <td width="8.3333%;" class="{{valueMonthClass}}" style="border-left: 1px solid #cecece;">{{valueMonth}}</td>
                        {{/budgetMonthly}}
                    </tr>
                    <tr id="accumMonth">
                        {{#budgetAccMonth}}
                        <td class="{{accClass}}" style="border-left: 1px solid #cecece;">{{acc}}</td>
                        {{/budgetAccMonth}}
                    </tr>
                </table>
            </div>
        `,
        data: { 
                forecastMonthly: [],
                forecastAccMonth: [],
                budgetMonthly: [],
                budgetAccMonth: []
            }
        };

    const format = dateTitleFormatter();

    function init(elem, dcData, dailychart) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        _ddailychart = dailychart;   
        drawChart('#chart-monthly-production-tab',dcData);        
    }

    function drawChart(elem,dcData) {
        const monthDimension = dcData.monthDimension;
        const producedGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.producedEnergy});
        const estimatedGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.meteoEstimatedEnergy});
        const budgetGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.innogyPrevisionedEnergy});

        const width = $(elem).parent().innerWidth();
        let chart = dc.compositeChart(elem, 'ProductionGroup');
        const domain = dcData.domain;

        function postFilter(group) {
            return {
                all: function() {                    
                    let array = group.all()
                    .map(function(point: Point) {
                        return {
                            key: point.key,
                            value: point.value
                        };
                    });
                    let accum = 0;
                    array.forEach(function(point: Point, index) {
                        if (index===0) accum = 0;                        
                        accum += point.value;
                        point.value = accum;
                    });
                    return array;
                }
            };
        }

        chart
            .width(width)
            .height(300)
            .dimension(monthDimension)
            .x(d3.time.scale().domain([domain.start, domain.end]))          
            .xUnits(function(){ return 20;})
            .legend(dc.legend().x(0).y(10).itemHeight(10).itemWidth(150).horizontal(true).legendWidth(800))
            .margins({left: 65, top: 45, right: 55, bottom: 75})
            .brushOn(false)            
            .yAxisLabel("Monthly(MWh)")
            .shareTitle(false)
            .elasticY(true)
            .compose([
                    dc.barChart(chart)
                        .group(estimatedGroup, "Forecast Production")
                        .colors('#ff7364')
                        .xUnits(function(){ return 25;})
                        .gap(-6)
                        .centerBar(true)
                        .title(function(point: Point){ return `Forecast production ${format.monthly(point.key)} : ${numberScaleFormatter(point.value)} MWh`;}),      
                    dc.barChart(chart)
                        .group(producedGroup, "Energy Produced")
                        .colors('#1f77b4')
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Production ${format.monthly(point.key)} : ${numberScaleFormatter(point.value)} MWh`;}),                                                     
                    dc.lineChart(chart)
                        .group(postFilter(producedGroup), "Accumulated Production")
                        .title(function(point: Point){ return `Accumulated production ${format.monthly(point.key)} : ${numberScaleFormatter(point.value)} MWh`;})
                        .renderDataPoints(true)
                        .useRightYAxis(true)
                        .colors('#537111'),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedGroup), "Forecast Production Acc")
                        .title(function(point: Point){ return `Accumulated forecast production ${format.monthly(point.key)} : ${numberScaleFormatter(point.value)} MWh`;})
                        .renderDataPoints(true)
                        .colors('#E74C3C')
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(budgetGroup), "Budget Production Acc")
                        .title(function(point: Point){ return `Accumulated budget production ${format.monthly(point.key)} : ${numberScaleFormatter(point.value)} MWh`;})
                        .renderDataPoints(true)
                        .colors('#edc133')
                        .useRightYAxis(true)
            ]);
        
        chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%b')(tick);});              
 
        chart.
            yAxis().tickFormat(d3.format('.3s')); 

        chart       
            .rightYAxisLabel("Accumulated (MWh)"); 
            
        chart
            .rightYAxis().tickFormat(d3.format('.3s')); 

        calculateForecastMonthlyPercentages(dcData, width);
        calculateBudgetMonthlyPercentages(dcData,width);

        chart.on("renderlet",function(_chart) {
            _chart
                .selectAll("rect.bar")
                .on("click", function(ch) {
                    console.log("Month selected: " + ch.data.key.getMonth());                 
                    redrawAllGraphs(ch, dcData, width);
                });
        });

        chart.render();
    }

    function redrawAllGraphs(ch, dcData, w) {
        // Set init and end date for month selected
        let dateInit = new Date(ch.data.key.getFullYear(),ch.data.key.getMonth(),1);
        let dateEnd = new Date(ch.data.key.getFullYear(),ch.data.key.getMonth() + 1,0);
        calculateForecastMonthlyPercentages(dcData, w);
        calculateBudgetMonthlyPercentages(dcData,w);

        _ddailychart.redraw(dateInit, dateEnd, dcData);
    }
    
    function calculateForecastMonthlyPercentages(dcData, w){
        $('#dataTableMonthly').width(w - 130);
        let dim = dcData.monthDimension;
        
        let producedGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.producedEnergy});
        let estimatedGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.meteoEstimatedEnergy});

        let monthlyValues = new Array();
        let monthlyAcc = new Array();
        var productionSum = 0;
        var estimatedSum = 0;

        for(var i = 0; i<estimatedGroup.all().length; i++){
            var production = producedGroup.all()[i].value;
            var estimated = estimatedGroup.all()[i].value;
            productionSum += production;
            estimatedSum += estimated; 
            let valMonth = production === 0 ? NaN : ((( production / estimated ) * 100) - 100); 
            let valMonthAcc = productionSum === 0 ? NaN :((( productionSum / estimatedSum) * 100) - 100);
            monthlyValues.push({valueMonth: (!isNaN(valMonth) && isFinite(valMonth)) ? valMonth.toFixed(1) : '--', valueMonthClass: (valMonth >= 0) ? ((valMonth == 0)? 'blackValue': 'greenValue') : 'redValue'})
            monthlyAcc.push({acc: (!isNaN(valMonthAcc) && isFinite(valMonthAcc)) ? valMonthAcc.toFixed(1) : '--', accClass: (valMonthAcc >= 0) ? ((valMonthAcc == 0)? 'blackValue': 'greenValue') : 'redValue'})
        }

        ractive.set('forecastMonthly', monthlyValues);
        ractive.set('forecastAccMonth', monthlyAcc);
    }

        
    function calculateBudgetMonthlyPercentages(dcData, w){
        $('#dataTableMonthlyProduction').width(w - 130);
        let dim = dcData.monthDimension;
        
        let producedGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.producedEnergy});
        let budgetGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.innogyPrevisionedEnergy});

        let monthlyValues = new Array();
        let monthlyAcc = new Array();
        var productionSum = 0;
        var budgetdSum = 0;

        for(var i = 0; i<budgetGroup.all().length; i++){
            var production = producedGroup.all()[i].value;
            var budget = budgetGroup.all()[i].value;
            productionSum += production;
            budgetdSum += budget; 
            let valMonth = production === 0 ? NaN : ((( production / budget ) * 100) - 100); 
            let valMonthAcc = productionSum === 0 ? NaN :((( productionSum / budgetdSum) * 100) - 100);
            monthlyValues.push({valueMonth: (!isNaN(valMonth) && isFinite(valMonth)) ? valMonth.toFixed(1) : '--', valueMonthClass: (valMonth >= 0) ? ((valMonth == 0)? 'blackValue': 'greenValue') : 'redValue'})
            monthlyAcc.push({acc: (!isNaN(valMonthAcc) && isFinite(valMonthAcc)) ? valMonthAcc.toFixed(1) : '--', accClass: (valMonthAcc >= 0) ? ((valMonthAcc == 0)? 'blackValue': 'greenValue') : 'redValue'})
        }

        ractive.set('budgetMonthly', monthlyValues);
        ractive.set('budgetAccMonth', monthlyAcc);
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