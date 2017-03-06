import Ractive from 'ractive';
declare var $: any;

declare var dc: any;
declare var d3: any;

export function EstimatedPricesComponent() {
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
            <div class="title-small">
                Estimated Prices
            </div>
            <div class="data-number">
                19.56<span class="small-text"> €</span>
            </div>
            <div id="chart-estimated-prices" class="data-chart">
                <div class="data-chart-corner-text data-chart-top-left">
                    10 €
                </div>
                <div class="data-chart-corner-text data-chart-top-right">
                    Max
                </div>
                <div class="data-chart-corner-text data-chart-bottom-left">
                    0 €
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
        console.log("<estimated-prices>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        promise.then(dcData => {            
            drawChart('#chart-estimated-prices', dcData);
            // drawMax('#max-estimated-price', dcData);
        });

        console.log("</estimated-prices>");
    }

    function drawMax(elem, dcData){
        const timeDimension = dcData.ndx.dimension(function(record: AssetRecord){ return record.dateParsed;});
        var maxGroup = timeDimension.group()
        .reduce(
        function add(accum, record: AssetRecord) {
            const recordMax = d3.max([record.intradailyPrice, record.dailyPrice]);
            if (recordMax > accum.max) {
                accum.secondMax = accum.max;
                accum.max = recordMax;
            }            
            return accum;
        },
        function remove(accum, record: AssetRecord) {

            return accum;
        },
        function initial() {
            return {
                max: 0,
                secondMax: 0   
            };
        }
        );

        var total = dc.numberDisplay(elem);
        total
            .formatNumber(function(value){ return value;})
            .group(maxGroup, function(point){ return point.value.max;});
        total.render();
    }
    
    function drawChart(elem, dcData){
        const timeDimension = dcData.ndx.dimension(function(record: AssetRecord){ return record.dateParsed;});
        var dailyPriceGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.dailyPrice;});
        var intradailyPriceGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.intradailyPrice;});
        
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
        .shareTitle(false)
        .compose([
            dc.lineChart(composite)
                  .colors("#E74C3C")                  
                  .group(dailyPriceGroup)
                  .title(function(point: Point){ return `Daily price at ${dateFormat(point.key)}: ${point.value}€`;}),
            dc.lineChart(composite)
                  .colors("#2ECC71")
                  .group(intradailyPriceGroup)
                  .title(function(point: Point){ return `Intradaily price at ${dateFormat(point.key)}: ${point.value}€`;})
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