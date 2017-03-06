import Ractive from 'ractive';

declare var crossfilter: any;
declare var d3: any;

import { AnalysisDevicesComponent } from './analysis-devices.component';
import { AnalysisChartsComponent } from './analysis-charts.component';

export function PageComponent() {             
    
    let ractive: IRactive = undefined;

    const analysisDevices = AnalysisDevicesComponent();
    const analysisCharts = AnalysisChartsComponent();
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="row split-view-container">
                <div id="analysis-devices" class="col-sm-3 split-view-left">
                </div>
                <div id="analysis-charts" class="col-sm-9 split-view-main">
                </div>
                <div id="analysis-export-button">
                    <span title="Download filter records" class="icon dripicons-cloud-download" aria-hidden="true"></span>
                </div>
            </div>         
        `
    };
    
    function init(elem,resolve) {
        console.log("<page-analysis>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        const promise = getDcData('/data/devices-records.json');        
        analysisDevices.init('#analysis-devices', promise);
        analysisCharts.init('#analysis-charts', promise);
        //TODO
        resolve(true);
        console.log("</page-analysis>");
    }

    function getDcData(url){
        const promise = new Promise(resolve => {
            fetch(url)
            .then(response => response.json())
            .then(dataset => {
                const dateFormat = d3.time.format('%d/%m/%Y %H:%M');
                dataset.forEach(function (record: DeviceRecord) {
                    record.dateParsed = dateFormat.parse(record.date);
                });
                
                const ndx = crossfilter(dataset);
                const ndx2 = crossfilter(dataset);
                const timeDimension = ndx.dimension(function(record: DeviceRecord){ return record.dateParsed;});

                const dcData = {
                    ndx,
                    ndx2,
                    timeDimension
                };
                resolve(dcData);  
            });
        });
        return promise;
    }
    
    function clean() {
        analysisDevices.clean();
        analysisCharts.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}

var dataset2 = [
    {"date":"01/06/2015", "deviceId": "001", "wind":  5, "power": 80},
    {"date":"02/06/2015", "deviceId": "001", "wind":  8, "power": 90},
    {"date":"03/06/2015", "deviceId": "001", "wind": 10, "power": 20},    
    
    
    {"date":"01/06/2015", "deviceId": "002", "wind": 10, "power": 90},
    {"date":"02/06/2015", "deviceId": "002", "wind": 10, "power": 95},
    {"date":"03/06/2015", "deviceId": "002", "wind": 10, "power": 20},
    
    {"date":"01/06/2015", "deviceId": "003", "wind": 10, "power": 80},
    {"date":"02/06/2015", "deviceId": "003", "wind": 10, "power": 85},
    {"date":"03/06/2015", "deviceId": "003", "wind": 10, "power": 35},
    
    {"date":"01/06/2015", "deviceId": "004", "wind": 10, "power": 80},
    
    {"date":"01/06/2015", "deviceId": "005", "wind": 10, "power": 80, "availability": 98},
    
    {"date":"01/06/2015", "deviceId": "006", "wind": 10, "power": 80},
    
    {"date":"01/06/2015", "deviceId": "007", "wind": 10, "power": 80},
    
    {"date":"01/06/2015", "deviceId": "008", "wind": 10, "power": 80},
    
    {"date":"01/06/2015", "deviceId": "009", "wind": 10, "power": 80},
    
    {"date":"01/06/2015", "deviceId": "010", "wind": 20, "power": 20},    
    {"date":"02/06/2015", "deviceId": "010", "wind": 20, "power": 60}        
]