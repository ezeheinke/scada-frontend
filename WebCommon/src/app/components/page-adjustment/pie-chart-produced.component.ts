declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';

import {numberScaleFormatter} from '../../utils';

export function PieChartProduced() {

    let ractive: IRactive = undefined;
    let chart;
    const ractiveData = {
        el: undefined,
        template: `                        
            <div id="chart-produced-{{index}}" class="info-chart-adjustment" style="width:100%; height:100%;margin: 0 auto;position: relative;">
            </div>
        `,
        data : {index : undefined}
    };

    function init(elem, chartIndex, uprog) {
        ractiveData.el = elem;
        ractiveData.data.index = chartIndex;

        ractive = new Ractive(ractiveData);
        var dcData = new Array();

        if(uprog.signals.Energy && uprog.signals.DesiredEnergy){
            var value = (uprog.signals.DesiredEnergy.Value == 0) || (uprog.signals.DesiredEnergy.Value == -1)? 
                        100 : 
                        (uprog.signals.Energy.Value / uprog.signals.DesiredEnergy.Value) * 100;

            if(!isFinite(value)) {
                value = 0;                
            }
        }
        
        var data, valueText, fontText; 
        
        if(isNaN(value) || !isFinite(value)){            
            data =  0;
            valueText = "Loading..."
            fontText = 14;
        }else{
            if(uprog.signals.DesiredEnergy.Value == -1)
                data = 100;
            else
                data = value;
            valueText = (data).toFixed(2) + "%";
            fontText = 25;
        }

        var perc1 = data;
        var perc2 = 100 - data;

        dcData.push({SP: perc2.toFixed(2)});
        dcData.push({SP: perc1.toFixed(2)});

        drawChart('#chart-produced-'+ chartIndex, dcData, chartIndex, perc1.toFixed(2), valueText, fontText);        
    }
    
    function drawChart(elem, dcData, chartIndex, percentage, valueText, fontText) {               
        var ndx = crossfilter(dcData);
        var all = ndx.groupAll();
        var width = $('#chartPie-Produced-'+chartIndex).width();
        var height = $('#chartPie-Produced-'+chartIndex).height();
        var XDimension = ndx.dimension(function (d) {
            return +d.SP;
        });

        var YDimension = XDimension.group().reduceSum(function(d){ return +d.SP;});
        
        chart = dc.pieChart(elem);
        chart
            .width(150)
            .height(150)
            .slicesCap(4)
            .innerRadius(55)
            .label(function(d){return ''})
            .colors(d3.scale.ordinal().range(["#1f77b4", "#93b940"])) // green : 93b940; blue: 1f77b4
            .title(function(d){return d.key + " = " + d.value })
            .transitionDuration(0)
            .dimension(XDimension)
            .group(YDimension);

        chart.render();

        var svg = d3.select("#chart-produced-" + chartIndex).append("svg")
                    .attr("style", "width: 100%;margin: 0 auto;position: relative;height: 100%;float: left;top: -100%;")
                    .append("g")
                    .attr("transform","translate(" + width/2 + "," + ((height/2) + 5) +")");

        svg.append("text")
                .attr("style", "text-anchor: middle; font-size:"+ fontText +"px; font-family: 'Open Sans', sans-serif; font-weight: bold;")
                .text( valueText);

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