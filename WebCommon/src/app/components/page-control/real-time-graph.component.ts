import Ractive from 'ractive';
import vis from 'vis';

import { CompactScadaService } from '../../services/compact-scada.service';

export function RealTimeGraphComponent() {             
    
    let ractive: IRactive = undefined;

    const compactScada = CompactScadaService();

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="title-small">
                {{title}}
            </div>
            <div id="{{chartId}}-legend" class="external-legend row"></div>
            <div id="{{chartId}}" class="info-chart info-chart-large">
            </div>
        `,
        data: {
            title: undefined,
            chartId: undefined
        }
    };

    const formats = {
        "powerFormat": value => value.toFixed(0),
        "cosPhi": value => (value < 0 ? -value-1 : 1 - value).toFixed(3),
    };

    let graph2d = undefined;
    let unsubscribe = undefined;
    
    function init(elem, assetId, graphOptions) {
        console.log("<real-time-graph>");
        ractiveData.el = elem;
        ractiveData.data.title = graphOptions.title;
        const chartId = 'chart-'+elem.slice(1);
        ractiveData.data.chartId = chartId;
        ractive = new Ractive(ractiveData);

        let yMax;
        let y2Max;

        getYMaxValue(assetId, graphOptions.yMax)
        .then(yMaxResolved => {
            yMax = yMaxResolved;
            return getYMaxValue(assetId, graphOptions.y2Max);
        })
        .then(y2Max => {
            graphOptions.yMax = yMax;
            graphOptions.y2Max = y2Max;            
            return '';
        })
        .then(() => {
            const graphSignals = graphOptions.graphSignals;
            graphSignals.forEach(graphSignal => graphSignal['id'] = assetId+'.'+graphSignal.signalName);
            
            var graph = initGraph(chartId, graphOptions);
            let displayLegend = false;

            const subscribePattern = `^${assetId}.(${graphSignals.map(signal => signal.signalName).join('|')})$`;        
            unsubscribe = compactScada.subscribe(subscribePattern, function(signals){
                const dataPoints = signals.map(signal => {
                    const graphSignal = graphSignals.filter(graphSignal => graphSignal.id === signal.Name)[0];
                    const multiply = graphSignal.multiply ? graphSignal.multiply : 1; 
                    return {
                        group: signal.Name,
                        value: signal.Value*multiply
                    };
                });
                graph.addDataPoints(dataPoints);
                if (!displayLegend) {
                    graph.populateExternalLegend();
                    displayLegend = true;
                }
            });            
        });
         
        console.log("</real-time-graph>");
    }

    function getYMaxValue(assetId, refMaxY){
        const promise = new Promise( resolve => {
            if (typeof refMaxY === 'number'){
                resolve(refMaxY);
            }
            else if (typeof refMaxY === 'object') {
                compactScada.getSignals(`^${assetId}\.${refMaxY.signalName}$`) // request once
                .then(function(signals: Signal[]) {
                    if(signals[0]) {
                        const multiply = refMaxY.multiply ? refMaxY.multiply : 1; 
                        const valueY = signals[0].Value * multiply;
                        const yMax = valueY + valueY*0.1;                        
                        resolve(yMax);
                    }
                });
            }
            else {
                resolve(undefined);
            }
        });
        return promise;
    }

    function initGraph(chartId, graphOptions){
        // example code from http://visjs.org/examples/graph2d/15_streaming_data.html
        const container = document.getElementById(chartId);
        const windowInterval = graphOptions.windowInterval ? graphOptions.windowInterval * 1000 : 30*1000;
        let groups = new vis.DataSet();
        let dataset = new vis.DataSet();

        let graphSignals = graphOptions.graphSignals;
        if (graphSignals === undefined) graphSignals = []; 
        
        graphSignals.forEach(graphSignal => {
            groups.add({
                id: graphSignal.id,
                content: graphSignal.name,
                style: graphSignal.color ? "stroke:" + graphSignal.color + ";" : undefined,
                options: {
                    yAxisOrientation: graphSignal.yAxis || 'left',
                    interpolation: graphSignal.interpolation,
                    drawPoints: graphSignal.drawPoints !== undefined ? graphSignal.drawPoints : false,
                    shaded: graphSignal.shaded ? {orientation: 'bottom'} : undefined
                }
            });
        });

        let marks = graphOptions.marks;
        if (marks === undefined) marks = [];

        marks.forEach(mark => {
            groups.add({
                id: mark.name,
                content: `${mark.name} (${mark.value})`,
                style: mark.color ? "stroke:" + mark.color + ";" : undefined,
                options: {
                    yAxisOrientation: mark.yAxis || 'left',
                    interpolation: mark.interpolation,
                    drawPoints: mark.drawPoints !== undefined ? mark.drawPoints : false,
                    shaded: mark.shaded ? {orientation: 'bottom'} : undefined
                }
            });
            dataset.add({
                group: mark.name,
                x: vis.moment().add(-windowInterval, 'milliseconds'),
                y: mark.value
            });
        });
        
        const dataAxis = {
            left: {
                title: { text: graphOptions.yTitle},
                range: {
                    max: graphOptions.yMax,
                    min: graphOptions.yMin
                },
                format: formats[graphOptions.yFormat]
            },
            right: {
                title: { text: graphOptions.y2Title},
                range: {
                    max: graphOptions.y2Max,
                    min: graphOptions.y2Min
                },
                format: formats[graphOptions.y2Format]
            },
            visible: true
        };

        // delete y left axis properties if doesn't exists
        if (graphOptions.yTitle === undefined) delete dataAxis.left.title;
        if (graphOptions.yMax === undefined) delete dataAxis.left.range.max;
        if (graphOptions.yMin === undefined) delete dataAxis.left.range.min;
        if (graphOptions.yFormat === undefined) delete dataAxis.left.format;
        // delete y right axis properties if doesn't exists
        if (graphOptions.y2Title === undefined) delete dataAxis.right.title;
        if (graphOptions.y2Max === undefined) delete dataAxis.right.range.max;
        if (graphOptions.y2Min === undefined) delete dataAxis.right.range.min;
        if (graphOptions.y2Format === undefined) delete dataAxis.right.format;        

        // const height = container.clientHeight;        

        var options = {
            // graphHeight: 10,//height, // -39 for the x axis ticks
            start: vis.moment().add(-windowInterval, 'milliseconds'),
            end: vis.moment(),
            zoomable: false,            
            // showMinorLabels: true,
            // showMajorLabels: false,
            drawPoints: {
                style: 'circle'
            }
        };

        options['dataAxis'] = dataAxis;

        graph2d = new vis.Graph2d(container, dataset, groups, options);
        // populateExternalLegend();

        function populateExternalLegend() {
            var groupsData = groups.get();
            var legendDiv = document.getElementById(chartId+'-legend');
            legendDiv.innerHTML = "";
            // get for all groups:
            for (var i = 0; i < groupsData.length; i++) {
                // create divs
                var containerDiv = document.createElement("div");
                var iconDiv = document.createElement("div");
                var descriptionDiv = document.createElement("div");
                // give divs classes and Ids where necessary
                containerDiv.className = 'legend-element-container'; //col-xs-12 col-sm-6 col-md-4';
                containerDiv.id = groupsData[i].id + "_legendContainer"
                iconDiv.className = "icon-container";
                descriptionDiv.className = "description-container";
                // get the legend for this group.                
                var legend = graph2d.getLegend(groupsData[i].id,20,20);
                // append class to icon. All styling classes from the vis.css have been copied over into the head here to be able to style the
                // icons with the same classes if they are using the default ones.
                legend.icon.setAttributeNS(null, "class", "legend-icon");
                // append the legend to the corresponding divs
                iconDiv.appendChild(legend.icon);
                descriptionDiv.innerHTML = legend.label;
                // determine the order for left and right orientation
                //if (legend.orientation == 'left') {
                    descriptionDiv.style.textAlign = "left";
                    containerDiv.appendChild(iconDiv);
                    containerDiv.appendChild(descriptionDiv);
                // }
                // else {
                //   descriptionDiv.style.textAlign = "right";
                //   containerDiv.appendChild(descriptionDiv);
                //   containerDiv.appendChild(iconDiv);
                // }
                // append to the legend container div
                legendDiv.appendChild(containerDiv);
            }
        }

        function renderStep(){
            // move the window (you can think of different strategies).
            var now = vis.moment();
            var range = graph2d.getWindow();
            var interval = range.end - range.start;
            const strategy = 'discrete';
            switch (strategy) {
            case 'continuous':
                // continuously move the window
                graph2d.setWindow(now - interval, now, {animation: false});
                requestAnimationFrame(renderStep);
                break;

            case 'discrete':
                graph2d.setWindow(now - interval, now, {animation: true});
                break;

            default: // 'static'
                // move the window 9% to the left when now is larger than the end of the window
                if (now > range.end-interval*0.1) {
                    graph2d.setWindow(now - 0.01 * interval, now + 0.99 * interval);
                }
                break;
            }
        }
        
        function addDataPoints(yValues){
            const now = vis.moment();
            // add a new data point to the dataset
            yValues.forEach(yValue =>{
                dataset.add({
                    group: yValue.group,
                    x: now,
                    y: yValue.value
                });
            });
            // add marks if exists
            marks.forEach(mark =>{
                dataset.add({
                    group: mark.name,
                    x: now,
                    y: mark.value
                });
            });
            
            // remove all data points which are no longer visible
            var range = graph2d.getWindow();
            var interval = range.end - range.start;
            var oldIds = dataset.getIds({
                filter: function (item) {
                    return item.x < range.start - interval;
                }
            });
            dataset.remove(oldIds);
            renderStep();   
        };

        function setMaxRange(max){
            var options = {dataAxis: {left: {range: {max: max}}}};
            graph2d.setOptions(options);
        }
        
        return {
            addDataPoints,
            populateExternalLegend,
            setMaxRange
        };
    }
    
    function clean() {
        graph2d.destroy();
        unsubscribe();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}