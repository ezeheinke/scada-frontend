import Ractive from 'ractive';

declare var $: any;
declare var moment: any;
declare var dc: any;
declare var d3: any;
declare var crossfilter: any;

import { EventsHistoryService } from '../../services/events-history.service';
// import { EventCheckerService } from '../../services/event-checker.service';

const eventsHistory = EventsHistoryService();
// const eventChecker = EventCheckerService();

export function EventsGraphsComponent() {     
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div id="events">

                <div class="{{displayGraphs ? '' : 'hidden'}}">

                    <div class="row">

                        <div class="col-md-6 padding-block">
                            <label for="date-range-input">Date Range</label>
                            <input id='date-range-input' type='text' placeholder="Date Range" class="input-field clickable small-width"/>
                        </div>

                        <div class="col-md-6 padding-block">
                            <button id="export-excel-button" class="primary-button no-margin" on-click="exportFilterEvents">
                                <i class="icon dripicons-export"></i> Export Excel
                            </button>
                            <iframe id="download-iframe" style="display:none;"></iframe>
                            <button id="clear-filter-button" class="no-margin" on-click="cleanFilters">
                                Clear Filter
                            </button>
                            <label class="pull-right">{{amountFilterEvents}} events found</label>
                        </div>
                        
                        <!-- Events history -->
                        <div class="col-xs-12 padding-block">
                            <div id="chart-events-history" class="dc-chart"></div>
                        </div>

                        <!-- Events source -->
                        <div class="col-md-9 padding-block">
                            <div id="chart-events-source" class="dc-chart"></div>
                        </div>

                        <!-- Events type -->
                        <div class="col-md-3 padding-block">
                            <div id="chart-events-type" class="dc-chart"></div>				
                        </div>                                                

                        <!-- Events table -->
                        <div class="col-xs-12 padding-block">

                            <!-- Select display events -->
                            <div class="text-align-right">
                                <div class="events-selector">
                                    <label>Max Display </label>
                                    <select value='{{amountEvents}}' class="small-width" on-change="displayEvents:{{amountEvents}}">
                                        <option value='10' selected>10</option>
                                        <option value='20'>20</option>
                                        <option value='50'>50</option>
                                        <option value='100'>100</option>
                                        <option value='200'>200</option>
                                    </select>
                                    <label> events in table</label>
                                </div>
                            </div>
                
                            <!-- Table -->
                            <table id="data-table" class="table table-responsive custom-table-with-theme">
                                <thead>
                                <tr class="header">
                                    <th>StartTime</th>
                                    <th>EndTime</th>
                                    <th>Source</th>
                                    <th>Event Message</th>
                                    <th>Acknowledge</th>
                                </tr>
                                </thead>
                            </table>
                        </div>
                    </div>	

                </div>
            </div>
        `,
        data: {
            events: [],
            // printDate
        }
    };    

    let unsubscribe = undefined;
    
    function init(elem) {
        console.log("<events-graphs>");
        ractiveData.el = elem;        
        ractive = new Ractive(ractiveData);

        // default start and end dates (Last 30 days)
	    const startDate = moment().subtract(29, 'days');
        const endDate = moment();

        initDateRangePicker(startDate, endDate);
        
        console.log("</events-graphs>");
        return load(startDate, endDate);

    }

    function initDateRangePicker(startDate, endDate){
         $('#date-range-input').daterangepicker({
            startDate,
            endDate,
            "ranges": {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
            "locale": {
                "format": "DD/MM/YYYY",
                "firstDay": 1,
                "applyLabel": "Select"
            }
        }, function(startDate, endDate, label) {            
            load(startDate, endDate);
        });
    }

    function load(fromDate, toDate) {
        
        return eventsHistory.getEvents({'from': fromDate.format("YYYY-MM-DD"), 'to': toDate.format("YYYY-MM-DD")})
            .then(events => {            
                const ndx = crossfilter(events);
                drawCharts(fromDate, toDate, ndx)
            });
    }

    const eventTypes = {
        INFO: {icon: "icon dripicons-information", color: "#3498DB"},
        COMM: {icon: "icon dripicons-link-broken", color: "#95A5A6"},
        ALARM: {icon: "icon dripicons-warning", color: "#F39C12"},
        ERROR: {icon: "icon dripicons-warning", color: "#E74C3C"},
        SETPOINT: {icon: "icon dripicons-warning", color: "#F1C40F"}
    };

    function getEventIcon(event) {
        let type = event && event.Type ? event.Type.toUpperCase() : "INFO";
        return eventTypes[type].icon;
    }

    function getEventColor(event) {
        let type = event && event.Type ? event.Type.toUpperCase() : "INFO";
        return eventTypes[type].color;
    }

    function drawCharts(fromDate, toDate, ndx){
        ractive.set('displayGraphs', true);
        const formatDateNice = d3.time.format("%Y-%m-%d %H:%M:%S");

        const eventTypesColors = {
            'INFO': '#3498DB',
            'ERROR': '#E74C3C',
            'ALARM': '#F39C12',
            'COMM': '#95A5A6',
            'SETPOINT': '#F1C40F'
        }
        const eventTypes = Object.keys(eventTypesColors);

        function eventTypeAdd(accum, event) {                
            accum[event.Type]++;
            return accum;
        }

        function eventTypeRemove(accum, event) {
            accum[event.Type]--;
            return accum;
        }

        function eventTypeInitial() {
            const accum = {};
            eventTypes.forEach(eventType => accum[eventType] = 0);
            return accum;
        }

        // Count
        const dataCount = dc
                .dataCount('#data-count')
                .dimension(ndx)
                .group(ndx.groupAll());

        //Events history
        var historyDim = ndx.dimension(function(event){ return event.date;});
        var eventsCount = historyDim.group().reduce(eventTypeAdd, eventTypeRemove, eventTypeInitial);

        const historyChart = dc.barChart('#chart-events-history');
        const historyWidth = document.querySelector('#chart-events-history').parentNode['clientWidth'] - 45;

        historyChart
            .width(historyWidth)		
            .height(100)
            .dimension(historyDim)
            .group(eventsCount, eventTypes[0], (point) => point.value[eventTypes[0]])
            .colors((eventType) => eventTypesColors[eventType])
            .x(d3.time.scale().domain([
                fromDate,
                toDate
            ]))
            .xUnits(d3.time.days)
                .elasticY(true)
                .centerBar(true)
                .yAxisLabel('Events')
                .margins({top: 10, right: 20, bottom: 20, left: 45});
        
        historyChart.yAxis().ticks(4);

        eventTypes.slice(1).forEach( eventType => historyChart.stack(eventsCount, eventType, (point) => point.value[eventType]) );

        // Events source
        const sourceChart = dc.barChart('#chart-events-source');
        const sourceWidth = document.querySelector('#chart-events-source').parentNode['clientWidth'];

        const sourceDim = ndx.dimension(function(event){return event.SourceName});
        const eventsPerSource = sourceDim.group().reduce(eventTypeAdd, eventTypeRemove, eventTypeInitial);
                
        sourceChart
            .width(sourceWidth)
            .height(200)
            .dimension(sourceDim)
            .group(eventsPerSource, eventTypes[0], (point) => point.value[eventTypes[0]])
            .title(function(point){ return `${this.layer}: ${(point.value[this.layer])} events`;})
            .colors((eventType) => eventTypesColors[eventType])
            .x(d3.scale.ordinal() )
            .xUnits(dc.units.ordinal)
                .barPadding(0.1)
                .yAxisLabel('Events')
                .elasticY(true)
                .margins({top: 10, right: 20, bottom: 60, left: 45});		
        sourceChart.yAxis().ticks(8);

        eventTypes.slice(1).forEach( eventType => sourceChart.stack(eventsPerSource, eventType, (point) => point.value[eventType]) );

        // Year pie chart
        const typeChart = dc.pieChart('#chart-events-type');

        var typeDim = ndx.dimension(function(event){return event.Type});
        var eventsPerType = typeDim.group().reduceCount();

        typeChart
            .width(150)
            .height(150)
            .dimension(typeDim)
            .group(eventsPerType)			
                .colors((eventType) => eventTypesColors[eventType])
                .innerRadius(20);

            
        // Data table
        const allDim = ndx.dimension(function(event){return event.StartDate;});
        const dataTableGroup = function(event){return '';}; 
            
        const dataTable = dc.dataTable('#data-table');

        dataTable
            .dimension(allDim)
            .group(dataTableGroup)        
            .columns([
                function(event){return formatDateNice(event.StartDate);},
                function(event){return event.EndDate ? formatDateNice(event.EndDate) : '';},
                function(event){return event.SourceName;},
                function(event){return `<span style="color:${getEventColor(event)}" class="${getEventIcon(event)}" title="${event.Type}"></span> ${event.Message}`;},
                function(event){return event.AcknowledgeDate ? formatDateNice(event.AcknowledgeDate)+' - '+event.AcknowledgeMessage : '';}
            ])		
                .sortBy(function(event){return event['StartDate'];})
                .order(d3.descending)
                .size( parseInt(ractive.get('amountEvents')) )
                .on('renderlet', function(table) {
                    // each time table is rendered remove nasty extra row dc.js insists on adding
                    table.select('tr.dc-table-group').remove();
                    ractive.set('amountFilterEvents', allDim.top(Infinity).length);
                });
        
        // Ractive clean event handlers
        ractive.off('exportFilterEvents');
        ractive.off('displayEvents');
        ractive.off('cleanFilters');

        // Ractive set event handlers
        ractive.on('exportFilterEvents', function(event){		
            const filterEvents = allDim.top(Infinity);
            const eventIds = filterEvents.map(event => event.CScadaEventId);
            eventsHistory.generateReport(eventIds)
            .then(reportUrl => document.getElementById('download-iframe')['src'] = reportUrl);            		
        });

        ractive.on('displayEvents', function(event, amountEvents){
            amountEvents = parseInt(amountEvents);
            dataTable.size(amountEvents);
            dataTable.redraw();
        });

        // Clean filters
        ractive.on('cleanFilters', function() {
            dc.filterAll();
            dc.renderAll();
        });
        
        // Render all
        dc.renderAll();
    }

    // function printDate(date) {
    //     if (date instanceof Date === false) {
    //         return "";
    //     }
    //     const format = x => x < 10 ? `0${x}` : x;

    //     const year = date.getFullYear();
    //     const month = date.getMonth() + 1;
    //     const day = date.getDate();
    //     const hour = date.getHours();
    //     const minute = date.getMinutes();
    //     const second = date.getSeconds();

    //     return `${year}-${format(month)}-${format(day)} ${format(hour)}:${format(minute)}:${format(second)}`;
    // }
    
    function clean() {
        // unsubscribe();
        ractive.teardown();
    }
    
    return {
        init,
        load,
        clean
    };
}