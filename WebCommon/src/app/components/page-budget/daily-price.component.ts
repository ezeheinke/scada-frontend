declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';
import Ractive from 'ractive';

export function DailyPriceComponent() {
    
    let ractive: IRactive = undefined;
    let _divIdName: string;
    //let _dcData;
    //let _elem;
    let _width = null;
    let _chart;
    let avgdev;

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
                 {{currentMonth}}: ENERGY PRICES
            </div>
            <div class="notation-small">
                Avg. Deviation: <span id="avgdev">{{avgdev}}%</span>
            </div>
            <div id="chart-daily-prices" class="info-chart">
            </div>
        `,
        data: {
            currentMonth: monthNames[0], // initially January
            avgdev: 0
        } 
    };

    function init(elem,dcData,divIdName,year) {
       // _elem = elem;
        //_dcData = dcData;
        _divIdName = divIdName;
        _width = $(elem).parent().innerWidth();
        

        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        drawChart(divIdName,dcData, new Date(year,0,1), new Date(year,0,31));            
    }

    function redraw(dateInit, dateEnd, avgDev) {        
        _chart.xAxis().tickFormat(function(tick){ return d3.time.format('%d')(tick);});        
        _chart.yAxis().tickFormat(d3.format('.3s')); 
        _chart.x(d3.time.scale().domain([dateInit, dateEnd])) ;
        _chart.render();
        ractive.set('currentMonth' , monthNames[dateInit.getMonth()]);
        if(avgDev < 0){
            avgDev = "-" + Math.abs(avgDev).toFixed(2);
            $('#avgdev').css('color','red');
            $('#avgdev').css('font-weight','bold');
        }
        else{
            avgDev = "+" + Math.abs(avgDev).toFixed(2);
            $('#avgdev').css('color','green');
            $('#avgdev').css('font-weight','bold');
        }
        if(avgDev == "NaN" || avgDev == "Infinity")
            avgDev = "--";
        ractive.set('avgdev' , avgDev);
    }

    function drawChart(elem,dcData,dateInit,dateEnd) {   
        avgdev = 0;     
        const dailyDimension = dcData.dailyDimension;

        let returnEstimated = -1;

        function reduceByEstimated(current:BudgetAssetRecord, newValue:BudgetAssetRecord) {
            if(newValue.estimatedPrice != 0) {
                returnEstimated = newValue.estimatedPrice;
            }
            return returnEstimated;
        }

        function reduceByMarket(current:BudgetAssetRecord, newValue:BudgetAssetRecord) {
            return newValue.marketPrice;
        }

        
        function reduceInitial() {
            let newasset : BudgetAssetRecord = {
                date: null,
                dateParsed:null,
                monthParsed: null,
                assetId : null,
                producedEnergy: null,
                meteoEstimatedEnergy: null,
                innogyPrevisionedEnergy: null,
                realPenalties: null,
                estimatedPenalties: null,
                marketPrice: null,
                estimatedPrice: null,
                cscadaEnergy: null,
                riIncome: null,
                productionIncome: null,
                totalIncome: null,
                estimatedIncome: null
            }
            return newasset;
        }
        
        function remove_empty_bins(source_group) {
            return {
                all:function () {
                    return source_group.all().filter(function(d) {
                        return d.value != 0;
                    });
                }
            };
        }


        const estimatedPriceGroup = dailyDimension.group().reduce(reduceByEstimated, reduceByEstimated, reduceInitial);
        const marketPriceGroup = dailyDimension.group().reduce(reduceByMarket, reduceByMarket, reduceInitial);
        
        let estimatedPriceSum = 0;
        let estimatedValues = estimatedPriceGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        estimatedValues.forEach(function(v){estimatedPriceSum = estimatedPriceSum + v.value});
        let marketPriceSum = 0;
        let marketValues = marketPriceGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        marketValues.forEach(function(v){marketPriceSum = marketPriceSum + v.value});
        let prop = ((marketPriceSum / marketValues.length) / (estimatedPriceSum / estimatedValues.length)) * 100;
        (estimatedPriceSum < 0) ? prop = prop * (-1) : prop = prop;
        prop = prop-100;
        if(prop < 0){
            avgdev = "-" + Math.abs(prop).toFixed(2);
            $('#avgdev').css('color','red');
            $('#avgdev').css('font-weight','bold');
        }
        else{
            avgdev = "+" + Math.abs(prop).toFixed(2);
            $('#avgdev').css('color','green');
            $('#avgdev').css('font-weight','bold');
        }
        if(avgdev == "NaN" || avgdev == "Infinity")
            avgdev = "--";
        ractive.set('avgdev' , avgdev);
        
        //const width = $(elem).parent().innerWidth();
        if($(elem).parent().innerWidth() !== null)
            _width = $(elem).parent().innerWidth();
        
        const width = _width;
        var chart = dc.compositeChart(elem, 'SummaryGroup');
        const domain = dcData.domain;

        chart
            .width(width)
            .height(250)
            .dimension(dailyDimension)
            .x(d3.time.scale().domain([
                dateInit,
                dateEnd
            ]))          
            .legend(dc.legend().x(56).y(200).itemHeight(10).itemWidth(150).legendWidth(300))
            .margins({left: 45, top: 5, right: 15, bottom: 75})
            .brushOn(false)
            .yAxisLabel("Price (€/MWh)")
            .shareTitle(false)
            .elasticY(false)
            .compose([                
                dc.lineChart(chart)
                    .group(estimatedPriceGroup,"MTP Price")
                    .colors("#E74C3C")
                    .interpolate("monotone") 
                    .renderArea(false)
                    .title(function(point: Point){ return `MTP price ${formater.daily(point.key)}: ${numberScaleFormatter(point.value)} €`;}),
                dc.lineChart(chart)
                    .group(marketPriceGroup,"Pool Price")
                    .colors("#93b940")
                    .interpolate("monotone") 
                    .renderDataPoints(true)
                    .renderArea(false)
                    .title(function(point: Point){ return `Pool price ${formater.daily(point.key)}: ${numberScaleFormatter(point.value)} €`;}),
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