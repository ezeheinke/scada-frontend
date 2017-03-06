declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';

export function IncomeTabDaily() {
    
    let ractive: IRactive = undefined;
    let _divIdName: string;
    let _dcData;
    let _elem;
    let _width = null;
    let chart;

    var monthNames = [
        "January", 
        "February", 
        "March", 
        "April", 
        "May", 
        "June",
        "July", 
        "August", 
        "September", 
        "October", 
        "November", 
        "December"
    ];

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small">
                {{currentMonth}}: DAILY - ACCUMULATED INCOMES VS BUDGET
            </div>
            <div id="chart-daily-income-tab" class="info-chart"></div>
            <div id="titleTableDaily" style="position: relative;display: block;float: left;">
                <table width="77px" border="1px solid #cecece;" style="border: 1px solid #cecece; border-right:0px solid;height: 32px;">                    
                    <tr id="daily">
                        <td style="font-weight: bold; font-size:10px;" class="blackValue">Daily (%)</td>
                    </tr>
                    <tr id="accumMonth">                        
                        <td style="font-weight: bold;" class="blackValue">Accum (%)</td>
                    </tr>
                </table>
            </div>
            <div id="dataTableDaily" style="position: relative;float:left; display:block;">
                <table width="100%" border="1px solid #cecece;" style="border: 1px solid #cecece;height: 32px;">     
                    <tr id="daily">
                        {{#daily}}
                        <td width="{{widthDays}}" style="font-size: 10px !important; border-left: 1px solid #cecece;" class="{{valueDayClass}}">{{valueDay}}</td>
                        {{/daily}}
                    </tr>
                    <tr id="accumDay">
                        {{#accDay}}
                        <td style="font-size: 10px !important; border-left: 1px solid #cecece;" class="{{accClass}}">{{acc}}</td>
                        {{/accDay}}
                    </tr>
                </table>                
            </div>
        ` ,
        data: {
            currentMonth: monthNames[0], // initially January
            days: [],
            daily: [],
            accDay: [],
            widthDays: 3.225
        }
    };
    

    function init(elem,dcData,divIdName,year) {
        _elem = elem;
        _dcData = dcData;
        _divIdName = divIdName;
        _width = $(elem).parent().innerWidth();        

        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        drawChart(divIdName,dcData, new Date(year,0,1), new Date(year,0,31));        
    }

    function redraw(dateInit, dateEnd, data, w) {       
        chart.x(d3.time.scale().domain([d3.time.day.offset(dateInit, -0.5), d3.time.day.offset(dateEnd, 0.5)])) ;
        calculateDailyPercentages(dateInit, dateEnd, data, w);
        ractive.set('currentMonth' , monthNames[dateInit.getMonth()]);        
        chart.render();                
    }
    
    const formater = dateTitleFormatter();

    function drawChart(elem,dcData,dateInit,dateEnd) {
        
        const dailyDimension = dcData.dailyDimension;
        const incomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.productionIncome});
        const riGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.riIncome});
        const totalIncomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
        const estimatedIncomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});

        const width = $(elem).parent().innerWidth();
        chart = dc.compositeChart(elem, 'IncomeGroup');
        const domain = dcData.domain;

        function postFilter(group) {
            return {
                all: function() {                    
                    var array = group.all()
                    .map(function(point: Point) {
                        return {
                            key: point.key,
                            value: point.value
                        };
                    });
                    var accum = 0;
                    array.forEach(function(point: Point, index) {
                        if (index===0 || (point.key.getDate() === 1 && point.key.getHours() === 0 && point.key.getMinutes() === 0)) accum = 0;                        
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
            .dimension(dailyDimension)
            .x(d3.time.scale().domain([d3.time.day.offset(dateInit, -0.7), d3.time.day.offset(dateEnd, 0.7)]))          
            .xUnits(function(){ return 50;})
            .legend(dc.legend().x(0).y(10).itemHeight(10).itemWidth(150).horizontal(true).legendWidth(800))
            .margins({left: 65, top: 45, right: 55, bottom: 75})
            .brushOn(false)            
            .yAxisLabel("Daily(€)")
            .shareTitle(false)
            .elasticY(true)
            .compose([
                    dc.barChart(chart)
                        .group(estimatedIncomeGroup, "Budget Income")
                        .colors('#ff7364')
                        .xUnits(function(){ return 25;})
                        .gap(-6)
                        .centerBar(true)
                        .title(function(point: Point){ return `Budget incomes ${formater.daily(point.key)} : ${numberScaleFormatter(point.value)} €`;}),
                    dc.barChart(chart)
                        .group(riGroup, "Investment Retribution")
                        .stack(incomeGroup,"Daily Total Incomes")
                        .ordinalColors(['#537111','#93b940'])
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Incomes  ${formater.daily(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .useRightYAxis(false),
                    dc.lineChart(chart)
                        .group(postFilter(totalIncomeGroup), "Accumulated Income")
                        .title(function(point: Point){ return `Accumulated incomes ${formater.daily(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .renderDataPoints(true)
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedIncomeGroup), "Budget Incomes Acc")
                        .title(function(point: Point){ return `Accumulated budget incomes ${formater.daily(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .renderDataPoints(true)
                        .colors('#E74C3C')
                        .useRightYAxis(true)
            ]);
        
        chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%d')(tick);});

        chart
            .yAxis().tickFormat(d3.format('.3s'));
        chart       
            .rightYAxisLabel("Accumulated (€)");             
        chart
            .rightYAxis().tickFormat(d3.format('.3s'));
        
        calculateDailyPercentages(dateInit, dateEnd, dcData, width);

        chart.render();
        //_chart = chart;
        //TODO: quick fix for elasticY problem..
        redraw(dateInit, dateEnd, dcData,width);
    }
    
    function calculateDailyPercentages(dateInit, dateEnd, dcData, w){
        $('#dataTableDaily').width(w - 130);
        let dim = dcData.dailyDimension;
        
        let totalIncomeGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome}).all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        let estimatedIncomeGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome}).all().filter(x => x.key >= dateInit && x.key <= dateEnd);

        let dailyValues = new Array();
        let dailyAcc = new Array();        
        let days = new Array();
        
        var incomeSum = 0;
        var estimatedSum = 0;
        var numDays = daysInMonth(dateInit.getMonth()+1,dateInit.getYear());
        ractive.set('widthDays', 100/numDays + '%');
        for(var i = 0; i<numDays; i++){
            if(estimatedIncomeGroup[i] != undefined){      
                var income = totalIncomeGroup[i].value;
                var estimated = estimatedIncomeGroup[i].value;
                incomeSum += income;
                estimatedSum += estimated; 
                let valDay = ((( income / estimated ) * 100) - 100); 
                let valDayAcc = ((( incomeSum / estimatedSum) * 100) - 100);            
                dailyValues.push({valueDay: (!isNaN(valDay) && isFinite(valDay)) ? valDay.toFixed(1) : '--', valueDayClass: (valDay >= 0) ? ((valDay == 0)? 'blackValue': 'greenValue') : 'redValue'});
                dailyAcc.push({acc: (!isNaN(valDayAcc) && isFinite(valDayAcc)) ? valDayAcc.toFixed(1) : '--', accClass: (valDayAcc >= 0) ? ((valDayAcc == 0)? 'blackValue': 'greenValue') : 'redValue'});                
            }
        }
        
        ractive.set('days', days);
        ractive.set('daily', dailyValues);
        ractive.set('accDay', dailyAcc);
    }

    function daysInMonth(month,year) {
        return new Date(year, month, 0).getDate();
    }
    
    function clean() {
        if (ractive)
            ractive.teardown();
    }

    return {
        init,
        clean,
        redraw
    };
}