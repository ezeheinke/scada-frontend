declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';

export function PenaltiesTabMonthly() {
    
    let ractive: IRactive = undefined;
    let _dmonthlychart;    
    let _ddailychart;    
    let monthNames = [
        {name:"January"},
        {name:"February"},
        {name:"March"},
        {name:"April"},
        {name:"May"},
        {name:"June"},
        {name:"July"},
        {name:"August"},
        {name:"September"},
        {name:"October"},
        {name:"November"},
        {name:"December"}
    ];
    const penaltyRealEuro = -86.998;
    const ractiveData = {
        el: undefined,
        template: `            
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

    const format = dateTitleFormatter();

    function init(elem, dcData, dailychart) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        _ddailychart = dailychart;   
        drawChart('#chart-monthly-penalties-tab',dcData);        
    }

    function drawChart(elem,dcData) {
        const monthDimension = dcData.monthDimension;
        const totalPenaltiesGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.realPenalties * penaltyRealEuro});
        const estimatedPenaltiesGroup = monthDimension.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedPenalties * -penaltyRealEuro});

        const width = $(elem).parent().innerWidth();
        let chart = dc.compositeChart(elem, 'PenaltiesGroup');
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
                        .title(function(point: Point){ return `Budget penalties ${format.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;}),
                    dc.barChart(chart)
                        .group(totalPenaltiesGroup, "Penalties Real")
                        .colors('#93b940')
                        .gap(0)
                        .centerBar(true)
                        .title(function(point: Point){ return `Real penalties ${format.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;}),                    
                    dc.lineChart(chart)
                        .group(postFilter(totalPenaltiesGroup), "Penalties Real Acc")
                        .renderDataPoints(true)
                        .title(function(point: Point){ return `Accumulated penalties ${format.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;})
                        .useRightYAxis(true),
                    dc.lineChart(chart)
                        .group(postFilter(estimatedPenaltiesGroup), "Penalties Budget Acc")
                        .renderDataPoints(true)
                        .title(function(point: Point){ return `Accumulated budget penalties ${format.monthly(point.key)} : ${numberScaleFormatter(point.value)} €`;})
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
        
        const totalPenaltiesGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.realPenalties * penaltyRealEuro});
        const estimatedPenaltiesGroup = dim.group().reduceSum(function(record:BudgetAssetRecord){ return record.estimatedPenalties * -penaltyRealEuro});

        let monthlyValues = new Array();
        let monthlyAcc = new Array();
        var penaltiesSum = 0;
        var estimatedSum = 0;

        for(var i = 0; i<estimatedPenaltiesGroup.all().length; i++){
            var penalties = totalPenaltiesGroup.all()[i].value;
            var estimated = estimatedPenaltiesGroup.all()[i].value;
            penaltiesSum += penalties;
            estimatedSum += estimated; 
            let valMonth = penalties === 0 ? NaN :((( penalties / estimated ) * 100)); 
            let valMonthAcc =  penaltiesSum === 0 ? NaN :((( penaltiesSum / estimatedSum) * 100));
            monthlyValues.push({valueMonth: (!isNaN(valMonth) && isFinite(valMonth)) ? valMonth.toFixed(1) : '--', valueMonthClass: (valMonth >= 100) ? ((valMonth == 100)? 'blackValue': 'redValue') : 'greenValue'})
            monthlyAcc.push({acc: (!isNaN(valMonthAcc) && isFinite(valMonthAcc)) ? valMonthAcc.toFixed(1) : '--', accClass: (valMonthAcc >= 100) ? ((valMonthAcc == 100)? 'blackValue': 'redValue') : 'greenValue'})
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