import Ractive from 'ractive';
import cft from 'crossfilter';

import { TestDcComponent } from './test-dc.component';

export function PageComponent() {             
    
    let ractive: IRactive = undefined;    
    
    const testDc = TestDcComponent();
    
    const ractiveData = {
        el: undefined,
        template: `
            <div id="bar-chart_1"></div>
            <div id="bar-chart_2"></div>
            <div id="bar-chart_3"></div>
            <div id="bar-chart_4"></div>
            <div class="container-fluid">
    
    <!-- Energy Production -->
    <div class="row">
        <div id="data-count" class="col-xs-12 dc-data-count dc-chart">
            <h2>Energy Production</h2>
            <small>
            <span class="filter-count"></span> selected out of <span class="total-count"></span> records | <a id="all" href="#">Reset All</a>
            </small>
            
        </div>
    </div>
        
    <div class="row">
        
        <!-- Historical line chart -->
        <div class="col-md-12 text-center">
            <div id="chart-energy-history" class="dc-chart"></div>
        </div>
        <div class="col-md-12 text-center">
            <div id="chart-history-range" class="dc-chart"></div>
        </div>
        
        <!-- Bar charts -->
        <div class="col-md-6">
            <div class="col-sm-12 text-center">
                <div id="chart-energy-asset" class="dc-chart"></div>
            </div>
            <div class="col-sm-12 text-center">
                <div id="chart-energy-dayOfMonth" class="dc-chart"></div>
            </div>
        </div>
        
        <!-- Pie charts -->
        <div class="col-md-6">
            <div class="col-sm-6 pie-chart">
                <h4 class="text-left">Year <small><a id="year">reset</a></small></h4>
                <div id="chart-ring-year" class="dc-chart"></div>
            </div>
            <div class="col-sm-6 pie-chart">
                <h4 class="text-left">Month <small><a id="month" href="#">reset</a></small></h4>
                <div id="chart-ring-month" class="dc-chart"></div>
            </div>
            <div class="col-sm-6 pie-chart">
                <h4 class="text-left">Day <small><a id="day">reset</a></small></h4>
                <div id="chart-ring-day" class="dc-chart"></div>
            </div>
            <div class="col-sm-6 pie-chart">
                <h4 class="text-left">Type <small><a id="type">reset</a></small></h4>
                <div id="chart-ring-type" class="dc-chart"></div>
            </div>
        </div>
        
    </div>     
    
    <!-- Table --
    // record per day
    var record = {
      asset: {"name":"Aldehuelas", "type": "Wind", "latitude": 0, "longitude": 0},
      date: "2015-2-26",
      energy: 1000,
      dateYear: 2015,
      dateMonth: "Feb",
      dateDayOfMonth: 26,
      dateDayOfWeek: "Fri"
    }; -->
    <div class="row">
        <div class="col-xs-12">
            <table id="data-table" class="table table-bordered table-striped">
                <thead>
                <tr class="header">
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Energy</th>
                </tr>
                </thead>
            </table>
        </div>
    </div>
    
    </div>
        `
    };
    
    function init(elem) {
        console.log("<page-test-dcjs>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        testDc.init('#bar-chart_1');

        console.log("</page-test-dcjs>");
    }   
    
    function clean() {
        testDc.clean();
        ractive.teardown();        
    }
    
    return {
        init,
        clean
    };
}