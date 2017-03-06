declare var dc: any;
declare var d3: any;
declare var crossfilter: any;

export function TestDcComponent() {                    
    
    function init(elem) {
        console.log("<bar-chart>: "+elem);         
        drawChart(elem);                      
        console.log("</bar-chart>: "+elem);
    }
    
    function clean() {
        // nothing ?
    }
    
    function drawChart(elem){
        
        d3.json('data/assets-energy-per-day.json', function (error, data) {
            var records = data;

            var fullDateFormat   = d3.time.format('%Y-%m-%d');
            var yearFormat       = d3.time.format('%Y');
            var monthFormat      = d3.time.format('%b');
            var dayOfMonthFormat = d3.time.format('%d');
            var dayOfWeekFormat  = d3.time.format('%a');

            // normalize/parse data so dc can correctly sort & bin them
            records.forEach(function(record) {        
                record.count     = +record.energy;
                record.parseDate =  fullDateFormat.parse(record.date);
                // get year, month, dayOfMonth and dayOfWeek
                record.dateYear       = +yearFormat(record.parseDate);
                record.dateMonth      =  monthFormat(record.parseDate);
                record.dateDayOfMonth = +dayOfMonthFormat(record.parseDate);
                record.dateDayOfWeek  =  dayOfWeekFormat(record.parseDate);
            });
            
            var ndx = crossfilter(records); // cft.crossfilter(records);            
            
            // Charts
                // Data count
                var dataCount = dc.dataCount('#data-count');
                // Line charts        
                var historyChart = dc.lineChart('#chart-energy-history');
                var rangeChart = dc.lineChart('#chart-history-range');
                // Bar charts
                var assetChart = dc.barChart('#chart-energy-asset');
                var dayOfMonthChart = dc.barChart('#chart-energy-dayOfMonth');          
                // Pie charts
                var yearChart = dc.pieChart('#chart-ring-year');
                var monthChart = dc.pieChart('#chart-ring-month');
                var dayOfWeekChart = dc.pieChart('#chart-ring-day');
                var typeChart = dc.pieChart('#chart-ring-type');
                // Data table
                var dataTable = dc.dataTable('#data-table');
            
            // Dimensions
                // Data count
                var dataCountDim = ndx;
                // Line charts
                var historyDim = ndx.dimension(dc.pluck('parseDate'));        
                // Bar charts
                var assetDim = ndx.dimension(function(record){return record.asset.name});
                var dayOfMonthDim = ndx.dimension(dc.pluck('dateDayOfMonth'));
                //Pie Charts
                var yearDim = ndx.dimension(dc.pluck('dateYear'));
                var monthDim = ndx.dimension(dc.pluck('dateMonth'));
                var dayOfWeekDim = ndx.dimension(dc.pluck('dateDayOfWeek'));
                var typeDim = ndx.dimension(function(record){return record.asset.type});
                // Data table
                var allDim = ndx.dimension(function(d){return d;}); 
            
            // Groups
                // Data count
                var all = ndx.groupAll();
                // Line charts
                var energyPerDay = historyDim.group().reduceSum(function(record){return record.energy});
                // Bar charts
                var energyPerAsset = assetDim.group().reduceSum(function(record){return record.energy});
                var energyPerDayOfMonth = dayOfMonthDim.group().reduceSum(function(record){return record.energy});
                // Pie Charts
                var energyPerYear = yearDim.group().reduceSum(function(record){return record.energy});
                var energyPerMonth = monthDim.group().reduceSum(function(record){return record.energy});
                var energyPerDayOfWeek = dayOfWeekDim.group().reduceSum(function(record){return record.energy});
                var energyPerType = typeDim.group().reduceSum(function(record){return record.energy});
                // Data table
                var dataTableGroup = function(d){return '';}; 
            
            // Data count
            dataCount
                .dimension(dataCountDim)
                .group(all);

        // History line chart
        historyChart
                .width(1200)
                .height(300)
                .dimension(historyDim)
                .group(energyPerDay)   
                .x(d3.time.scale().domain([
                    d3.min(records, dc.pluck('parseDate')),
                    d3.max(records, dc.pluck('parseDate'))
                ]))
                    .rangeChart(rangeChart)
                    .yAxisLabel('Energy (kWh)')
                    .elasticY(false)
                    //.elasticX(true)
                    //.mouseZoomable(true)         
                    //.margins({top: 10, right: 20, bottom: 70, left: 50});
        
        // Range bar chart
        rangeChart
                .renderArea(true)
                .width(1200)
                .height(100)        
                .dimension(historyDim)
                .group(energyPerDay)        
                .x(d3.time.scale().domain([
                    d3.min(records, dc.pluck('parseDate')),
                    d3.max(records, dc.pluck('parseDate'))
                ]))             
                    .yAxisLabel('Energy (kWh)')
                    .elasticY(true)     
                    .margins({top: 0, right: 50, bottom: 20, left: 40});
            rangeChart.yAxis().tickFormat(function(d){return '';});             
        //    rangeChart
        //         .width(1200)
        //         .height(40)        
        //         .dimension(historyDim)
        //         .group(energyPerDay)        
        //         .x(d3.time.scale().domain([
        //             d3.min(records, dc.pluck('parseDate')),
        //             d3.max(records, dc.pluck('parseDate'))
        //          ])) 
        //             .centerBar(true)
        //             .gap(1)
        //             .round(d3.time.month.round)
        //             .alwaysUseRounding(true)            
        //             .margins({top: 0, right: 50, bottom: 20, left: 40});
        //     rangeChart.yAxis().tickFormat(function(d){return ''});            
                
        // Asset bar chart
        assetChart
                .width(600)
                .height(200)
                .dimension(assetDim)
                .group(energyPerAsset)
                
                .xUnits(dc.units.ordinal)
                .x(d3.scale.ordinal() )
                
                /*.x(d3.scale.ordinal().domain(["", "a", "b", "c"])) // Need the empty val to offset the first value    
                .x(d3.scale.linear()
                    //.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21])
                    .range(["Aldehuelas", "Urano", "Juno", "Luna", "Grisel", "Acampo Armijo", "Bosque Alto", "Los Labrados", "Plana de la Balsa", "Plana de María", "Plana de Zaragoza", "Muel", "Río Gállego", "Lanternoso", "Bancal", "Los Siglos", "La Loma", "Villalgordo", "Cepeda", "Chomba", "La Mora", "Andasol 3"])
                )   */             
                //.x(d3.scale.linear().domain([-0.2, d3.max(beerData,function(d){return d.beer.beer_abv;}) + 0.2]))
                
                    //.xAxisLabel('Asset')
                    //.centerBar(true)
                    .barPadding(0.1)
                    .yAxisLabel('Energy (kWh)')
                    .elasticY(true)            
                    .margins({top: 10, right: 20, bottom: 70, left: 50});
            assetChart.yAxis().tickFormat(function(d){return d/1000;});              

            // Day of month bar chart
        dayOfMonthChart
                .width(600)
                .height(180)
                .dimension(dayOfMonthDim)
                .group(energyPerDayOfMonth)
                .x(d3.scale.linear().domain([0.8, 31 + 0.2]))            
                //.x(d3.scale.linear().domain([-0.2, d3.max(beerData,function(d){return d.beer.beer_abv;}) + 0.2]))
                    .xAxisLabel('Day of Month')
                    .centerBar(true)
                    .barPadding(0.1)
                    .yAxisLabel('Energy (kWh)')
                    .elasticY(true)            
                    .margins({top: 10, right: 20, bottom: 50, left: 50});
            dayOfMonthChart.yAxis().tickFormat(function(d){return d/1000;});    
            
            // Year pie chart         
            yearChart
                .width(150)
                .height(150)
                .dimension(yearDim)
                .group(energyPerYear)
                    .innerRadius(20);
                    
            // Month pie chart
            monthChart
                .width(150)
                .height(150)
                .dimension(monthDim)
                .group(energyPerMonth)
                    .innerRadius(20)
                    .ordering(function (d) {
                        var order = {
                            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
                            'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
                            'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
                        };
                        return order[d.key];
                    });
            
            // Day of week pie chart        
            dayOfWeekChart
                .width(150)
                .height(150)
                .dimension(dayOfWeekDim)
                .group(energyPerDayOfWeek)
                    .innerRadius(20)
                    .ordering(function (d) {
                        var order = {
                            'Mon': 1, 'Tue': 2, 'Wed': 3,'Thu': 4,
                            'Fri': 5, 'Sat': 6, 'Sun': 7
                        };
                        return order[d.key];
                    });
            
            // Day of week pie chart        
            typeChart
                .width(150)
                .height(150)
                .dimension(typeDim)
                .group(energyPerType)
                    .innerRadius(20);
                        
            // Data table
                // <th>Asset</th>
                // <th>Type</th>
                // <th>Date</th>
                // <th>Energy</th>
            dataTable
                .dimension(allDim)
                .group(dataTableGroup)
                .size(10)
                .columns([
                    function(record){return record.asset.name;},
                    function(record){return record.asset.type;},
                    function(record){return record.date;},
                    function(record){return record.energy;}
                ])
                    .sortBy(function(record){return record.energy;})
                    .order(d3.descending)
                    .on('renderlet', function(table) {
                        // each time table is rendered remove nasty extra row dc.js insists on adding
                        table.select('tr.dc-table-group').remove();
                    });
        
        // Clean filters
            d3.selectAll('a#all').on('click', function () {
                dc.filterAll();
                dc.renderAll();
            });
            d3.selectAll('a#year').on('click', function () {
                yearChart.filterAll();
                dc.redrawAll();
            });
            d3.selectAll('a#month').on('click', function () {
                monthChart.filterAll();
                dc.redrawAll();
            });
            d3.selectAll('a#day').on('click', function () {
                dayOfWeekChart.filterAll();
                dc.redrawAll();
            });
            d3.selectAll('a#type').on('click', function () {
                typeChart.filterAll();
                dc.redrawAll();
            });   
 
        // Render all
        dc.renderAll();
        });           
              
    }
    
    return {
        init,
        clean
    };
}