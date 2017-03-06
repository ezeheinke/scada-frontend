declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';

export function ProductionTabDaily() {
    
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
                {{currentMonth}}: DAILY - NET PRODUCTION VS FORECAST
            </div>
            <div id="chart-daily-production-tab" class="info-chart"></div>
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

    const format = dateTitleFormatter();

    function drawChart(elem,dcData,dateInit,dateEnd) {
        
        const dailyDimension = dcData.dailyDimension;
        const producedEnergyGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.producedEnergy});
        const estimatedEnergyGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.meteoEstimatedEnergy});

        const width = $(elem).parent().innerWidth();
        chart = dc.compositeChart(elem, 'ProductionGroup');
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
            .yAxisLabel("Daily(MWh)")
            .shareTitle(false)
            .elasticY(true)
            .compose([
                    dc.barChart(chart)
                        .group(estimatedEnergyGroup, "Forecasted Production")
                        .colors('#ff7364')
                        .xUnits(function(){ return 25;})
                        .gap(-6)
                        .centerBar(true)
                        .title(function(point: Point){ return `Forecasted production ${format.daily(point.key)} : ${numberScaleFormatter(point.value)} MWh`;}),
                    dc.barChart(chart)
                        .group(producedEnergyGroup, "Energy Produced")
                        .colors('#1f77b4')
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Production ${format.daily(point.key)} : ${numberScaleFormatter(point.value)} MWh`;})
                        .useRightYAxis(false),
                    dc.lineChart(chart)
                        .group(postFilter(producedEnergyGroup), "Accumulated Production")
                        .colors('#537111')
                        .title(function(point: Point){ return `Acc production ${format.daily(point.key)} : ${numberScaleFormatter(point.value)} MWh`;})
                        .renderDataPoints(true)
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedEnergyGroup), "Forecasted Production Acc")
                        .title(function(point: Point){ return `Acc forecasted production ${format.daily(point.key)} : ${numberScaleFormatter(point.value)} MWh`;})
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
            .rightYAxisLabel("Accumulated (MWh)");             
        chart
            .rightYAxis().tickFormat(d3.format('.3s'));
        
        calculateDailyPercentages(dateInit, dateEnd, dcData, width);

        chart.render();
    }
    
    function calculateDailyPercentages(dateInit, dateEnd, dcData, w){
        $('#dataTableDaily').width(w - 130);
        let dim = dcData.dailyDimension;
        
        let producedEnergyGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.producedEnergy}).all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        let estimatedGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.meteoEstimatedEnergy}).all().filter(x => x.key >= dateInit && x.key <= dateEnd);

        let dailyValues = new Array();
        let dailyAcc = new Array();        
        let days = new Array();
        
        var productionSum = 0;
        var estimatedSum = 0;
        var numDays = daysInMonth(dateInit.getMonth()+1,dateInit.getYear());
        ractive.set('widthDays', 100/numDays + '%');
        for(var i = 0; i<numDays; i++){
            if(estimatedGroup[i] != undefined){
                var production = producedEnergyGroup[i].value;
                var estimated = estimatedGroup[i].value;
                productionSum += production;
                estimatedSum += estimated; 
                let valDay = production === 0 ? NaN :((( production / estimated ) * 100) - 100); 
                let valDayAcc = productionSum === 0 ? NaN :((( productionSum / estimatedSum) * 100) - 100);            
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