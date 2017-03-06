declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter,CustomFormatModule,MonthNames} from '../../utils';


export function IncomeTabComponent() {

    let ractive: IRactive = undefined;
    const groupedChartsName = 'IncomeGroup';
    const customFormat = CustomFormatModule();
    
    interface PercentageContainer {
        cssClass:string,
        value:string
    }
    interface DayChartCallback {

        (dateInit:Date,dcData:any,width:number):void;
    }

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="row row-with-divider">
               <div class="col-md-12 info-item">
                    <div id="yearly-income-tab"> 
                        <div class="title-small">
                            YEARLY INCOME
                        </div>
                        <div id="chart-yearly-income-tab" class="info-chart">
                        </div>
                    </div>                    
                </div>
            </div>
            <div class="row row-with-divider">
               <div class="col-md-12 info-item">
                    <div id="monthly-income-tab"> 
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
                                    <td width="8.3333%;" class="{{cssClass}}" style="border-left: 1px solid #cecece;">{{value}}</td>
                                    {{/monthly}}
                                </tr>
                                <tr id="accumMonth">
                                    {{#accMonth}}
                                    <td class="{{cssClass}}" style="border-left: 1px solid #cecece;">{{value}}</td>
                                    {{/accMonth}}
                                </tr>
                            </table>
                        </div>
                    </div>                    
                </div>
            </div>
            <div class="row row-without-divider">
               <div class="col-md-12 info-item">
                    <div id="daily-income-tab">  
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
                                    <td width="{{widthDays}}" style="font-size: 10px !important; border-left: 1px solid #cecece;" class="{{cssClass}}">{{value}}</td>
                                    {{/daily}}
                                </tr>
                                <tr id="accumDay">
                                    {{#accDay}}
                                    <td style="font-size: 10px !important; border-left: 1px solid #cecece;" class="{{cssClass}}">{{value}}</td>
                                    {{/accDay}}
                                </tr>
                            </table>                
                        </div>
                    </div>
                </div>
            </div> 
        `,
        data: { 
                currentMonth: MonthNames[0], // initially January
                monthly: Array<PercentageContainer>(),
                accMonth: Array<PercentageContainer>(),
                daily: [],
                accDay: [],
                widthDays: 3.225
            }
    };

    const formater = dateTitleFormatter();
   
    function init(elem,dcData,year) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);   

        var dailyChartCallback = drawDailyChart( '#chart-daily-income-tab',dcData, new Date(year,0,1), new Date(year,0,31));          
        drawYearlyChart('#chart-yearly-income-tab', dcData,dailyChartCallback,year);  
        drawMonthlyChart('#chart-monthly-income-tab',dcData,dailyChartCallback); 
    }
    
    function drawYearlyChart(elem, dcData,dailyChartCallback:DayChartCallback,year) {
        const assetDimension = dcData.assetDimension;
        const incomeGroup = assetDimension.group().reduceSum(function (record: BudgetAssetRecord) {return record.totalIncome});
        
        const width = $(elem).parent().innerWidth();
        var chart = dc.barChart(elem, groupedChartsName);
        chart
            .width(width)
            .height(250)
            .dimension(assetDimension)
            .group(incomeGroup,"Income")
            .title(function(point: Point){ return `Income at ${customFormat.getValue(point.value)} €`;})
            .yAxisLabel("Income (€)")
            .x(d3.scale.ordinal())
            .colors('#93b940')
            .xUnits(dc.units.ordinal)
            .barPadding(0.1)
            .elasticY(true)
            .margins({top: 25, right: 0, bottom: 65, left: 65});
                    
        chart.yAxis().tickFormat(customFormat.getFunc); 
        chart.render();
        
        chart.on("filtered",function(chart) {
                var month = MonthNames.indexOf(ractive.get('currentMonth'));
                dailyChartCallback(new Date(year,month,1),dcData,width);
        });


    }

    function drawMonthlyChart(elem,dcData,dailyChartCallback:DayChartCallback) {
        
        const monthDimension = dcData.monthDimension;
        const incomeGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.productionIncome});
        const riGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.riIncome});
        const totalIncomeGroup = getIncomeGroup(monthDimension);
        const estimatedIncomeGroup = getEstimatedIncomeGroup(monthDimension);

        const width = $(elem).parent().innerWidth();
        let chart = dc.compositeChart(elem, groupedChartsName);
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
                        .title(function(point: Point){ return `Budget incomes ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;}),
                    dc.barChart(chart)
                        .group(riGroup, "Investment Retribution")
                        .stack(incomeGroup,"Monthly Total Incomes")
                        .ordinalColors(['#537111','#93b940'])
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Incomes ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;}),                    
                    dc.lineChart(chart)
                        .group(postFilter(totalIncomeGroup), "Accumulated Income")
                        .renderDataPoints(true)
                        .title(function(point: Point){ return `Accumulated incomes ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedIncomeGroup), "Budget Income Acc")
                        .renderDataPoints(true)
                        .title(function(point: Point){ return `Accumulated budget incomes ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .colors('#E74C3C')
                        .useRightYAxis(true)
            ]);
        
        chart
            .xAxis().tickFormat(function(tick){ return d3.time.format('%b')(tick);});              
 
        chart.
            yAxis().tickFormat(customFormat.getFunc); 

        chart       
            .rightYAxisLabel("Accumulated (€)"); 
            
        chart
            .rightYAxis().tickFormat(customFormat.getFunc); 


        chart.on("renderlet",function(_chart) {
            _chart
                .selectAll("rect.bar")
                .on("click", function(ch) {
                    // stateContainer.write("budgetFilters.date",ch.x);
                    dailyChartCallback(ch.data.key,dcData,width);
                   // dc.renderAll();
                    //doDaylyCalculations(ch, dcData, width);
                });
        });

        // chart.filter(stateContainer.read("budgetFilters.date"));
        chart.render();
        
        calculateMonthlyPercentages('#dataTableMonthly',getIncomeGroup(dcData.monthDimension),
            getEstimatedIncomeGroup(dcData.monthDimension), width,'monthly','accMonth');
        chart.on("preRedraw",function(chart) {
            calculateMonthlyPercentages('#dataTableMonthly',getIncomeGroup(dcData.monthDimension),
                getEstimatedIncomeGroup(dcData.monthDimension), width,'monthly','accMonth');
        });
		
    }


    function drawDailyChart(elem,dcData,dateInit,dateEnd) {
        
        const dailyDimension = dcData.dailyDimension;
        const incomeGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.productionIncome});
        const riGroup = dailyDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.riIncome});
        const totalIncomeGroup = getIncomeGroup(dailyDimension);
        const estimatedIncomeGroup = getEstimatedIncomeGroup(dailyDimension);

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
                        .title(function(point: Point){ return `Budget incomes ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;}),
                    dc.barChart(chart)
                        .group(riGroup, "Investment Retribution")
                        .stack(incomeGroup,"Daily Total Incomes")
                        .ordinalColors(['#537111','#93b940'])
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Incomes  ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .useRightYAxis(false),
                    dc.lineChart(chart)
                        .group(postFilter(totalIncomeGroup), "Accumulated Income")
                        .title(function(point: Point){ return `Accumulated incomes ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .renderDataPoints(true)
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedIncomeGroup), "Budget Incomes Acc")
                        .title(function(point: Point){ return `Accumulated budget incomes ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;})
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
            chartCallback = function(selectedDate:Date,filteredData,width:number) {

                let newDateInit = new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
                let newDateEnd = new Date(selectedDate.getFullYear(),selectedDate.getMonth() + 1,0);
                ractive.set('currentMonth' , MonthNames[selectedDate.getMonth()]);
                calculateDailyPercentages('#dataTableDaily',newDateInit, newDateEnd, filteredData,width);
                chart.x(d3.time.scale().domain([d3.time.day.offset(newDateInit, -0.5), d3.time.day.offset(newDateEnd, 0.5)])) ;
                chart.redraw();
                chart.redraw();
            }
            
            chartCallback(dateInit,dcData,width);
            return chartCallback;
        }

    
    
    function calculateDailyPercentages(idHtml:string,dateInit, dateEnd, dcData, w){
        $(idHtml).width(w - 130);
        let dim = dcData.dailyDimension;
        
        //array of a.key,a.value
        let primaryArray = getIncomeGroup(dim).all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        let secondaryArray = getEstimatedIncomeGroup(dim).all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        
        let primaryAccum = getAccum(primaryArray);
        let secondaryAccum = getAccum(secondaryArray);
        
        let max = Math.max(primaryAccum.length,secondaryAccum.length,primaryArray.length,secondaryArray.length);
        let dailyValues = new Array<PercentageContainer>();
        let dailyAcc = new Array<PercentageContainer>();
        
        for (var i = 0; i < max;i++) {
            dailyValues.push(getDeviation(primaryArray[i].value,secondaryArray[i].value));
            dailyAcc.push(getDeviation(primaryAccum[i],secondaryAccum[i]));
        }

        ractive.set('widthDays', 100/max + '%');
        ractive.set('daily', dailyValues);
        ractive.set('accDay', dailyAcc);
    }

    function getIncomeGroup(dimension) {
        return dimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.totalIncome});
    }
    function getEstimatedIncomeGroup(dimension) {
        return dimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedIncome});
    }


     function getAccum(arrayOfKeyValues) {

        let res = new Array();
        arrayOfKeyValues.reduce(function (accum,obj,i) {
            return res[i] = accum + obj.value;
        },0);

        return res;
    }
    
    function getDeviation(produced:number,estimated:number):PercentageContainer {
        
        if (produced === undefined)
            produced = 0;
        if (estimated === undefined)
            estimated = 0;

        let val = estimated === 0 ? 0 : (( produced / estimated) * 100) - 100 ;
        return <PercentageContainer>{value: val !== 0 ? val.toFixed(1) : '--', cssClass: (val >= 0) ? ((val == 0)? 'blackValue': 'greenValue') : 'redValue'};
    }

    function calculateMonthlyPercentages(idHtml,primaryGroup,secondaryGroup,w,monthlyRactiveId,monthlyRactiveAccumId) {
        $(idHtml).width(w - 130);
        var MAX_MONTHS = 12;

        var today =  new Date();
        let primaryArray = primaryGroup.all().filter(obj => obj.key <= today);;
        let secondaryArray = secondaryGroup.all().filter(obj => obj.key <= today);;
        
        let primaryAccum = getAccum(primaryArray);
        let secondaryAccum = getAccum(secondaryArray);
        
        let max = Math.max(primaryAccum.length,secondaryAccum.length,primaryArray.length,secondaryArray.length);
        let monthlyAcc = new Array<PercentageContainer>();
        let monthlyValues = new Array<PercentageContainer>();
        
        for (var i = 0; i < max;i++) {
            monthlyAcc.push(getDeviation(primaryAccum[i],secondaryAccum[i]));
            monthlyValues.push(getDeviation(primaryArray[i].value,secondaryArray[i].value));
        }
        if (max < MAX_MONTHS) {
            //fill with empty
            for (var i = max; i < MAX_MONTHS ; i++) {
                monthlyValues.push(<PercentageContainer>{value: '--',cssClass:'blackValue'});
                monthlyAcc.push(<PercentageContainer>{value: '--',cssClass:'blackValue'});
            }
        }

        ractive.set(monthlyRactiveId, monthlyValues);
        ractive.set(monthlyRactiveAccumId, monthlyAcc);

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