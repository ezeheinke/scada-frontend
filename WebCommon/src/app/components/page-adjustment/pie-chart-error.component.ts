declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';

import {numberScaleFormatter} from '../../utils';

export function PieChartError() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `                        
            <div id="chart-error-{{index}}" class="info-chart-adjustment" style="height:100%;margin: 0 auto;position: relative;">
            </div>
        `,
        data : {index : undefined}
    };

    function init(elem, chartIndex, uprog) {
        ractiveData.el = elem;
        ractiveData.data.index = chartIndex;

        ractive = new Ractive(ractiveData);
        var dcData = new Array();
        
        if(uprog.signals.ASEnergyDifference && uprog.signals.EstimatedEnergy){
            var value = (uprog.signals.EstimatedEnergy.Value == 0)? 0 :  // rare case, there is no estimation of energy
                    (uprog.signals.ASEnergyDifference.Value / uprog.signals.EstimatedEnergy.Value) * 100;
        }
        
        var data, valueText, fontText; 
        
        if(isNaN(value) || !isFinite(value)){            
            data =  100;
            valueText = "Loading..."
            fontText = 14;
        }else{
            data = value;
            valueText = (data).toFixed(2) + "%";
            fontText = 25;
        }
            
        var perc1 = data;
        var perc2 = 100 - data;

        dcData.push({SP: perc2.toFixed(2)});
        dcData.push({SP: perc1.toFixed(2)});
        drawChart('#chart-error-'+ chartIndex, dcData, chartIndex, perc1.toFixed(2), valueText, fontText);        
    }
    
    function drawChart(elem, dcData, chartIndex, percentage, valueText, fontText) {               
        var ndx = crossfilter(dcData);
        var all = ndx.groupAll();
        var width = $('#chartPie-Error-'+chartIndex).width();
        var height = $('#chartPie-Error-'+chartIndex).height();
        var XDimension = ndx.dimension(function (d) {
            return +d.SP;
        });

        var YDimension = XDimension.group().reduceSum(function(d){ return +d.SP;});

        var chart = dc.pieChart(elem);
        chart
            .width(150)
            .height(150)
            .slicesCap(4)
            .innerRadius(55)
            .label(function(d){return ''})
            .colors(d3.scale.ordinal().range(["#e74c3c", "#1f77b4"])) // blue: 1f77b4; red: e74c3c
            .title(function(d){return d.key + " = " + d.value })
            .transitionDuration(0)
            .dimension(XDimension)
            .group(YDimension);

        chart.render();

        var svg = d3.select("#chart-error-" + chartIndex).append("svg")
                    .attr("style", "width: 100%;margin: 0 auto;position: relative;height: 100%;float: left;top: -100%;")
                    .append("g")
                    .attr("transform","translate(" + width/2 + "," + ((height/2) + 5) +")");

        svg.append("text")
                .attr("style", "text-anchor: middle; font-size:"+ fontText +"px; font-family: 'Open Sans', sans-serif; font-weight: bold;")
                .text( valueText );
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