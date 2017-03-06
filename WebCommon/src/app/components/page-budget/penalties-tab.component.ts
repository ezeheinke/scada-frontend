declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter,CustomFormatModule,MonthNames} from '../../utils';

export function PenaltiesTabComponent() {
    
    let ractive: IRactive = undefined;
    const penaltyRealEuro = -86.998;
    const groupedChartsName = 'PenaltiesGroup';
    const customFormat = CustomFormatModule();

    interface DayChartCallback {

        (dateInit:Date,dcData:any,width:number):void;
    }
    interface PercentageContainer {
        cssClass:string,
        value:string
    }
    const formater = dateTitleFormatter();
    
    const ractiveData = {
        el: undefined,
        template: `            
             <div class="row row-with-divider">
               <div class="col-md-12 info-item">
                    <div id="yearly-penalties-tab">
                         <div class="title-small">
                            YEARLY PENALTIES
                        </div>
                        <div id="chart-yearly-penalties-tab" class="info-chart">
                        </div>                        
                    </div>                    
                </div>
            </div>
            <div class="row row-with-divider">
               <div class="col-md-12 info-item">
                    <div id="monthly-penalties-tab">
                        <div class="title-small col-sm-12">
                            MONTHLY - ACCUMULATED PENALTIES vs BUDGET
                        </div>
                        <div id="chart-monthly-penalties-tab" class="info-chart"></div>
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
                    <div id="daily-penalties-tab">
                    <div class="title-small">
                        {{currentMonth}}: DAILY - ACCUMULATED PENALTIES vs BUDGET
                    </div>
                    <div id="chart-daily-penalties-tab" class="info-chart"></div>
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
            monthly: Array<PercentageContainer>(),
            accMonth: Array<PercentageContainer>(),
            currentMonth: MonthNames[0], // initially January
            daily: [],
            accDay: [],
            widthDays: 3.225
        }
    };

    function init(elem,dcData,year) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);        
        var dailyChartCallback = drawDailyChart( '#chart-daily-penalties-tab',dcData, new Date(year,0,1), new Date(year,0,31)); 
        drawYearlyChart('#chart-yearly-penalties-tab', dcData,dailyChartCallback,year);  
        drawMonthlyChart('#chart-monthly-penalties-tab',dcData,dailyChartCallback);      
    }

    function drawYearlyChart(elem, dcData,dailyChartCallback:DayChartCallback,year) {
        const assetDimension = dcData.assetDimension;
        const penaltiesGroup = assetDimension.group().reduceSum(function (record: BudgetAssetRecord) {return record.realPenalties * penaltyRealEuro});
        
        const width = $(elem).parent().innerWidth();
        var chart = dc.barChart(elem, groupedChartsName);
        chart
            .width(width)
            .height(250)
            .dimension(assetDimension)
            .group(penaltiesGroup,"Penalties")
            .title(function(point: Point){ return `Penalties ${customFormat.getValue(point.value)} €`;})
            .yAxisLabel("Penalty (€)")
            .x(d3.scale.ordinal())
            .colors('#93b940')
            .xUnits(dc.units.ordinal)
            .barPadding(0.1)
            .elasticY(true)
            .margins({top: 25, right: 0, bottom: 65, left: 65});
                    
        chart.yAxis().tickFormat(customFormat.getFunc); 
        
        chart.on("filtered",function(chart) {
            var month = MonthNames.indexOf(ractive.get('currentMonth'));
            dailyChartCallback(new Date(year,month,1),dcData,width);
        });
        
        chart.render();
    }

    function drawMonthlyChart(elem,dcData,dailyChartCallback:DayChartCallback) {

        const monthDimension = dcData.monthDimension;
        const totalPenaltiesGroup = getTotalPenaltiesGroup(monthDimension);
        const estimatedPenaltiesGroup = getEstimatedPenaltiesGroup(monthDimension);

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
            .yAxisLabel("Penalty (€)")
            .shareTitle(false)
            .elasticY(true)
            .compose([
                    dc.barChart(chart)
                        .group(estimatedPenaltiesGroup, "Penalties Budget")
                        .colors('#ff7364')
                        .xUnits(function(){ return 25;})
                        .gap(-6)
                        .centerBar(true)
                        .title(function(point: Point){ return `Budget penalties ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;}),
                    dc.barChart(chart)
                        .group(totalPenaltiesGroup, "Penalties Real")
                        .colors('#93b940')
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Real penalties ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;}),                    
                    dc.lineChart(chart)
                        .group(postFilter(totalPenaltiesGroup), "Penalties Real Acc")
                        .renderDataPoints(true)
                        .title(function(point: Point){ return `Accumulated penalties ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedPenaltiesGroup), "Penalties Budget Acc")
                        .renderDataPoints(true)
                        .title(function(point: Point){ return `Accumulated budget penalties ${formater.monthly(point.key)} : ${customFormat.getValue(point.value)} €`;})
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


        chart.render();
        
        chart.on("renderlet",function(_chart) {
            _chart
                .selectAll("rect.bar")
                .on("click", function(ch) {
                    dailyChartCallback(ch.data.key, dcData, width);
                });
        });
        
        calculatePercentages('#dataTableMonthly',getTotalPenaltiesGroup(dcData.monthDimension),
            getEstimatedPenaltiesGroup(dcData.monthDimension), width,'monthly','accMonth');
        chart.on("preRedraw",function(chart) {
            calculatePercentages('#dataTableMonthly',getTotalPenaltiesGroup(dcData.monthDimension),
                getEstimatedPenaltiesGroup(dcData.monthDimension), width,'monthly','accMonth');
        });
        

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
        return <PercentageContainer>{value: val !== 0 ? val.toFixed(1) : '--', cssClass: (val >= 0) ? ((val === 0)? 'blackValue': 'redValue') : 'greenValue'};
    }

    function calculatePercentages(idHtml,primaryGroup,secondaryGroup,w,monthlyRactiveId,monthlyRactiveAccumId) {
        $(idHtml).width(w - 130);
        
        var MAX_MONTHS = 12;
        var today =  new Date();
        let primaryArray = primaryGroup.all().filter(obj => obj.key <= today);;;
        let secondaryArray = secondaryGroup.all().filter(obj => obj.key <= today);;;
        
        let primaryAccum = getAccum(primaryArray);
        let secondaryAccum = getAccum(secondaryArray);
        //the should be all 12 but.. just in case..
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

    function getTotalPenaltiesGroup(dimension) {
        return dimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.realPenalties * penaltyRealEuro});
    }

    function getEstimatedPenaltiesGroup(dimension) {
        return dimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedPenalties * -penaltyRealEuro});
    }

    function drawDailyChart(elem,dcData,dateInit,dateEnd) {

        const dailyDimension = dcData.dailyDimension;
        
        let totalPenaltiesGroup = getTotalPenaltiesGroup(dailyDimension);
        let estimatedPenaltiesGroup = getEstimatedPenaltiesGroup(dailyDimension);
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
            .yAxisLabel("Penalty (€)")
            .shareTitle(false)
            .elasticY(true)
            .compose([
                    dc.barChart(chart)
                        .group(estimatedPenaltiesGroup, "Budget Penalties")
                        .colors('#ff7364')
                        .xUnits(function(){ return 25;})
                        .gap(-6)
                        .centerBar(true)
                        .title(function(point: Point){ return `Budget penalties ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;}),
                    dc.barChart(chart)
                        .group(totalPenaltiesGroup, "Real Penalties")
                        .colors('#93b940')
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Real penalties ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .useRightYAxis(false),
                    dc.lineChart(chart)
                        .group(postFilter(totalPenaltiesGroup), "Accumulated Penalties")
                        .title(function(point: Point){ return `Accumulated penalties ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;})
                        .renderDataPoints(true)
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedPenaltiesGroup), "Budget Penalties Acc")
                        .title(function(point: Point){ return `Accumulated budget penalties ${formater.daily(point.key)} : ${customFormat.getValue(point.value)} €`;})
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
            calculateDailyPercentages('#dataTableDaily',newDateInit, newDateEnd,filteredData, width);

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
        let primaryArray = getTotalPenaltiesGroup(dim).all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        let secondaryArray = getEstimatedPenaltiesGroup(dim).all().filter(x => x.key >= dateInit && x.key <= dateEnd);
        
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

    function clean() {
        if (ractive)
            ractive.teardown();
    }

    return {
        init,
        clean
    };


}