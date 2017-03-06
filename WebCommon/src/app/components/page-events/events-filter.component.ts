import Ractive from 'ractive';
declare var $: any;

import { EventsHistoryService } from '../../services/events-history.service';
// import { ResourcesService } from '../../services/resources.service';
const eventsHistory = EventsHistoryService();
// const resources = ResourcesService();

export function EventsFilterComponent() {
    
    let ractive: IRactive = undefined;

    
    const ractiveData = {
        el: undefined,
        template: `
            
        `,
        sources: [],
        types: []
    };

    const eventTypes = ['ALL', 'INFO', 'ERROR', 'ALARM', 'COMM', 'SETPOINT'];
    
    function init(elem) {
        console.log("<events-filter>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        // const currentDate = new Date();
        // const firstDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        // currentDate.setDate(currentDate.getDate() + 1);

        // applyFilters({
        //     'from': `${firstDate.getFullYear()}-${firstDate.getMonth()+1}-01`,
        //     'to': currentDate.toISOString().split('T')[0]
        // });


        // initDateTimePicker('#date-start-input', firstDate,
        // function (event) {
        //     const date = event.date.format().split('T')[0];
        //     applyFilter('from', date);
        // });        
        // initDateTimePicker('#date-end-input', currentDate, 
        // function (event) {
        //     const date = event.date.format().split('T')[0];
        //     applyFilter('to', date);
        // });

        // const sources = ['ALL'].concat( resources.getAssets().map(asset => asset.eventSourceName) );        

        // ractive.set('sources', sources);
        // ractive.set('types', eventTypes);

        // ractive.on('applyFilter', (event, filter, value) => applyFilter(filter, value));        

        console.log("</events-filter>");
    }    

    // function applyFilter(filter, newValue){
    //     const value = newValue === 'ALL' ? undefined : newValue;            
    //     eventsHistory.setFilter(filter, value);
    // }

    // function applyFilters(filters){
    //     Object.keys(filters).forEach(filter => filters[filter] = filters[filter] === 'ALL' ? undefined : filters[filter] );     
    //     eventsHistory.setFilters(filters);
    // }

    // function initDateTimePicker(elem, defaultDate, callback){
    //     var datePicker = $(elem).datetimepicker({
    //         format: 'DD/MM/YYYY'            
    //     });        
    //     $(elem).data("DateTimePicker").date(defaultDate);
    //     $(elem).on("dp.change", callback);
    // } 
    
    function clean() {
        // eventsHistory.cleanFilters();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}