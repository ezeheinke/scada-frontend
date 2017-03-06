import Ractive from 'ractive';

declare var dc: any;
declare var d3: any;
declare var crossfilter: any;
declare var $: any;

import { RealTimeGraphComponent } from './real-time-graph.component';
import { CosPhiGraphComponent } from './cosphi-graph.component';
import { InputSignalsComponent } from './input-signals.component';
import { RowOfSignalsComponent } from './row-of-signals.component';

import { StateContainerService } from '../../services/state-container.service';

export function PageComponent() {

    let ractive: IRactive = undefined;

    const productionGraph = RealTimeGraphComponent();
    const powerFactorGraph = CosPhiGraphComponent();
    const inputSignalsRow = InputSignalsComponent();

    const stateContainer = StateContainerService();

    const ractiveData = {
        el: undefined,
        template: `   
            <div class="row row-with-divider">
                <div id="production-graph" class="col-sm-6 info-item">                    
                </div>
                <div id="power-factor-graph" class="col-sm-6 info-item">                    
                </div>
            </div>  
            {{#if inputSignals.length > 0}}                    
            <div id="input-signals" class="row row-with-divider">                
            </div>
            {{/if}}
            {{#displaySignals: index}}
            <div id="row-of-signals-{{index}}" class="row row-with-divider">
            </div>
            {{/displaySignals}}
        `,
        data: {
            "displaySignals": [],
            "inputSignals":[]
        }
    };

    const dateFormat = d3.time.format('%d/%m/%Y %H:%M:%S');

    let rowsOfSignals = [];

    function init(elem,resolve) {
        console.log("<page-control>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        const assetId = stateContainer.read('view');
        const asset = stateContainer.Static.Data.views[assetId];
        const pageData = asset.pagesData['control'];

        let graphOptions = pageData['productionGraph'];

        graphOptions["title"] = graphOptions["title"] !== undefined ? graphOptions["title"] : "Real Time Production Overview";
        graphOptions["yTitle"] = graphOptions["yTitle"] !== undefined ? graphOptions["yTitle"] : "Power (MW)";
        graphOptions["yFormat"] = graphOptions["yFormat"] !== undefined ? graphOptions["yFormat"] : "powerFormat";
        graphOptions["yMax"] = {"signalName": "NominalPower", "multiply": 0.001};
        graphOptions["yMin"] = graphOptions["yMin"] !== undefined ? graphOptions["yMin"] : 0;
        graphOptions["y2Title"] = graphOptions["y2Title"] !== undefined ? graphOptions["y2Title"] : "Windspeed (m/s)";
        graphOptions["y2Max"] = graphOptions["y2Max"] !== undefined ? graphOptions["y2Max"] : 30;
        graphOptions["y2Min"] = graphOptions["y2Min"] !== undefined ? graphOptions["y2Min"] : 0;
        
        productionGraph.init('#production-graph', assetId, graphOptions);

        graphOptions = pageData['powerFactorGraph'];

        graphOptions["title"] = graphOptions["title"] !== undefined ? graphOptions["title"] : "Real Time Power Factor Compliance";
        graphOptions["yTitle"] = graphOptions["yTitle"] !== undefined ? graphOptions["yTitle"] : "Power factor";
        graphOptions["yFormat"] = graphOptions["yFormat"] !== undefined ? graphOptions["yFormat"] : "cosPhi";
        
        powerFactorGraph.init('#power-factor-graph', assetId, graphOptions);

        const inputSignals = pageData.writeSignals;
        
        ractive.set('inputSignals', inputSignals);
        inputSignalsRow.init('#input-signals', inputSignals);
        
        const displaySignals = pageData.displaySignals;
        ractive.set('displaySignals', displaySignals);
        displaySignals.forEach(function(displaySignalsRow, index) {
            const row = RowOfSignalsComponent();            
            row.init('#row-of-signals-'+index, displaySignalsRow);
            rowsOfSignals.push(row);
        });

        // const promise = getDcData('/data/real-time-records.json');
        
        // promise.then(dcData => {
        //     drawProductionChart('#chart-real-time-production', dcData);
        //     drawPowerFactorChart('#chart-real-time-power-factor', dcData);
        // });
        //TODO
        resolve(true);
        console.log("</page-control>");
    }

    function getDcData(url){
        const promise = new Promise(resolve => {
            fetch(url)
            .then(response => response.json())
            .then(dataset => {                
                dataset.forEach(function (record: RealTimeRecord) {                    
                    record.dateParsed = dateFormat.parse(record.date);
                });        
                const ndx = crossfilter(dataset);
                const dcData = {
                    ndx
                };
                resolve(dcData);                
            });
        });
        return promise;
    }


    function drawProductionChart(elem, dcData) {
        const timeDimension = dcData.ndx.dimension(function(record: RealTimeRecord){ return record.dateParsed;});

        const windGroup = timeDimension.group().reduceSum(function(record: RealTimeRecord){ return record.wind;});
        const activePowerGroup = timeDimension.group().reduceSum(function(record: RealTimeRecord){ return record.activePower;});
        const nominalPowerGroup = timeDimension.group().reduceSum(function(record: RealTimeRecord){ return record.nominalPower;});
        const setPointReceivedGroup = timeDimension.group().reduceSum(function(record: RealTimeRecord){ return record.setPointReceived;});
        
        const width = $(elem).parent().innerWidth() -20 ;        
        var chart = dc.compositeChart(elem);

        const minimumDate = new Date(2016, 6-1, 12);
        minimumDate.setHours(10);
        minimumDate.setMinutes(0);
        minimumDate.setSeconds(0);
        const maximumDate = new Date(2016, 6-1, 12);
        maximumDate.setHours(10);
        maximumDate.setMinutes(5);
        maximumDate.setSeconds(0);

        chart
        .width(width)
        .height(300)
        .margins({top: 17, right: 20, bottom: 18, left: 30})
        .dimension(timeDimension)
        .x(d3.time.scale().domain([
            minimumDate,
            maximumDate
        ]))
        .rightY(d3.scale.linear().domain([0, 30]))
        .legend(dc.legend().x(31).y(-1).horizontal(true).autoItemWidth(true))
        .shareTitle(false)
        .compose([
            dc.lineChart(chart)          
                  .group(activePowerGroup, "Active power")
                  .interpolate("monotone")
                  .colors('green')
                  .title(function(point: Point){ return `Active power at ${dateFormat(point.key)}: ${(point.value).toFixed(2)} kWh`;}),
            dc.lineChart(chart)          
                  .group(nominalPowerGroup, "Nominal power")
                  .interpolate("monotone")
                  .colors('brown')
                  .title(function(point: Point){ return `Nominal power at ${dateFormat(point.key)}: ${(point.value).toFixed(2)} kWh`;}),
            dc.lineChart(chart)          
                  .group(setPointReceivedGroup, "Setpoint received")
                  .interpolate("monotone")
                  .colors('red')
                  .title(function(point: Point){ return `Setpoint received at ${dateFormat(point.key)}: ${(point.value).toFixed(2)} kWh`;}),
            dc.lineChart(chart)          
                  .group(windGroup, "Wind speed")
                  .useRightYAxis(true)
                  .interpolate("monotone") 
                  .colors('blue')
                  .title(function(point: Point){ return `Wind speed at ${dateFormat(point.key)}: ${(point.value).toFixed(2)} m/s`;})
        ])
        .brushOn(false);          

        chart.render();
    }

    function drawPowerFactorChart(elem, dcData) {
        const timeDimension = dcData.ndx.dimension(function(record: AssetRecord){ return record.dateParsed;});
        var maxCosPhiGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.maxCosPhi;});
        var minCosPhiGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.minCosPhi;});
        var cosPhiGroup = timeDimension.group().reduceSum(function(record: AssetRecord){ return record.cosPhi;});
        
        const width = $(elem).parent().innerWidth() - 20;
        var chart = dc.compositeChart(elem);

        const minimumDate = new Date(2016, 6-1, 12);
        minimumDate.setHours(10);
        minimumDate.setMinutes(0);
        minimumDate.setSeconds(0);
        const maximumDate = new Date(2016, 6-1, 12);
        maximumDate.setHours(10);
        maximumDate.setMinutes(5);
        maximumDate.setSeconds(0);

        function formatCosPhi(value) {        
            return ((value < 0) ? value+1 : value-1).toFixed(3);
        }

        chart
        .width(width)
        .height(300)
        .margins({top: 15, right: 0, bottom: 18, left: 40})
        .dimension(timeDimension)
        .x(d3.time.scale().domain([
            minimumDate,
            maximumDate
        ]))
        .y(d3.scale.linear().domain([0, 2]))
        .legend(dc.legend().x(43).y(-1).horizontal(true).autoItemWidth(true))
        .shareTitle(false)
        .compose([
            dc.lineChart(chart)
                  .colors("#E74C3C")
                  .group(cosPhiGroup, "Cos Phi")
                  .title(function(point: Point){ return `CosPhi at ${dateFormat(point.key)}: ${(point.value).toFixed(2)}`;}),
            dc.lineChart(chart)
                  .colors("#7ED321")
                  .group(maxCosPhiGroup, "Maximum")
                  .title(function(point: Point){ return `Maximum at ${dateFormat(point.key)}: ${(point.value).toFixed(2)}`;}),
            dc.lineChart(chart)
                  .colors("#F39C12")
                  .group(minCosPhiGroup, "Minimum")
                  .title(function(point: Point){ return `Minimum at ${dateFormat(point.key)}: ${(point.value).toFixed(2)}`;})
        ])
        .brushOn(false);

        chart
            .yAxis()
            .tickFormat(function(tick){ return formatCosPhi(tick);});  

        chart.render();
    }    

    function clean() {
        productionGraph.clean();
        powerFactorGraph.clean();
        inputSignalsRow.clean();
        rowsOfSignals.forEach(row => row.clean());
        ractive.teardown();
    }

    return {
        init,
        clean
    };
}