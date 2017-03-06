declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';

export function DailyProductionPrevisionComponent() {
    
    let ractive: IRactive = undefined;
    let _divIdName: string;
    let _dcData;
    let _elem;
    let _width = null;
    let _chart;

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
                {{currentMonth}}: NET PRODUCTION vs FORECAST 
            </div>         
            <div class="notation-small">
                Budget Reached: <span id="budgetReached">{{budgetreached}}%</span>
            </div>   
            <div id="chart-daily-production-prevision" class="info-chart">
            </div>
        ` ,
        data: {
            currentMonth: monthNames[0], // initially January
            budgetreached: 0
        }
    };
    
    const formater = dateTitleFormatter();

    function init(elem,dcData,divIdName,year) {
        _elem = elem;
        _dcData = dcData;
        _divIdName = divIdName;
        _width = $(elem).parent().innerWidth();

        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        drawChart(divIdName,dcData, new Date(year,0,1), new Date(year,0,31));        
    }

    function redraw(dateInit, dateEnd, budgetReached) {
        _chart.x(d3.time.scale().domain([dateInit, dateEnd]));
        _chart.yAxis().tickFormat(d3.format('.3s')); 
        ractive.set('currentMonth' , monthNames[dateInit.getMonth()]);
        if(budgetReached <= 100){
                budgetReached = Math.abs(budgetReached).toFixed(2);
                $('#budgetReached').css('color','red');
                $('#budgetReached').css('font-weight','bold');            
        }
        else{
            budgetReached = Math.abs(budgetReached).toFixed(2);
            $('#budgetReached').css('color','green');
            $('#budgetReached').css('font-weight','bold');
        }
        if(budgetReached == "NaN" || budgetReached == "Infinity")
            budgetReached = "--";
        ractive.set('budgetreached' , budgetReached);
        
        _chart.render();
    }

    
    function drawChart(elem,dcData,dateInit,dateEnd) {
        
        const dailyDimension = dcData.dailyDimension;
        const productionGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.producedEnergy });
        const previsionGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.meteoEstimatedEnergy});
        
        let energyReached = 0;
        productionGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd).forEach(function(v){energyReached = energyReached + v.value});
        let energyEstimated = 0;
        previsionGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd).forEach(function(v){energyEstimated = energyEstimated + v.value});   

       let budgetReached: any = (energyReached / energyEstimated) * 100;

       if(budgetReached <= 100){
                budgetReached = Math.abs(budgetReached).toFixed(2);
                $('#budgetReached').css('color','red');
                $('#budgetReached').css('font-weight','bold');            
        }
        else{
            budgetReached = Math.abs(budgetReached).toFixed(2);
            $('#budgetReached').css('color','green');
            $('#budgetReached').css('font-weight','bold');
        }
        if(budgetReached == "NaN" || budgetReached == "Infinity")
            budgetReached = "--";
        ractive.set('budgetreached' , budgetReached);

        //const width = $(elem).parent().innerWidth();
        if($(elem).parent().innerWidth() !== null)
            _width = $(elem).parent().innerWidth();
        
        const width = _width;
        var chart = dc.compositeChart(elem, 'SummaryGroup');
        const domain = dcData.domain;

        chart
            .width(width+10)
            .height(250)
            .dimension(dailyDimension)
            .x(d3.time.scale().domain([d3.time.hour.offset(dateInit, -10), d3.time.hour.offset(dateEnd, 10)]))          
            .xUnits(function(){ return 50;})
            .legend(dc.legend().x(56).y(200).itemHeight(10).itemWidth(150).legendWidth(300))
            .margins({left: 45, top: 5, right: 15, bottom: 75})
            .brushOn(false)
            .yAxisLabel("Energy (MWh)")
            .shareTitle(false)
            .elasticY(false)
            .compose([
                    dc.barChart(chart)
                    .group(previsionGroup,"Forecast")
                    .colors("#E74C3C")
                    .gap(0)
                    .centerBar(true)
                    .title(function(point: Point){ return `Forecast energy ${formater.daily(point.key)} : ${numberScaleFormatter(point.value)} MWh`;}),
                    dc.barChart(chart)
                    .group(productionGroup,"Net Production")
                    .colors("#1F77B4")
                    .centerBar(true)
                    .gap(2)
                    .title(function(point: Point){ return `Real energy ${formater.daily(point.key)}: ${numberScaleFormatter(point.value)} MWh`;})
            ]);

         chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%d')(tick);});
        
        chart.
            yAxis().tickFormat(d3.format('.3s')); 
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