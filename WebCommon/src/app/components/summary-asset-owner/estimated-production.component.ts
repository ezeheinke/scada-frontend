import Ractive from 'ractive';

declare var dc: any;
declare var d3: any;
declare var $: any;

export function EstimatedProductionComponent() {
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
            <div class="title-small">
                Estimated Production
            </div>
            <div class="data-number">
                23.09<span class="small-text"> kWh</span>
            </div>
            <div id="chart-estimated-production" class="data-chart">
                <div class="data-chart-corner-text data-chart-top-left">
                    120 kWh
                </div>
                <div class="data-chart-corner-text data-chart-top-right">
                    Max
                </div>
                <div class="data-chart-corner-text data-chart-bottom-left">
                    0 MWh
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
            </div>
        `
    };

    const dateFormat = d3.time.format('%d/%m/%Y %H:%M');
    
    function init(elem, promise) {
        console.log("<estimated-production>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        promise.then(dcData => {
            drawChart('#chart-estimated-production', dcData);           
        });

        console.log("</estimated-production>");
    }
    
    function drawChart(elem, dcData){
        const timeDimension = dcData.ndx.dimension(function(record: AssetRecord){ return record.dateParsed;});
        var estimatedEnergyGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.estimatedEnergy;});
        var energyGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.energy;});
        
        const width = $(elem).parent().innerWidth();
        var composite = dc.compositeChart(elem);

        composite
        .width(width)
        .height(200)
        .margins({top: 0, right: 0, bottom: 0, left: 0})
        .dimension(timeDimension)
        .x(d3.time.scale().domain([
            new Date(2016, 6-1, 12),
            new Date(2016, 6-1, 13)
        ]))
        .xUnits(function(){ return 40;})        
        .shareTitle(false)        
        .compose([
            dc.barChart(composite)
                  .colors("#CB4335")
                  .gap(0)
                  .group(estimatedEnergyGroup)
                  .title(function(point: Point){ return `Estimated energy at ${dateFormat(point.key)}: ${(point.value/1).toFixed(2)}kWh`;}),
            dc.barChart(composite)
                  .colors("#28B463")
                  .gap(0)
                  .group(energyGroup)
                  .title(function(point: Point){ return `Energy at ${dateFormat(point.key)}: ${(point.value/1).toFixed(2)}kWh`;})
        ])        
        .brushOn(false);

        composite.render();
    }

    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}