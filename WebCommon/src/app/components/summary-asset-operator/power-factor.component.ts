import Ractive from 'ractive';

declare var dc: any;
declare var d3: any;
declare var $: any;

export function PowerFactorComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small">
                Power Factor Compliance
            </div>
            <div class="data-number">
                89.25<span class="small-text"> %</span>
            </div>
            <div id="chart-power-factor" class="data-chart">
                <div class="data-chart-corner-text data-chart-top-left">
                    0.98
                </div>
                <div class="data-chart-corner-text data-chart-top-right">
                    Max
                </div>
                <div class="data-chart-corner-text data-chart-bottom-left">
                    -0.98
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
        console.log("<power-factor>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        promise.then(dcData => {
            drawChart('#chart-power-factor', dcData);           
        });

        console.log("</power-factor>");
    }

    function drawChart(elem, dcData){
        const timeDimension = dcData.ndx.dimension(function(record: AssetRecord){ return record.dateParsed;});
        var maxCosPhiGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.maxCosPhi;});
        var minCosPhiGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.minCosPhi;});
        var cosPhiGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.cosPhi;});
        
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
        .y(d3.scale.linear().domain([0, 2]))
        .shareTitle(false)        
        .compose([
            dc.lineChart(composite)
                  .colors("#7ED321")
                  .group(maxCosPhiGroup)
                  .title(function(point: Point){ return `Maximum at ${dateFormat(point.key)}: ${(point.value).toFixed(2)}`;}),
            dc.lineChart(composite)
                  .colors("#F39C12")
                  .group(minCosPhiGroup)
                  .title(function(point: Point){ return `Minimum at ${dateFormat(point.key)}: ${(point.value).toFixed(2)}`;}),
            dc.lineChart(composite)
                  .colors("#E74C3C")
                  .group(cosPhiGroup)
                  .title(function(point: Point){ return `CosPhi at ${dateFormat(point.key)}: ${(point.value).toFixed(2)}`;})
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