declare var dc: any;
declare var d3: any;
declare var $: any;

import Ractive from 'ractive';

export function AnalysisDevicesComponent() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: ` 
            <div id="data-count" class="dc-data-count dc-chart">
                <span class="filter-count"></span> of <span class="total-count"></span> records <a id="clear-all-filters" class="pull-right" href="#/analysis">Reset All</a>               
            </div>          
            <div class="input-wrapper">
                <label for="date-start-input">Start Date</label>
                <input id='date-start-input' type='text' placeholder="Start Date" class="input-field"/>
            </div>
            <div class="input-wrapper">
                <label for="date-end-input">End Date</label>
                <input id='date-end-input' type='text' placeholder="End Date" class="input-field"/>
            </div>
            <div id="devices-chart-wrapper">
                <div id="devices-chart-label">
                    Devices <a class="pull-right">+ Select All</a>
                </div>
                <div id="devices-chart-text">
                    Click on the data bars on the chart below to select devices for the analysis.
                </div>
                <div id="devices-chart">
                </div>
            </div>
        `
    };

    function init(elem, promise) {
        console.log("<analysis-devices>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);        

        dateTimePicker('#date-start-input', new Date(2016, 6-1, 6));
        dateTimePicker('#date-end-input', new Date(2016, 6-1, 13));
    
        promise.then(dcData => {
            dataCount('#data-count', dcData);
            drawChart('#devices-chart', dcData);
        });
        
        console.log("</analysis-devices>");
    }

    function dataCount(elem, dcData){
        var dataCountDim = dcData.ndx;
        var all = dcData.ndx.groupAll();

        var dataCount = dc.dataCount(elem);
        dataCount
                .dimension(dataCountDim)
                .group(all);

        dataCount.render();

        d3.selectAll('a#clear-all-filters').on('click', function () {
            dc.filterAll();
            dc.renderAll();
        });                
    }
    
    function dateTimePicker(elem, defaultDate){
        var datePicker = $(elem).datetimepicker({
            format: 'DD/MM/YYYY'            
        });        
        $(elem).data("DateTimePicker").date(defaultDate);
    }        
    
    function drawChart(elem, dcData) {    
        const deviceIdDimension = dcData.ndx.dimension(function(record: DeviceRecord) {return record.deviceId;});
        const energyGroup = deviceIdDimension.group().reduceSum(function(record: DeviceRecord) {return record.energy});
        
        const width = $(elem).width() + 45;

        const devices = energyGroup.reduceCount(function(record: DeviceRecord) { return record.deviceId; }).all();
        const barHeightPerDevice = 35;
        const height = devices.length * barHeightPerDevice;                
        
        function postFilter(group) {
            return {
                all:function () {
                    var array = group.all().map(function(d) {
                        if (d.value < 0.001) d.value = 0;
                        return d;
                    });
                    return array;
                }
            };
        }

        var chart = dc.rowChart(elem);
        chart
            .width(width)
            .height(height)
            .dimension(deviceIdDimension)
            .group( postFilter(energyGroup) )
            .elasticX(true)
            // .cap(5)
            // .othersGrouper(false)
            .title(function(point){ return `Device ${point.key}: ${(point.value/1000).toFixed(2)} MWh`;})
            .colors("#2E4053")
            .gap(10);            
            
        chart.render();
        
        // var deviceIds = $('#devices-chart .row text');
        // deviceIds.each((i, deviceId) => {
        //     $(deviceId).attr("x", -30);
        // });
        
    }

    function clean() {        
    }

    return {
        init,
        clean
    };
}