declare var dc: any;
declare var d3: any;
declare var $: any;

import Ractive from 'ractive';

export function CapacityFactorComponent() {
    
    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="chart-title" >Average Capacity Factor (%)</div>
            <div id="capacity-factor-history">
            </div>
            <div id="capacity-factor-bottom">
            </div>
            <div id="capacity-factor-top">
            </div>
        `
    };

    const maxCapacityFactor = 2000;

    function init(elem, promise) {
        console.log("<capacity-factor>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        promise.then( dcData => {
            drawHistory('#capacity-factor-history', dcData);
            drawChart('#capacity-factor-bottom', dcData, 'bottom');
            drawChart('#capacity-factor-top', dcData, 'top');
        });

        console.log("</capacity-factor>");
    }
    
    function reduceAddAvg(attr){
        return function(accum, record: DeviceRecord) {                    
                accum.count++;
                accum.total += record[attr];
                accum.mean = accum.count > 0 ? accum.total / accum.count : 0;
                return accum;
            }
    }
    
    function reduceRemoveAvg(attr){
        return function(accum, record: DeviceRecord) {
            accum.count--;
            accum.total -= record[attr];
            accum.mean = accum.count > 0 ? accum.total / accum.count : 0;
            return accum;
        }
    }
    
    function reduceInitialAvg(){
        return function() {
            return {
                count: 0,
                total: 0,
                mean: 0
            };
        }
    }
    
    function drawHistory(elem, dcData){
        var energyGroup = dcData.timeDimension.group()
        .reduce(
          reduceAddAvg('energy'),
          reduceRemoveAvg('energy'),
          reduceInitialAvg()
        );
        const width = $(elem).parent().innerWidth();
        
        var chart = dc.lineChart(elem);
        chart
            .height(100)
            .width(width)
            .dimension(dcData.timeDimension)                    
            .group(energyGroup, function(point){ return point.value.mean/maxCapacityFactor * 100;})
            .x(d3.time.scale().domain([
                new Date(2016, 6-1, 6),
                new Date(2016, 6-1, 13)
            ]))
            .y(d3.scale.linear().domain([0, 100]))
            .colors('#5E35B1')
            .interpolate("monotone")
            .renderArea(true);            

        chart
            .yAxis()
            .ticks(4);

        chart.render();
    }
    
    function drawChart(elem, dcData, pole){
        const poleAmmount = 10;        

        const deviceIdDimension = dcData.ndx.dimension(function(record: DeviceRecord) {return record.deviceId;});
        var capacityFactorGroup = deviceIdDimension.group()
        .reduce(
          reduceAddAvg('energy'),
          reduceRemoveAvg('energy'),
          reduceInitialAvg()
        );
        
        function postFilter(group) {
            return {
                all: function() {
                    var array = group.all().slice(0);
                    array = array.sort(function (left, right) {
                        if (pole === 'bottom') {
                            return left.value.mean < right.value.mean ? -1 : 1;                            
                        }
                        else { // top
                            return left.value.mean < right.value.mean ? 1 : -1;
                        }
                    })
                    .slice(0, poleAmmount);
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
            .group( postFilter(capacityFactorGroup), function(point){ return point.value.mean/maxCapacityFactor * 100;})            
            .title(function(point){ return `Device ${point.key}: ${(point.value.mean/maxCapacityFactor * 100).toFixed(2)}%`;})
            .xUnits(dc.units.ordinal)
            .x(d3.scale.ordinal())
            .elasticX(true)
            .y(d3.scale.linear().domain([0, 100]))
            .xAxisLabel(`${pole==='bottom'?'Bottom':'Top'} ${poleAmmount}`)
            .colors('#5E35B1')
            .brushOn(false)
            .gap(5);        

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