declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';

export function DailyCompoundGain() {
    
    let ractive: IRactive = undefined;
    let _divIdName: string;
    let _dcData;
    let _elem;
    let _width = null;
    let _chart;
    let monthdev;

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
    const formater = dateTitleFormatter();
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small">
                {{currentMonth}}: DAILY - ACCUM. INCOMES VS BUDGET
            </div>
            <div class="notation-small">
                Monthly deviation: <span id="monthlyDev">{{monthlydev}}%</span>
            </div>
            <div id="chart-daily-composed" class="info-chart">
            </div>
        ` ,
        data: {
            currentMonth: monthNames[0], // initially January
            monthdev: 0
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

    function redraw(dateInit, dateEnd, monthlyDev) {       
        _chart.x(d3.time.scale().domain([
                dateInit,
                dateEnd
            ])) ;
        _chart.yAxis().tickFormat(d3.format('.3s'));
        _chart.rightYAxis().tickFormat(d3.format('.3s')); 
        _chart.render();
        ractive.set('currentMonth' , monthNames[dateInit.getMonth()]);
        if(monthlyDev <= 100){
                monthlyDev = "-" + Math.abs(monthlyDev-100).toFixed(2);
                $('#monthlyDev').css('color','red');
                $('#monthlyDev').css('font-weight','bold');            
        }
        else{
            monthlyDev = Math.abs(monthlyDev-100).toFixed(2);
            $('#monthlyDev').css('color','green');
            $('#monthlyDev').css('font-weight','bold');
        }
        if(monthlyDev == "NaN" || monthlyDev == "Infinity")
            monthlyDev = "--";
        ractive.set('monthlydev' , monthlyDev);
    }

    function drawChart(elem,dcData,dateInit,dateEnd) {
        
        const dailyDimension = dcData.dailyDimension;
        const incomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.productionIncome});
        const riGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.riIncome});
        const totalIncomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
        const estimatedIncomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});

        let totalIncome = 0;
        totalIncomeGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd).forEach(function(v){totalIncome = totalIncome + v.value});
        let totalEstimated = 0;
        estimatedIncomeGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd).forEach(function(v){totalEstimated = totalEstimated + v.value});
        
        let monthlyDev: any = (totalIncome / totalEstimated) * 100;

        if(monthlyDev <= 100){
                monthlyDev = "-" + Math.abs(monthlyDev-100).toFixed(2) ;
                $('#monthlyDev').css('color','red');
                $('#monthlyDev').css('font-weight','bold');            
        }
        else{
            monthlyDev = Math.abs(monthlyDev-100).toFixed(2);
            $('#monthlyDev').css('color','green');
            $('#monthlyDev').css('font-weight','bold');
        }
        if(monthlyDev == "NaN" || monthlyDev == "Infinity")
            monthlyDev = "--";
        ractive.set('monthlydev' , monthlyDev);

        const width = $(elem).parent().innerWidth();
        var chart = dc.compositeChart(elem, 'SummaryGroup');
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
            .height(250)
            .dimension(dailyDimension)
            .x(d3.time.scale().domain([d3.time.hour.offset(dateInit, -10), d3.time.hour.offset(dateEnd, 10)]))          
            .xUnits(function(){ return 50;})
            .legend(dc.legend().x(56).y(200).itemHeight(10).itemWidth(150).horizontal(true).legendWidth(300))
            .margins({left: 45, top: 5, right: 60, bottom: 75})
            .brushOn(false)            
            .yAxisLabel("Daily(€)")
            .shareTitle(false)
            .elasticY(false)
            .compose([
                    dc.barChart(chart)
                        .group(riGroup, "Investment Retribution")
                        .stack(incomeGroup,"Daily Total Incomes")
                        .ordinalColors(['#537111','#93b940'])
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Incomes ${formater.daily(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .useRightYAxis(false),
                    dc.lineChart(chart)
                        .group(postFilter(totalIncomeGroup), "Accumulated Incomes")
                        .title(function(point: Point){ return `Accumulated incomes ${formater.daily(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .renderDataPoints(true)
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedIncomeGroup), "Budget Incomes")
                        .title(function(point: Point){ return `Budget incomes ${formater.daily(point.key)} : ${numberScaleFormatter(point.value)} €`;})
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
            
        chart.render();
        _chart = chart;
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