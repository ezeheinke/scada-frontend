import Ractive from 'ractive';
declare var $: any;

declare var dc: any;
declare var d3: any;

export function DevicesAvailabilityChartComponent() {
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="data-chart-corner-text data-chart-top-left">
                100%
            </div>
            <div class="data-chart-corner-text data-chart-top-right">
                Max
            </div>
            <div class="data-chart-corner-text data-chart-bottom-left">
                0 %
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
        console.log("<devices-availability-chart>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        promise.then(dcData => {
            document.querySelector(elem).classList.add('data-chart');
            drawChart(elem, dcData);
        });

        console.log("</devices-availability-chart>");
    }
    
    function drawChart(elem, dcData){
        const timeDimension = dcData.ndx.dimension(function(record: AssetRecord){ return record.dateParsed;});        

        function avgAdd(accum, record: AssetRecord, property){                   
            accum[property].count++;
            accum[property].total += record[property];
            accum[property].mean = accum[property].count > 0 ? accum[property].total / accum[property].count : 0;
            return accum;
        }
        
        function avgRemove(accum, record: AssetRecord, property){
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
        
        var availabilityGroup = timeDimension.group()
        .reduce( 
            function add(accum, record: AssetRecord) {                
                avgAdd(accum, record, "available");
                avgAdd(accum, record, "stopped");
                avgAdd(accum, record, "maintenance");
                avgAdd(accum, record, "error");
                avgAdd(accum, record, "disconnected");
                return accum;
            },
            function (accum, record: AssetRecord) {
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

        const availabilityMap = {
            'available': "Available",
            'stopped': "Stopped",
            'maintenance': "Maintenance",
            'error': "Error",
            'disconnected': "Disconnected"
        };

        /////////// COLORS ///////////
        //                          //
        //  available:     #7ED321  //     
        //  stopped:       #F39C12  //
        //  maintenance:   #F1C40F  //
        //  error:         #E74C3C  //
        //  disconnected:  #999999  //
        //                          //
        //////////////////////////////


        const width = $(elem).parent().innerWidth();
        
        var chart = dc.barChart(elem);
        chart
            .height(200)
            .width(width)
            .margins({top: 20, right: 0, bottom: 0, left: 0})
            .dimension(timeDimension)
            .group(availabilityGroup, 'available', function(point){ return point.value['available'].mean;})
            .x(d3.time.scale().domain([
                new Date(2016, 6-1, 12),
                new Date(2016, 6-1, 13)
            ]))
            .xUnits(function(){ return 40;})
            .title(function(point: Point){ return `${availabilityMap[this.layer]} at ${dateFormat(point.key)}: ${(point.value[this.layer].mean).toFixed(2)}%`;})
            .brushOn(false);

        chart.stack(availabilityGroup, 'stopped', function(point){ return point.value['stopped'].mean;});
        chart.stack(availabilityGroup, 'maintenance', function(point){ return point.value['maintenance'].mean;});
        chart.stack(availabilityGroup, 'error', function(point){ return point.value['error'].mean;});
        chart.stack(availabilityGroup, 'disconnected', function(point){ return point.value['disconnected'].mean;});

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