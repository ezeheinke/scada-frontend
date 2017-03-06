import Ractive from 'ractive';
declare var $: any;

declare var dc: any;
declare var d3: any;

import { StateContainerService } from '../../services/state-container.service';
import { CompactScadaService } from '../../services/compact-scada.service';

export function ActivePowerHistoryComponent() {
    
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    const compactScada = CompactScadaService();
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="data-chart-corner-text data-chart-top-left">
                {{maximum}} MW
            </div>
            <div class="data-chart-corner-text data-chart-top-right">
                Max
            </div>
            <div class="data-chart-corner-text data-chart-bottom-left">
                {{minimum}} MW
            </div>
            <div class="data-chart-corner-text data-chart-bottom-right">
                Min
            </div>
            <div id="chart-horizontal-line-1" class="data-chart-horizontal-line">
            </div>
            <div id="chart-horizontal-line-2" class="data-chart-horizontal-line">
            </div> 
            <div id="chart-horizontal-line-3" class="data-chart-horizontal-line">
            </div>
            <div id="chart-vertical-line-1" class="data-chart-vertical-line">
            </div>
            <div id="chart-vertical-line-2" class="data-chart-vertical-line">
            </div> 
            <div id="chart-vertical-line-3" class="data-chart-vertical-line">
            </div> 
        `
    };

    const dateFormat = d3.time.format('%d/%m/%Y %H:%M');
    
    function init(elem, promise) {
        console.log("<active-power-history>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        promise.then(dcData => {
            document.querySelector(elem).classList.add('data-chart');            
            drawChart(elem, dcData);
        });

        console.log("</active-power-history>");
    }
    
    function drawChart(elem, dcData){
        const timeDimension = dcData.ndx.dimension(function(record: AssetRecord){ return record.dateParsed;});
        var energyGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.energy/1000;}); // to MWh
        const width = $(elem).parent().innerWidth();
        
        var chart = dc.lineChart(elem);
        chart
            .height(200)
            .width(width)
            .margins({top: 0, right: 0, bottom: 0, left: 0})
            .dimension(timeDimension)                  
            .group(energyGroup)
            .x(d3.time.scale().domain([
                new Date(2016, 6-1, 12),
                new Date(2016, 6-1, 13)
            ]))
            .title(function(point: Point){return `Active power at ${dateFormat(point.key)}: ${point.value.toFixed(2)}MWh`;})
            .brushOn(false)
            .colors("#F7F9F9")
            .interpolate("monotone")
            .on('renderlet', function (chart) {                
                const maximum = chart.yAxisMax();
                const minimum = chart.yAxisMin();
                ractive.set('maximum', maximum.toFixed(0) );
                ractive.set('minimum', minimum.toFixed(0) );
            });

        chart.render();
    }

    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}