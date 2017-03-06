declare var dc: any;
declare var d3: any;
declare var $: any;

import Ractive from 'ractive';

export function ProductionComponent() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="chart-title">Energy Production (<span id="total-energy"></span>MWh)</div>
            <div id="production-history">
            </div>
            <div id="production-bottom">
            </div>
            <div id="production-top">
            </div>
        `
    };

    function init(elem, promise) {
        console.log("<production>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        // drawTotal('#total-energy', dcData);

        promise.then( dcData => {
            drawHistory('#production-history', dcData);
            drawChart('#production-bottom', dcData, 'bottom');
            drawChart('#production-top', dcData, 'top');
        });

        console.log("</production>");
    }

    function drawTotal(elem, dcData){
        const timeDimension = dcData.ndx.dimension(function(record: DeviceRecord){ return record.dateParsed;});
        var energyGroup = timeDimension.group().reduceSum(function(record: DeviceRecord){ return record.energy;});

        var total = dc.numberDisplay(elem);
        total
            .formatNumber(function(d){ return (parseInt(d) / 1000).toFixed(2);})
            .group(energyGroup);
        total.render();
    }
    
    function drawHistory(elem, dcData){
        var energyGroup = dcData.timeDimension.group().reduceSum(function(record: DeviceRecord){ return record.energy;});
        const width = $(elem).parent().innerWidth();
        
        var chart = dc.lineChart(elem);
        chart
            .height(100)
            .width(width)
            .dimension(dcData.timeDimension)                    
            .group(energyGroup)
            .x(d3.time.scale().domain([
                new Date(2016, 6-1, 6),
                new Date(2016, 6-1, 13)
            ]))
            .elasticY(true)
            .colors('#0D47A1')
            // .renderHorizontalGridLines(false)
            // .renderVerticalGridLines(false)
            .interpolate("monotone")
            .renderArea(true);
        chart
            .yAxis()
            .ticks(4)
            .tickFormat(function(tick) { return tick/1000;});

        chart.render();
    }    
    
    function drawChart(elem, dcData, pole) {
        const poleAmmount = 10;
        const deviceIdDimension = dcData.ndx.dimension(function(record: DeviceRecord) {return record.deviceId;});
        var energyGroup = deviceIdDimension.group().reduceSum(function(record: DeviceRecord){ return record.energy;});
                
        function postFilter(group) {
            return {
                all: function() {
                    var array = group.all().slice(0);
                    array = array.sort(function (left, right) {
                        if (pole === 'bottom') {
                            return left.value < right.value ? -1 : 1;                            
                        }
                        else { // top
                            return left.value < right.value ? 1 : -1;
                        }
                    })
                    .slice(0, poleAmmount)
                    .map(function(d) {
                        if (d.value < 0.001) d.value = 0;
                        return d;
                    });
                    return array;                    
                }
            };
        }        

        const width = ($(elem).parent().innerWidth() - 15) / 2;          
        var chart = dc.barChart(elem);
        chart
            .width(width)
            .height(200)
            .dimension(deviceIdDimension)
            .group( postFilter(energyGroup) )
            .title(function(point){ return `Device ${point.key}: ${(point.value/1000).toFixed(2)} MWh`;})
            .xUnits(dc.units.ordinal)
            .x(d3.scale.ordinal())
            .colors('#1A5276')
            
            .elasticX(true)
            
            .elasticY(true)

            // .y(d3.scale.linear().domain([0, 100]))
            .xAxisLabel(`${pole==='bottom'?'Bottom':'Top'} ${poleAmmount}`)
            .brushOn(false)
            .gap(5);

        chart
            .yAxis()
            // .ticks(4)
            .tickFormat(function(tick) { return tick/1000;});

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