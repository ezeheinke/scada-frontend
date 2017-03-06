declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';
import {dateTitleFormatter, numberScaleFormatter} from '../../utils';

export function MonthlyPenaltiesCumulativeComponent() {

    let ractive: IRactive = undefined;
    const penaltyRealEuro = 86.998;

    const ractiveData = {
        el: undefined,
        template:`
            <div class="title-small col-sm-12">
                MONTHLY - ACCUMULATED POWER FACTOR PENALTY
            </div>            
            <div class="notation-small">
                Penalty Real Acc: <span id="penaltyreal">{{penaltyreal}}€</span>
            </div>
            <div id="chart-cumulative-penalties" class="info-chart">
            </div>
        `,
        data:{
            penaltyreal: 0
        }
    };
    const format = dateTitleFormatter();

    function init(elem,dcData) {
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        drawChart('#chart-cumulative-penalties',dcData);
        
    }

    function drawChart(elem,dcData) {
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
        var chart = dc.compositeChart(elem, 'SummaryGroup');
       const domain = dcData.domain;

        chart
            .width(width)
            .height(250)
            .dimension(monthDimension)
            .x(d3.time.scale().domain([
                domain.start,
                domain.end
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
                    .title(function(point: Point){ return `Real reactive deviation ${format.monthly(point.key)}: ${numberScaleFormatter(point.value)} MWh`;}),
                dc.lineChart(chart)
                    .group(postFilter(estimatedPenaltiesGroup),"Reactive Deviation Budget")
                    .colors("#E74C3C")
                    .interpolate("monotone") 
                    .renderDataPoints(true)
                    .renderArea(true)
                    .title(function(point: Point){ return `Reactive deviation budget ${format.monthly(point.key)}: ${numberScaleFormatter(point.value)} MWh`;}),
            ]);
        
        let realPenalty:any = 0;
        let budgetPentaly = 0;
        var formatNumber = d3.format(".4s");
        realPenaltiesGroup.all().forEach(function(v){realPenalty = realPenalty + v.value});
        estimatedPenaltiesGroup.all().forEach(function(v){budgetPentaly = budgetPentaly + v.value});

        if(realPenalty >budgetPentaly){
            ractive.set('penaltyreal', "-" + formatNumber(realPenalty * penaltyRealEuro));
            $('#penaltyreal').css('color','red');
        }else{
            ractive.set('penaltyreal', formatNumber(realPenalty * penaltyRealEuro));
            $('#penaltyreal').css('color','green');
        }$('#penaltyreal').css('font-weight','bold');   
        chart
            .xAxis()
            .tickFormat(function(tick){ return d3.time.format('%b')(tick);});       
       
 
        chart.
            yAxis().tickFormat(d3.format('.3s')); 
        chart.render();

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