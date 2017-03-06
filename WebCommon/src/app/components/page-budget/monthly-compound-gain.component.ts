declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';

export function MonthlyCompoundGainComponent() {
    
    let ractive: IRactive = undefined;
    let _dprodchart;
    let _dprodchart2;
    let _dprodchart3;
    
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
            <div class="title-small col-sm-12">
                MONTHLY - ACCUMULATED INCOMES vs BUDGET
            </div>
            <div class="notation-small">
                Yearly deviation: <span id="yearDev">{{yeardev}}%</span>            
                Monthly deviation on {{monthSelected}}: <span id="monthDev">{{monthdev}}%</span>
            </div>
            <div id="chart-monthly-compound-gain" class="info-chart">
            </div>
        `,
        data:{
            monthdev: 0,
            yeardev: 0,
            monthSelected: null
        } 
    };

    function init(elem, 
                  dcData,
                  dprodchart,
                  dprodchart2,
                  dprodchart3) {

        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        _dprodchart = dprodchart;
        _dprodchart2 = dprodchart2;
        _dprodchart3 = dprodchart3;
        
        drawChart('#chart-monthly-compound-gain',dcData);
        
    }

    function drawChart(elem,dcData) {

        let date = new Date();
        let actualMonth = date.getUTCMonth();
        const monthDimension = dcData.monthDimension;
        const incomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.productionIncome});
        const riGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.riIncome});
        const totalIncomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
        const estimatedIncomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});

        // Total year deviation
        let sumTotalIncomeGroup = 0; 
        totalIncomeGroup.all().forEach(function(v){sumTotalIncomeGroup = sumTotalIncomeGroup + v.value})
        
        let sumEstimatedIncomeGroup = 0; 
        estimatedIncomeGroup.all().forEach(function(v){sumEstimatedIncomeGroup = sumEstimatedIncomeGroup + v.value})
        
        let yeardev: any = (sumTotalIncomeGroup / sumEstimatedIncomeGroup) * 100;
        if(yeardev <= 100){
                yeardev = "-" + Math.abs(yeardev-100).toFixed(2);
                $('#yearDev').css('color','red');
                $('#yearDev').css('font-weight','bold');            
        }
        else{
            yeardev = Math.abs(yeardev-100).toFixed(2);
            $('#yearDev').css('color','green');
            $('#yearDev').css('font-weight','bold');
        }
        if(yeardev == "NaN" || yeardev == "Infinity")
            yeardev = "--";
        ractive.set('yeardev' , yeardev);

        // Actual deviation month
        let sumPartialIncomeGroup = 0; 
        totalIncomeGroup.all().filter(x => (date.getFullYear() == $('#current-year').html())? x.key.getMonth() == date.getMonth() :  x.key.getMonth() == 0)
                .forEach(function(v){sumPartialIncomeGroup = sumPartialIncomeGroup + v.value})
        
        let sumEstimatedPartialIncomeGroup = 0; 
        estimatedIncomeGroup.all().filter(x => (date.getFullYear() == $('#current-year').html())? x.key.getMonth() == date.getMonth() :  x.key.getMonth() == 0)
                .forEach(function(v){sumEstimatedPartialIncomeGroup = sumEstimatedPartialIncomeGroup + v.value})
        
        let monthdev: any = (sumPartialIncomeGroup / sumEstimatedPartialIncomeGroup) * 100;
        if(monthdev <= 100){
                monthdev = "-" + Math.abs(monthdev-100).toFixed(2);
                $('#monthDev').css('color','red');
                $('#monthDev').css('font-weight','bold');            
        }
        else{
            monthdev = Math.abs(monthdev-100).toFixed(2);
            $('#monthDev').css('color','green');
            $('#monthDev').css('font-weight','bold');
        }
        if(monthdev == "NaN" || monthdev == "Infinity")
            monthdev = "--";
        ractive.set('monthdev' , monthdev);
        ractive.set('monthSelected' , monthNames[actualMonth]);

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
            .height(250)
            .dimension(monthDimension)
            .x(d3.time.scale().domain([domain.start, domain.end]))          
            .xUnits(function(){ return 20;})
            .legend(dc.legend().x(56).y(200).itemHeight(10).itemWidth(150).horizontal(true).legendWidth(300))
            .margins({left: 45, top: 5, right: 60, bottom: 75})
            .brushOn(false)            
            .yAxisLabel("Monthly(€)")
            .shareTitle(false)
            .elasticY(true)
            .compose([
                    dc.barChart(chart)
                        .group(riGroup, "Investment Retribution")
                        .stack(incomeGroup,"Monthly Total Incomes")
                        .ordinalColors(['#537111','#93b940'])
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Incomes ${formater.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;}),
                    dc.lineChart(chart)
                        .group(postFilter(totalIncomeGroup), "Accumulated Incomes")
                        .title(function(point: Point){ return `Accumulated incomes ${formater.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .renderDataPoints(true)
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedIncomeGroup), "Budget Incomes")
                        .title(function(point: Point){ return `Budget incomes ${formater.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .renderDataPoints(true)
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

        /*chart.on("preRender",function(_chart) {
            _chart
                .selectAll("rect.bar")
                .on("click", function(ch) {
                    console.log("Month selected: " + ch.data.key.getMonth());
                    ractive.set('monthSelected',monthNames[ch.data.key.getMonth()]);
                    let monthdev = calculatePartialMonthDev(ch.data.key.getMonth(), dcData);
                   if(monthdev <= 100){
                        monthdev = "-" + Math.abs(monthdev-100).toFixed(2);
                        $('#monthDev').css('color','red');
                        $('#monthDev').css('font-weight','bold');            
                    }
                    else{
                        monthdev = Math.abs(monthdev-100).toFixed(2);
                        $('#monthDev').css('color','green');
                        $('#monthDev').css('font-weight','bold');
                    }
                    if(monthdev == "NaN" || monthdev == "Infinity")
                        monthdev = "--";
                    ractive.set('monthdev' , monthdev);
                    redrawAllGraphs(ch, dcData);
                });
        });*/

        chart.on("renderlet",function(_chart) {
            _chart
                .selectAll("rect.bar")
                .on("click", function(ch) {
                    console.log("Month selected: " + ch.data.key.getMonth());
                    ractive.set('monthSelected',monthNames[ch.data.key.getMonth()]);
                    let monthdev = calculatePartialMonthDev(ch.data.key.getMonth(), dcData);
                   if(monthdev <= 100){
                        monthdev = "-" + Math.abs(monthdev-100).toFixed(2);
                        $('#monthDev').css('color','red');
                        $('#monthDev').css('font-weight','bold');            
                    }
                    else{
                        monthdev = Math.abs(monthdev-100).toFixed(2);
                        $('#monthDev').css('color','green');
                        $('#monthDev').css('font-weight','bold');
                    }
                    if(monthdev == "NaN" || monthdev == "Infinity")
                        monthdev = "--";
                    ractive.set('monthdev' , monthdev);
                    redrawAllGraphs(ch, dcData);
                });
        });

        chart.render();

    }

    function calculatePartialMonthDev(month, dcData){
        // Actual deviation month
        const totalIncomeGroup = dcData.monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
        const estimatedIncomeGroup = dcData.monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});
        
        let sumPartialIncomeGroup = 0; 
        totalIncomeGroup.all().filter(x => x.key.getMonth() <= month).forEach(function(v){sumPartialIncomeGroup = sumPartialIncomeGroup + v.value})
        
        let sumEstimatedPartialIncomeGroup = 0; 
        estimatedIncomeGroup.all().filter(x => x.key.getMonth() <= month).forEach(function(v){sumEstimatedPartialIncomeGroup = sumEstimatedPartialIncomeGroup + v.value})
        
        let monthdev: any = (sumPartialIncomeGroup / sumEstimatedPartialIncomeGroup) * 100;
        return (monthdev.toFixed(2));
    }

    function redrawAllGraphs(ch, dcData) {
        // Set init and end date for month selected
        let dateInit = new Date(ch.data.key.getFullYear(),ch.data.key.getMonth(),1);
        let dateEnd = new Date(ch.data.key.getFullYear(),ch.data.key.getMonth() + 1,0);

        // Calculate each notation for month and charts
        let monthlyDev = calculateMonthDev(dateInit, dateEnd, dcData.dailyDimension);
        let avgDev = calculateAvgDev(dateInit, dateEnd, dcData.dailyDimension);
        let budgetReached = calculateBudgetReached(dateInit, dateEnd, dcData.dailyDimension);

        _dprodchart.redraw(dateInit, dateEnd, budgetReached);
        _dprodchart2.redraw(dateInit, dateEnd, avgDev);        
        _dprodchart3.redraw(dateInit, dateEnd, monthlyDev);

    }
    
    function calculateMonthDev(dateInit, dateEnd, dailyDimension){
      
        const totalIncomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
        const estimatedIncomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});
        
        let totalIncome = 0;
        totalIncomeGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd).forEach(function(v){totalIncome = totalIncome + v.value});
        let totalEstimated = 0;
        estimatedIncomeGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd).forEach(function(v){totalEstimated = totalEstimated + v.value});
        return (totalIncome / totalEstimated) * 100;
    }

    function calculateAvgDev(dateInit, dateEnd, dailyDimension){
        let returnEstimated =-1;
        
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

        const estimatedPriceGroup = dailyDimension.group().reduce(reduceByEstimated, reduceByEstimated, reduceInitial);
        const marketPriceGroup = dailyDimension.group().reduce(reduceByMarket, reduceByMarket, reduceInitial);
        
        let avgdev:any = 0;
        let estimatedPriceSum = 0;
        let estimatedValues = estimatedPriceGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        estimatedValues.forEach(function(v){estimatedPriceSum = estimatedPriceSum + v.value});
        let marketPriceSum = 0;
        let marketValues = marketPriceGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        marketValues.forEach(function(v){marketPriceSum = marketPriceSum + v.value});
        let prop = ((marketPriceSum / marketValues.length) / (estimatedPriceSum / estimatedValues.length)) * 100;
        (estimatedPriceSum < 0) ? prop = prop * (-1) : prop = prop;
        return prop - 100;

    }

    function calculateBudgetReached(dateInit, dateEnd, dailyDimension){
        const energyGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.producedEnergy});
        const estimatedEnergyGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.meteoEstimatedEnergy});
        
        let energyReached = 0;
        energyGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd).forEach(function(v){energyReached = energyReached + v.value});
        let energyEstimated = 0;
        estimatedEnergyGroup.all().filter(x => x.key >= dateInit && x.key <= dateEnd).forEach(function(v){energyEstimated = energyEstimated + v.value});   

        return (energyReached / energyEstimated) * 100;
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