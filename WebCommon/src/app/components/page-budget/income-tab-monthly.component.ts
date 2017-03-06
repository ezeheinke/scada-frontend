declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';

export function IncomeTabMonthly() {
    
    let ractive: IRactive = undefined;
    let _dmonthlychart;    
    let _ddailychart;  

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small col-sm-12">
                MONTHLY - ACCUMULATED INCOMES vs BUDGET
            </div>
            <div id="chart-monthly-income-tab" class="info-chart"></div>
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
                        {{#monthly}}
                        <td width="8.3333%;" class="{{valueMonthClass}}" style="border-left: 1px solid #cecece;">{{valueMonth}}</td>
                        {{/monthly}}
                    </tr>
                    <tr id="accumMonth">
                        {{#accMonth}}
                        <td class="{{accClass}}" style="border-left: 1px solid #cecece;">{{acc}}</td>
                        {{/accMonth}}
                    </tr>
                </table>
            </div>
        `,
        data: { 
                monthly: [],
                accMonth: []
            }
        };

    const formater = dateTitleFormatter();

    function init(elem, dcData, dailychart) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        _ddailychart = dailychart;   
        drawChart('#chart-monthly-income-tab',dcData);        
    }

    function drawChart(elem,dcData) {
        const monthDimension = dcData.monthDimension;
        const incomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.productionIncome});
        const riGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.riIncome});
        const totalIncomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
        const estimatedIncomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});

        const width = $(elem).parent().innerWidth();
        let chart = dc.compositeChart(elem, 'IncomeGroup');
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
            .yAxisLabel("Monthly(€)")
            .shareTitle(false)
            .elasticY(true)
            .compose([
                    dc.barChart(chart)
                        .group(estimatedIncomeGroup, "Budget Income")
                        .colors('#ff7364')
                        .xUnits(function(){ return 25;})
                        .gap(-6)
                        .centerBar(true)
                        .title(function(point: Point){ return `Budget incomes ${formater.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;}),
                    dc.barChart(chart)
                        .group(riGroup, "Investment Retribution")
                        .stack(incomeGroup,"Monthly Total Incomes")
                        .ordinalColors(['#537111','#93b940'])
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Incomes ${formater.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;}),                    
                    dc.lineChart(chart)
                        .group(postFilter(totalIncomeGroup), "Accumulated Income")
                        .renderDataPoints(true)
                        .title(function(point: Point){ return `Accumulated incomes ${formater.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedIncomeGroup), "Budget Income Acc")
                        .renderDataPoints(true)
                        .title(function(point: Point){ return `Accumulated budget incomes ${formater.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .colors('#E74C3C')
                        .useRightYAxis(true)
            ]);
        
        chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%b')(tick);});              
 
        chart.
            yAxis().tickFormat(d3.format('.3s')); 

        chart       
            .rightYAxisLabel("Accumulated (€)"); 
            
        chart
            .rightYAxis().tickFormat(d3.format('.3s')); 

        calculateMonthlyPercentages(dcData, width);

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
        calculateMonthlyPercentages(dcData, w);
        _ddailychart.redraw(dateInit, dateEnd, dcData,w);
        //TODO: quick fix for elasticY problem..
        _ddailychart.redraw(dateInit, dateEnd, dcData,w);
    }
    
    function calculateMonthlyPercentages(dcData, w){
        $('#dataTableMonthly').width(w - 130);
        let dim = dcData.monthDimension;
        
        let totalIncomeGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
        let estimatedIncomeGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});

        let monthlyValues = new Array();
        let monthlyAcc = new Array();
        var incomeSum = 0;
        var estimatedSum = 0;

        for(var i = 0; i<estimatedIncomeGroup.all().length; i++){
            var income = totalIncomeGroup.all()[i].value;
            var estimated = estimatedIncomeGroup.all()[i].value;
            incomeSum += income;
            estimatedSum += estimated; 
            let valMonth = ((( income / estimated ) * 100) - 100); 
            let valMonthAcc = ((( incomeSum / estimatedSum) * 100) - 100);
            monthlyValues.push({valueMonth: (!isNaN(valMonth) && isFinite(valMonth)) ? valMonth.toFixed(1) : '--', valueMonthClass: (valMonth >= 0) ? ((valMonth == 0)? 'blackValue': 'greenValue') : 'redValue'})
            monthlyAcc.push({acc: (!isNaN(valMonthAcc) && isFinite(valMonthAcc)) ? valMonthAcc.toFixed(1) : '--', accClass: (valMonthAcc >= 0) ? ((valMonthAcc == 0)? 'blackValue': 'greenValue') : 'redValue'})
        }

        ractive.set('monthly', monthlyValues);
        ractive.set('accMonth', monthlyAcc);
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