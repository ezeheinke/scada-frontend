declare var dc: any;
declare var d3: any;
declare var $: any;

import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';

export function PowerCurveComponent() {
    
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="chart-title">Power Curves (kW)</div>
            <div id="power-curve-chart">
            </div>
        `
    };

    function init(elem, promise) {
        console.log("<power-curve>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        promise.then( dcData => {
            drawChart('#power-curve-chart', dcData);
        });

        console.log("</power-curve>");
    }
    
    function drawChart(elem, dcData) {
        const windDimension = dcData.ndx.dimension(function(record: DeviceRecord){ return record.wind;});
        const windDimension2 = dcData.ndx2.dimension(function(record: DeviceRecord){ return record.wind;});
        var groupMean = windDimension2.group()//.reduceSum(function (record: DeviceRecord){ return record.deviceId === deviceId ? record.energy : 0;});
        .reduce(
        function add(accum, record: DeviceRecord) {
            accum.count++;
            accum.total += record.energy;
            accum.mean = accum.count > 0 ? accum.total / accum.count : 0;
            return accum;
        },
        function remove(accum, record: DeviceRecord) {
            accum.count--;
            accum.total -= record.energy;
            accum.mean = accum.count > 0 ? accum.total / accum.count : 0;
            return accum;
        },
        function initial() {
            return {
                count: 0,
                total: 0,
                mean: 0
            };
        });                
        
        const width = $(elem).parent().innerWidth() - 15;
        
        // var chart = dc.lineChart(elem);
        var composite = dc.compositeChart(elem);
        
        function getGroup(deviceId){
            return windDimension.group()//.reduceSum(function (record: DeviceRecord){ return record.deviceId === deviceId ? record.energy : 0;});
            .reduce(
            function add(accum, record: DeviceRecord) {
                if (record.deviceId === deviceId) {
                    accum.count++;
                    accum.total += record.energy;
                    accum.mean = accum.count > 0 ? accum.total / accum.count : 0;
                }
                return accum;
            },
            function remove(accum, record: DeviceRecord) {
                if (record.deviceId === deviceId) {
                    accum.count--;
                    accum.total -= record.energy;
                    accum.mean = accum.count > 0 ? accum.total / accum.count : 0;
                }
                return accum;
            },
            function initial() {
                return {
                    count: 0,
                    total: 0,
                    mean: 0
                };
            });
        }

        function remove_empty_bins(source_group) {
            return {
                all:function () {
                    var array = source_group.all().filter(function(d) {
                        return d.value.mean != 0;
                    });                    
                    return array;
                }
            };
        }

        function getLineChart(deviceId){
            var chart = dc.lineChart(composite)
                          .dimension(windDimension)                    
                          .group( remove_empty_bins( getGroup(deviceId) ) , deviceId, function(accessor){ return accessor.value.mean;})                          
                        //   .interpolate("monotone")
                          .xyTipsOn(true)
                          .title(function(point){ return `Device ${deviceId}: ${point.value.mean} kW at ${point.key} m/s`})
                          .renderDataPoints(true);
            return chart;
        }

        const devices = dcData.ndx  // TODO: maybe there is other better way to get the devices
        .dimension(function(record: DeviceRecord){ return record.deviceId;})
        .group()
        .reduceSum(function(record: DeviceRecord){ return record.energy;})                 
        .reduceCount(function(record: DeviceRecord){ return record.deviceId;})
        .all();        
        
        composite
        .width(width)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .x(d3.scale.linear().domain([0,30]))
        // .yAxisLabel("Power (kW)")        
        .xAxisLabel('Windspeed (m/s)')
        //.legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
        .renderHorizontalGridLines(true)
        .shareTitle(false)
        .compose(                
            devices.map(function(device){
                return getLineChart(device.key);
            })
            .concat(
                dc.lineChart(composite)
                  .dimension(windDimension2)                    
                  .group(groupMean)
                  .valueAccessor(function(point){ return point.value.mean;})
                  .title(function(point){ return `Average power: ${point.value.mean.toFixed(2)} kW at ${point.key} m/s`})
                  .colors("red")
                  .interpolate("monotone")                  
            )        
        )        
        .brushOn(false);

        // composite.yAxis().tickFormat(function(tick) { return tick;})

        composite.render();        
        
        // chart
        //     .width(width)
        //     .height(300)
        //     .dimension(windDimension)
        //     .group(powerPerWind)
        //     .valueAccessor(function(accessor){ return accessor.value.mean;})
        //     .x(d3.scale.linear().domain([0, 30]))
        //     .interpolate("monotone")
        //         .yAxisLabel('Power (kW)')
        //         .xAxisLabel('Windspeed (m/s)')
        //         .elasticY(true)
        // chart.render();
    }

    function clean() {
        ractive.teardown();
    }

    return {
        init,
        clean
    };
}