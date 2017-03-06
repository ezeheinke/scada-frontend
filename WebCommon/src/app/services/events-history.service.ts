import { StateContainerService } from './state-container.service';
const stateContainer = StateContainerService();

declare var dc: any;
declare var d3: any;
declare var crossfilter: any;

// let subscriptions = [];
// let cachedEvents = [];
// let interval = undefined;
// let filters = {};

export function EventsHistoryService() {


    // function init() {
    //     console.log("<events-history>");

    //     // interval = setInterval(function(){
    //     //     if (subscriptions.length > 0) {
    //     //         updateEvents();
    //     //     }  
    //     // }, 3000);
    //     //updateEvents();

    //     console.log("</events-history>");
    // }

    // function setFilter(filter, value?){
    //     modifyFilter(filter, value)
    //     updateEvents();
    // }

    // function setFilters(filters){
    //     Object.keys(filters).forEach(filter => modifyFilter(filter, filters[filter])); 
    //     updateEvents();
    // }

    // function cleanFilters(){
    //     Object.keys(filters).forEach(filter => delete filters[filter]); 
    // }

    // function modifyFilter(filter, value){
    //     if (value === undefined) delete filters[filter];
    //     else {
    //         filters[filter] = value;
    //     }
    // }

    // function updateEvents() {        
    //     getEvents(filters).then(events => {
    //         cachedEvents = events;
    //         notify(events);
    //     });        
    // }
    const serverPath = stateContainer.Static.Data.serverPath;
    const token = stateContainer.read('user.token');  

    function getEvents(filters){                      
        const parameters = Object.keys(filters).map(filter => `${filter}=${filters[filter]}`);
        const queryString = parameters.length > 0 ? '?'+parameters.join('&') : '';
        return fetch(serverPath+'/api/events'+queryString, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            }
        })
        .then(response => response.json())
        .then(events => {
            events = events instanceof Array ? events : [];            
            return processEvents(events);
        });        
    }

    function processEvents(events: any[]) {
        const formatDateISO = d3.time.format.iso;
		const formatDate = d3.time.format("%Y-%m-%d");
        // replace StartDate for js Date object          
        events.forEach(event => {
            // event['StartDate'] = new Date(event.StartDate);
            // event['EndDate'] = event.EndDate !== null ? new Date(event.EndDate) : undefined;
            // event['AcknowledgeDate'] = event.AcknowledgeDate !== null ? new Date(event.AcknowledgeDate) : undefined;
        
			event.StartDate = formatDateISO.parse(event.StartDate);
			event.EndDate = event.EndDate !== null ? formatDateISO.parse(event.EndDate) : undefined;
			event.AcknowledgeDate = event.AcknowledgeDate !== null ? formatDateISO.parse(event.AcknowledgeDate) : undefined;
			event['date'] = new Date( formatDate(event.StartDate) );		
        });
        // order by descendant date
        // events = events.sort(function(left, right){
        //     return left.StartDate < right.StartDate ? 1 : -1;
        // });        
        return events;
    }

    function generateReport(eventIds){        
        return fetch(serverPath+'/api/events/report', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(eventIds)
        })
        .then(response => response.text() )
        .then(filePath => {
            return serverPath+filePath;
        });
    }

    // function subscribe(callback){
    //     subscriptions.push(callback);
    //     callback(cachedEvents);
    //     function unsubscribe() {
    //         subscriptions = subscriptions.filter(subscription => subscription !== callback);
    //     }
    //     return unsubscribe;
    // }

    // function notify(events){
    //     subscriptions.forEach(callback => callback(events));
    // }

    // function clean(){
    //     // window.clearInterval(interval);
    // }
    
    return {
        // init,
        getEvents,
        generateReport
        // setFilter,
        // setFilters,
        // cleanFilters,
        // subscribe,
        // clean
    }
    
}