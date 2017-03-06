declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import Ractive from 'ractive';

export function AvailabilityTimeComponent() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="chart-title">Average Availability (%)</div>
            <div id="availability-time-history">
            </div>
            <div id="availability-time-bottom" class="availability-stacked-chart-colors">
            </div>
            <div id="availability-time-top" class="availability-stacked-chart-colors">
            </div>
        `
    };

    function init(elem, promise) {
        console.log("<availability-time>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        promise.then( dcData => {
            drawHistory('#availability-time-history', dcData);
            drawChart('#availability-time-bottom', dcData, 'bottom');
            drawChart('#availability-time-top', dcData, 'top');
        });

        console.log("</availability-time>");
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
        var powerGroup = dcData.timeDimension.group()
        .reduce(
          reduceAddAvg('available'),
          reduceRemoveAvg('available'),
          reduceInitialAvg()
        );
        const width = $(elem).parent().innerWidth();
        
        var chart = dc.lineChart(elem);
        chart
            .height(100)
            .width(width)
            .dimension(dcData.timeDimension)                    
            .group(powerGroup, function(point){ return point.value.mean;})
            .x(d3.time.scale().domain([
                new Date(2016, 6-1, 6),
                new Date(2016, 6-1, 13)
            ]))
            .y(d3.scale.linear().domain([0, 100]))
            .colors('#8BC34A')
            .interpolate("monotone")
            .renderArea(true);            

        chart
            .yAxis()
            .ticks(4);

        chart.render();
    }
    
    function drawChart(elem, dcData, pole) {
        const poleAmmount = 10;        
        const deviceIdDimension = dcData.ndx.dimension(function(record: DeviceRecord) {return record.deviceId;});

        function avgAdd(accum, record: DeviceRecord, property){                   
            accum[property].count++;
            accum[property].total += record[property];
            accum[property].mean = accum[property].count > 0 ? accum[property].total / accum[property].count : 0;
            return accum;
        }
        
        function avgRemove(accum, record: DeviceRecord, property){
            accum[property].count--;
            accum[property].total -= record[property];
            accum[property].mean = accum[property].count > 0 ? accum[property].total / accum[property].count : 0;
            return accum;
        }
        
        function avgInitial(){
            return {
                count: 0,
                total: 0,
                mean: 0
            };
        }       
        
        var availabilityGroup = deviceIdDimension.group()
        .reduce( 
            function add(accum, record: DeviceRecord) {                
                avgAdd(accum, record, "available");
                avgAdd(accum, record, "stopped");
                avgAdd(accum, record, "maintenance");
                avgAdd(accum, record, "error");
                avgAdd(accum, record, "disconnected");
                return accum;
            },
            function (accum, record: DeviceRecord) {
                avgRemove(accum, record, "available");
                avgRemove(accum, record, "stopped");
                avgRemove(accum, record, "maintenance");
                avgRemove(accum, record, "error");
                avgRemove(accum, record, "disconnected");
                return accum;
            },
            function() {
                return {
                    available: {count: 0, total: 0, mean: 0 },
                    stopped: {count: 0, total: 0, mean: 0 },
                    maintenance: {count: 0, total: 0, mean: 0 },
                    error: {count: 0, total: 0, mean: 0 },
                    disconnected: {count: 0, total: 0, mean: 0 }
                };
            }
        );
        
        function postFilter(group) {
            return {
                all: function() {
                    var array = group.all().slice(0);
                    array = array.sort(function (left: Point, right: Point) {
                        if (pole === 'bottom') {
                            return left.value.available.mean < right.value.available.mean ? -1 : 1;                            
                        }
                        else { // top
                            return left.value.available.mean < right.value.available.mean ? 1 : -1;
                        }                        
                    })
                    .slice(0, poleAmmount);
                    return array;                    
                }
            };
        }

        const statusLiterals = {
            'available': "Available",
            'stopped': "Stopped",
            'maintenance': "Maintenance",
            'error': "Error",
            'disconnected': "Disconnected"
        }
        
        const width = ($(elem).parent().innerWidth() - 15) / 2;
        var chart = dc.barChart(elem);
        chart
            .width(width)
            .height(200)
            .dimension(deviceIdDimension)
            .group(postFilter(availabilityGroup), 'available', function(point){ return point.value['available'].mean;})
            .title(function(point: Point){ return `${statusLiterals[this.layer]}: ${(point.value[this.layer].mean).toFixed(2)}%`;})
            .xUnits(dc.units.ordinal)
            .x(d3.scale.ordinal() )
            .elasticX(true)
            .y(d3.scale.linear().domain([0, 100]))
            .xAxisLabel(`${pole==='bottom'?'Bottom':'Top'} ${poleAmmount}`)
            .brushOn(false)
            .gap(5);            
                    
        chart.stack(postFilter(availabilityGroup), 'stopped', function(point){ return point.value['stopped'].mean;});
        chart.stack(postFilter(availabilityGroup), 'maintenance', function(point){ return point.value['maintenance'].mean;});
        chart.stack(postFilter(availabilityGroup), 'error', function(point){ return point.value['error'].mean;});
        chart.stack(postFilter(availabilityGroup), 'disconnected', function(point){ return point.value['disconnected'].mean;});

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