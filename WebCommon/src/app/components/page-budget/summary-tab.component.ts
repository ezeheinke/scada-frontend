declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter,CustomFormatModule,ManualMegaWattsFormater,MonthNames} from '../../utils';
import {StateContainerService} from '../../services/state-container.service';

export function SummaryTabComponent() {

    let ractive: IRactive = undefined;
    interface DayChartCallback {

        (dateInit:Date,dcData:any):void;
    }

    const groupedChartsName = 'SummaryGroup';
    const customFormat = CustomFormatModule();

    const penaltyRealEuro = 86.998;
    const formater = dateTitleFormatter();
    const megaWattsFormat = ManualMegaWattsFormater();

    const ractiveData = {
        el: undefined,
        template: `
            <div class="row row-with-divider">
               <div class="col-md-12 info-item">
                    <div id="yearly-production"> 
                        <div class="title-small">
                            YEARLY NET PRODUCTION
                        </div>
                        <div id="chart-yearly-production" class="info-chart">
                        </div>                       
                    </div>                    
                </div>
            </div>
            <div class="row row-with-divider">
                <div class="col-sm-6 info-item">
                    <div id="monthly-compound-gain">
                        <div class="title-small col-sm-12">
                            MONTHLY - ACCUMULATED INCOMES vs BUDGET
                        </div>
                        <div class="notation-small">
                            Yearly deviation: <span id="yearDev">{{yeardev}}%</span>            
                        </div>
                        <div id="chart-monthly-compound-gain" class="info-chart">
                        </div>                      
                    </div> 
                </div>
                <div class="col-sm-6 info-item">
                    <div id="monthly-penalties">
                        <div class="title-small col-sm-12">
                            MONTHLY - ACCUMULATED POWER FACTOR PENALTY
                        </div>            
                        <div class="notation-small">
                            Penalty Real Acc: <span id="penaltyreal">{{penaltyreal}}€</span>
                        </div>
                        <div id="chart-cumulative-penalties" class="info-chart">
                        </div>                     
                    </div> 
                </div>
            </div>
            <div class="row row-without-divider">
                <div class="col-sm-4 info-item">
                    <div id="daily-composed">  
                        <div class="title-small">
                            {{currentMonth}}: DAILY - ACCUM. INCOMES VS BUDGET
                        </div>
                        <div class="notation-small">
                            Monthly deviation: <span id="monthDevIncomeVsBudget">{{monthDevIncomeVsBudget}}%</span>
                        </div>
                        <div id="chart-daily-composed" class="info-chart">
                        </div>                      
                    </div> 
                </div>
                <div class="col-sm-4 info-item">
                    <div id="daily-prices">
                        <div class="title-small">
                            {{currentMonth}}: ENERGY PRICES
                        </div>
                        <div class="notation-small">
                            Avg. Deviation: <span id="monthDevEnergyPrices">{{monthDevEnergyPrices}}%</span>
                        </div>
                        <div id="chart-daily-prices" class="info-chart">
                        </div>                     
                    </div> 
                </div>
                <div class="col-sm-4 info-item">
                    <div id="daily-production-prevision">
                        <div class="title-small">
                            {{currentMonth}}: NET PRODUCTION vs FORECAST 
                        </div>         
                        <div class="notation-small">
                            Budget Reached: <span id="budgetReached">{{budgetReached}}%</span>
                        </div>   
                        <div id="chart-daily-production-prevision" class="info-chart">
                        </div>                      
                    </div> 
                </div>
            </div> 
        `,
        data:{
            yeardev: 0,
            monthDevIncomeVsBudget: 0,
            penaltyreal: 0,
            currentMonth: MonthNames[0], // initially January
            monthDevEnergyPrices : 0,
            budgetReached: 0
        } 
    };
    
    const stateContainer = StateContainerService();
    
    function init(elem,dcData,year) {
       
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        drawMonthlyPenaltiesChart('#chart-cumulative-penalties',dcData);
        
        var dailyIncomesCallback = drawDailyIncomesVsBudgetChart('#chart-daily-composed',dcData, new Date(year,0,1), new Date(year,0,31));        
        var dailyEnergyPricesCallback = drawDailyEnergyPrices('#chart-daily-prices',dcData, new Date(year,0,1), new Date(year,0,31));
        var dailyProductionCallback = drawDailyProductionVsForecast('#chart-daily-production-prevision',dcData, new Date(year,0,1), new Date(year,0,31));

        drawYearlyProductionChart('#chart-yearly-production', dcData,dailyIncomesCallback,dailyProductionCallback,year);
        drawMonthlyIncomesVsBudgetChart('#chart-monthly-compound-gain',dcData,
            dailyIncomesCallback,
            dailyEnergyPricesCallback,
            dailyProductionCallback);

    }
    
    function drawYearlyProductionChart(elem, dcData,
        dailyBudgetCallback:DayChartCallback,
        dailyProductionCallback:DayChartCallback,
        year) {
        
        const assetDimension = dcData.assetDimension;
        const producedEnergyGroup = assetDimension.group().reduceSum(function (record: BudgetAssetRecord) {return record.producedEnergy});
        
        const width = $(elem).parent().innerWidth();
        var chart = dc.barChart(elem, groupedChartsName);
        chart
            .width(width)
            .height(250)
            .dimension(assetDimension)
            .group(producedEnergyGroup,"Produced Energy")
            .title(function(point: Point){ return `Energy produced ${megaWattsFormat(point.value)}`;})
            .yAxisLabel("Energy (MWh)")
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .barPadding(0.1)
            .elasticY(true)
            .margins({top: 25, right: 0, bottom: 65, left: 65});
                    
        chart.yAxis().tickFormat(customFormat.getFunc); 
        chart.render();
        
        chart.on("filtered",function(chart) {
                var month = MonthNames.indexOf(ractive.get('currentMonth'));
                dailyBudgetCallback(new Date(year,month,1),dcData);
                dailyProductionCallback(new Date(year,month,1),dcData);
        });

    }


    function drawMonthlyIncomesVsBudgetChart(elem,dcData,
        dailyBudgetCallback:DayChartCallback,
        dailyPricesCallback:DayChartCallback,
        dailyProductionCallback:DayChartCallback) {

        const monthDimension = dcData.monthDimension;
        const incomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.productionIncome});
        const riGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.riIncome});
        const totalIncomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
        const estimatedIncomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});

        // Actual deviation month
        // let actualMonth = new Date().getUTCMonth();
        /*let sumPartialIncomeGroup = 0; 
        totalIncomeGroup.all().filter(x => (date.getFullYear() == $('#current-year').html())? x.key.getMonth() == date.getMonth() :  x.key.getMonth() == 0)
                .forEach(function(v){sumPartialIncomeGroup = sumPartialIncomeGroup + v.value})
        
        let sumEstimatedPartialIncomeGroup = 0; 
        estimatedIncomeGroup.all().filter(x => (date.getFullYear() == $('#current-year').html())? x.key.getMonth() == date.getMonth() :  x.key.getMonth() == 0)
                .forEach(function(v){sumEstimatedPartialIncomeGroup = sumEstimatedPartialIncomeGroup + v.value})
        
        setDeviation('monthdev',(sumPartialIncomeGroup / sumEstimatedPartialIncomeGroup) * 100);
        
        ractive.set('monthSelected' , monthNames[actualMonth]);
        */
        const width = $(elem).parent().innerWidth();
        var chart = dc.compositeChart(elem, groupedChartsName);
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
                        .title(function(point: Point){ return `Incomes ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;}),
                    dc.lineChart(chart)
                        .group(postFilter(totalIncomeGroup), "Accumulated Incomes")
                        .title(function(point: Point){ return `Accumulated incomes ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .renderDataPoints(true)
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedIncomeGroup), "Budget Incomes")
                        .title(function(point: Point){ return `Budget incomes ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .renderDataPoints(true)
                        .colors('#E74C3C')
                        .useRightYAxis(true)
            ]);
        
        chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%b')(tick);});              
 
        chart.
            yAxis().tickFormat(customFormat.getFunc); 

        chart       
            .rightYAxisLabel("Accumulated (€)"); 
            
        chart
            .rightYAxis().tickFormat(customFormat.getFunc); 

        // Total year deviation
        let accumIncomes =  getYearlyTotalIncome(dcData.monthDimension);
        let accumEstimatedIncomes = getYearlyEstimatedIncome(dcData.monthDimension);
        setDeviation('yeardev','#yearDev',(accumIncomes / accumEstimatedIncomes) * 100);

        chart.on("preRedraw",function(chart) {
            let newAccumTotal =  getYearlyTotalIncome(dcData.monthDimension);
            let newAccumEstimated = getYearlyEstimatedIncome(dcData.monthDimension);
            setDeviation('yeardev','#yearDev',(newAccumTotal / newAccumEstimated) * 100);
        });

        ///Manual render the daily charts for the selected month
        chart.on("renderlet",function(_chart) {
            _chart
                .selectAll("rect.bar")
                .on("click", function(ch) {
                    // stateContainer.write("budgetFilters.date",ch.x);
                    
                    dailyBudgetCallback(ch.data.key,dcData);
                    dailyPricesCallback(ch.data.key,dcData);
                    dailyProductionCallback(ch.data.key,dcData);
                });
        });

        chart.render();

    }

    function getYearlyTotalIncome (dimension) {
        return dimension.group()
            .reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome})
            .all().reduce(function(acc,group){return acc + group.value},0);
    }

    function getYearlyEstimatedIncome(dimension) {
        return dimension.group()
            .reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome})
            .all().reduce(function(acc,group){return acc + group.value},0);
    }

    function getYearRealPenalties(dimension) {
        return dimension.group()
            .reduceSum(function(record:BudgetAssetRecord){ return record.realPenalties * -1 })
            .all().reduce(function(acc,group){return acc + group.value},0);
    }

    function getYearEstimatedPenalties(dimension) {
        return dimension.group()
            .reduceSum(function(record:BudgetAssetRecord){ return record.estimatedPenalties})
            .all().reduce(function(acc,group){return acc + group.value},0);
    }


    function drawMonthlyPenaltiesChart(elem,dcData) {
        const monthDimension = dcData.monthDimension;
        const realPenaltiesGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.realPenalties * -1 });
        const estimatedPenaltiesGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedPenalties});
        
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

        const width = $(elem).parent().innerWidth();
        var chart = dc.compositeChart(elem, groupedChartsName);
        
        chart
            .width(width)
            .height(250)
            .dimension(monthDimension)
            .x(d3.time.scale().domain([
                 dcData.domain.start,
                 dcData.domain.end
            ]))          
            .legend(dc.legend().x(56).y(200).itemHeight(10).itemWidth(150).legendWidth(300))
            .margins({left: 45, top: 5, right: 15, bottom: 75})
            .brushOn(false)
            .yAxisLabel("Penalty (MWh)")
            .shareTitle(false)
            .elasticY(true)
            .compose([
                dc.lineChart(chart)
                    .group(postFilter(realPenaltiesGroup),"Real Reactive Deviation")
                    .colors("#93b940")
                    .interpolate("monotone")                         
                    .renderDataPoints(true)
                    .renderArea(true)
                    .title(function(point: Point){ return `Real reactive deviation ${formater.monthly(point.key)}: ${megaWattsFormat(point.value)}`;}),
                dc.lineChart(chart)
                    .group(postFilter(estimatedPenaltiesGroup),"Reactive Deviation Budget")
                    .colors("#E74C3C")
                    .interpolate("monotone") 
                    .renderDataPoints(true)
                    .renderArea(true)
                    .title(function(point: Point){ return `Reactive deviation budget ${formater.monthly(point.key)}: ${megaWattsFormat(point.value)}`;}),
            ]);
        

        // Total year deviation
        let accumRealPenalties =  getYearRealPenalties(dcData.monthDimension);
        let accumEstimatedPenalties = getYearEstimatedPenalties(dcData.monthDimension);
        setPenalty('#penaltyreal','penaltyreal',accumRealPenalties,accumEstimatedPenalties);
        
        chart.on("preRedraw",function(chart) {
            let newAccumRealPenalties =  getYearRealPenalties(dcData.monthDimension);
            let newAccumEstimatedPenalties = getYearEstimatedPenalties(dcData.monthDimension);
        setPenalty('#penaltyreal','penaltyreal',newAccumRealPenalties,newAccumEstimatedPenalties);
        });

        chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%b')(tick);});       
       
 
        chart.
            yAxis().tickFormat(customFormat.getFunc); 
        chart.render();

    }

    function setPenalty (htmlClass:string,ractiveId:string,realValue,estimatedValue) {
        var formatNumber = d3.format(".4s");
        if(realValue >estimatedValue){
            ractive.set(ractiveId, "-" + formatNumber(realValue * penaltyRealEuro));
            $(htmlClass).css('color','red');
        }else{
            ractive.set(ractiveId, formatNumber(realValue * penaltyRealEuro));
            $(htmlClass).css('color','green');
        }$(htmlClass).css('font-weight','bold');   

    }

    function drawDailyIncomesVsBudgetChart(elem,dcData,dateInit,dateEnd) {
        
        const dailyDimension = dcData.dailyDimension;
        const incomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.productionIncome});
        const riGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.riIncome});
        const totalIncomeGroup = getTotalIncomeGroup(dailyDimension);
        const estimatedIncomeGroup = getEstimatedIncomeGroup(dailyDimension);

        const width = $(elem).parent().innerWidth();
        
        var chart = dc.compositeChart(elem,groupedChartsName);
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
            .elasticY(true)
            .compose([
                    dc.barChart(chart)
                        .group(riGroup, "Investment Retribution")
                        .stack(incomeGroup,"Daily Total Incomes")
                        .ordinalColors(['#537111','#93b940'])
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Incomes ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .useRightYAxis(false),
                    dc.lineChart(chart)
                        .group(postFilter(totalIncomeGroup), "Accumulated Incomes")
                        .title(function(point: Point){ return `Accumulated incomes ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .renderDataPoints(true)
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedIncomeGroup), "Budget Incomes")
                        .title(function(point: Point){ return `Budget incomes ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .renderDataPoints(true)
                        .colors('#E74C3C')
                        .useRightYAxis(true)
            ]);
        chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%d')(tick);});
        chart
            .yAxis().tickFormat(customFormat.getFunc);
        chart       
            .rightYAxisLabel("Accumulated (€)"); 
        chart
            .rightYAxis().tickFormat(customFormat.getFunc);
            
        chart.render();

        let chartCallback: DayChartCallback;
        chartCallback = function(selectedDate:Date,filteredData) {

            let newDateInit = new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
            let newDateEnd = new Date(selectedDate.getFullYear(),selectedDate.getMonth() + 1,0);
            ractive.set('currentMonth' , MonthNames[selectedDate.getMonth()]);
            
            let endDateCalculation = getLimitOfCalculation(newDateEnd);
            let totalGroup =  getTotalIncomeGroup(filteredData.dailyDimension).all().filter(x => x.key >= newDateInit && x.key <= endDateCalculation);
            let estimatedGroup = getEstimatedIncomeGroup(filteredData.dailyDimension).all().filter(x => x.key >= newDateInit && x.key <= endDateCalculation);

            let total = totalGroup.reduce(function(acc,group){return acc + group.value},0);
            let estimated = estimatedGroup.reduce(function(acc,group){return acc + group.value},0);
            setDeviation('monthDevIncomeVsBudget','#monthDevIncomeVsBudget',(total / estimated) * 100);

            chart.x(d3.time.scale().domain([d3.time.day.offset(newDateInit, -0.5), d3.time.day.offset(newDateEnd, 0.5)])) ;
            //double redraw necesarry for ElasticY bug..
            chart.redraw();
            chart.redraw();
        }
        chartCallback(dateInit,dcData);

        return chartCallback;
        
    }

    function drawDailyEnergyPrices(elem,dcData,dateInit,dateEnd) {   
        
        const dailyDimension = dcData.dailyDimension;
        const estimatedPriceGroup = getEstimatedPriceGroup(dailyDimension);
        const marketPriceGroup = getMarketPriceGroup(dailyDimension);
        
        function remove_empty_bins(source_group) {
            return {
                all:function () {
                    return source_group.all().filter(function(d) {
                        return d.value !== null;
                    });
                }
            };
        }
        
        let marketPriceGroupFiltered = remove_empty_bins(marketPriceGroup)
        
        const width = $(elem).parent().innerWidth();
        //Another group.. because does not depend in Assests..
        var chart = dc.compositeChart(elem, 'PricesGroup');
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
            .elasticY(true)
            .compose([                
                dc.lineChart(chart)
                    .group(estimatedPriceGroup,"MTP Price")
                    .colors("#E74C3C")
                    .interpolate("monotone") 
                    .renderArea(false)
                    .title(function(point: Point){ return `MTP price ${formater.daily(point.key)}: ${customFormat.getValue(point.value)} €`;}),
                dc.lineChart(chart)
                    .group(marketPriceGroupFiltered,"Pool Price")
                    .colors("#93b940")
                    .interpolate("monotone") 
                    .renderDataPoints(true)
                    .renderArea(false)
                    .title(function(point: Point){ return `Pool price ${formater.daily(point.key)}: ${customFormat.getValue(point.value)} €`;}),
            ]);


         chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%d')(tick);});
        
        chart.
            yAxis().tickFormat(customFormat.getFunc); 

        chart.render();


        let chartCallback: DayChartCallback;
        chartCallback = function(selectedDate:Date,filteredData) {

            let newDateInit = new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
            let newDateEnd = new Date(selectedDate.getFullYear(),selectedDate.getMonth() + 1,0);
            ractive.set('currentMonth' , MonthNames[selectedDate.getMonth()]);
            
            let endDateCalculation = getLimitOfCalculation(newDateEnd);
            let totalGroup =  getMarketPriceGroup(filteredData.dailyDimension).all().filter(x => x.key >= newDateInit && x.key <= endDateCalculation);
            let estimatedGroup = getEstimatedPriceGroup(filteredData.dailyDimension).all().filter(x => x.key >= newDateInit && x.key <= endDateCalculation);

            let total = totalGroup.reduce(function(acc,group){return acc + group.value},0);
            let estimated = estimatedGroup.reduce(function(acc,group){return acc + group.value},0);
            setDeviation('monthDevEnergyPrices','#monthDevEnergyPrices',(total / estimated) * 100);

            chart.x(d3.time.scale().domain([d3.time.day.offset(newDateInit, -0.5), d3.time.day.offset(newDateEnd, 0.5)])) ;
            //double redraw necesarry for ElasticY bug..
            chart.redraw();
            chart.redraw();
        }
        chartCallback(dateInit,dcData);

        return chartCallback;
    }

    function drawDailyProductionVsForecast(elem,dcData,dateInit, dateEnd) {

        const dailyDimension = dcData.dailyDimension;
        const productionGroup = getProducedEnergy(dailyDimension);
        const previsionGroup = getForecastEnergy(dailyDimension);
        
        const width = $(elem).parent().innerWidth();

        var chart = dc.compositeChart(elem, groupedChartsName);
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
            .elasticY(true)
            .compose([
                    dc.barChart(chart)
                    .group(previsionGroup,"Forecast")
                    .colors("#E74C3C")
                    .gap(0)
                    .centerBar(true)
                    .title(function(point: Point){ return `Forecast energy ${formater.daily(point.key)} : ${megaWattsFormat(point.value)}`;}),
                    dc.barChart(chart)
                    .group(productionGroup,"Net Production")
                    .colors("#1F77B4")
                    .centerBar(true)
                    .gap(2)
                    .title(function(point: Point){ return `Real energy ${formater.daily(point.key)}: ${megaWattsFormat(point.value)}`;})
            ]);

         chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%d')(tick);});
        
        chart.
            yAxis().tickFormat(d3.format(customFormat.getFunc)); 
        chart.render();
        

        let chartCallback: DayChartCallback;
        chartCallback = function(selectedDate:Date,filteredData) {
            
            let newDateInit = new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
            let newDateEnd = new Date(selectedDate.getFullYear(),selectedDate.getMonth() + 1,0);
            ractive.set('currentMonth' , MonthNames[selectedDate.getMonth()]);
            
            let endDateCalculation = getLimitOfCalculation(newDateEnd);
            let totalGroup =  getProducedEnergy(filteredData.dailyDimension).all().filter(x => x.key >= newDateInit && x.key <= endDateCalculation);
            let estimatedGroup = getForecastEnergy(filteredData.dailyDimension).all().filter(x => x.key >= newDateInit && x.key <= endDateCalculation);

            let total = totalGroup.reduce(function(acc,group){return acc + group.value},0);
            let estimated = estimatedGroup.reduce(function(acc,group){return acc + group.value},0);
            setGoalReached('budgetReached','#budgetReached',(total / estimated) * 100);
            
            chart.x(d3.time.scale().domain([d3.time.day.offset(newDateInit, -0.5), d3.time.day.offset(newDateEnd, 0.5)])) ;
            //double redraw necesarry for ElasticY bug..
            chart.redraw();
            chart.redraw();

        }
        chartCallback(dateInit,dcData);

        return chartCallback;
    }


    function getLimitOfCalculation(dateEnd:Date) {
        let today = new Date();
        let endDateCalculation = dateEnd;
        if (dateEnd > today)
            endDateCalculation = today;

        return   endDateCalculation;          

    }



    function getEstimatedIncomeGroup(dimension) {
        return dimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});
    }

    function getTotalIncomeGroup(dimension) {
        return dimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
    }

    function getEstimatedPriceGroup(dimension) {

        function reduceByEstimated(current:BudgetAssetRecord, newValue:BudgetAssetRecord) {
            return newValue.estimatedPrice;
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

        return dimension.group().reduce(reduceByEstimated, reduceByEstimated, reduceInitial);
    }

    function getMarketPriceGroup(dimension) {
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


        return dimension.group().reduce(reduceByMarket, reduceByMarket, reduceInitial);
    }

    function getProducedEnergy(dimension) {
        return dimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.producedEnergy });
    }

    function getForecastEnergy(dimension) {
        return dimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.meteoEstimatedEnergy});
    }

    function setGoalReached(deviationName: string,elemId: string,value) {

        if(value <= 100){
                value = Math.abs(value).toFixed(2);
                $(elemId).css('color','red');
                $(elemId).css('font-weight','bold');            
        }
        else{
            value = Math.abs(value).toFixed(2);
            $(elemId).css('color','green');
            $(elemId).css('font-weight','bold');
        }
        if(value == "NaN" || value == "Infinity")
            value = "--";
        ractive.set(deviationName , value);

    }

    function setDeviation(deviationName: string,elemId: string,value) {

        if(value <= 100){
                value = "-" + Math.abs(value-100).toFixed(2);
                $(elemId).css('color','red');
                $(elemId).css('font-weight','bold');            
        }
        else{
            value = Math.abs(value-100).toFixed(2);
            $(elemId).css('color','green');
            $(elemId).css('font-weight','bold');
        }
        if(value == "NaN" || value == "Infinity")
            value = "--";
        ractive.set(deviationName , value);

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