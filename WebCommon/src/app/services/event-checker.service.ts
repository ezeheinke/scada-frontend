import { CompactScadaService } from './compact-scada.service';
import { StateContainerService } from './state-container.service';

let subscriptions = [];
let cachedEvents = [];


const availableAlarms = {};
let activeSound = undefined;
let unsubscribe = undefined;

export function EventCheckerService() {
    
    const compactScada = CompactScadaService();
    const stateContainer = StateContainerService();    


    function init() {
        console.log("<event-checker>");

        unsubscribe = compactScada.subscribe('^MOD\\.EventChecker\\.ActiveNotAckEvents$', function (signals: Signal[]) {
            const activeNotAckEvents = signals[0];
            let events = activeNotAckEvents && activeNotAckEvents.Value !== "" ? JSON.parse(activeNotAckEvents.Value) : [];
            events = processEvents(events);            
            cachedEvents = events;
            notify(events);
        });

        //init the sounds..
        for (let i = 1; i <= 5 ; i++) {
            //name on database
            let id = "sound"+i;
            availableAlarms[id] = new Audio('data/eventSounds/beep-0'+i+'.wav');
            availableAlarms[id].loop = true;
        }

        console.log("</event-checker>");
    }

    function pause() {
        if (activeSound !== undefined)
            activeSound.pause();
    }
    function play() {
        if (activeSound !== undefined)
            activeSound.play();
    }

    function processEvents(events: any[]) {                    
        
        if (events.length > 0){
            
            //pause if there was a different sound already playing..
            pause();
            activeSound =  availableAlarms[events[0].SubType.toLowerCase()];
            play();
            
            // replace StartDate for js Date object          
            events.forEach(event => {
                event.StartDate = new Date(parseInt( event.StartDate.replace("/Date(", "").replace(")/", "") )); 
            });
            // order by descendant date
            events = events.sort(function(left, right){
                return left.StartDate < right.StartDate ? 1 : -1;
            });
        }
        else {
            pause();
        }
        return events;
    }    

    function subscribe(callback){
        subscriptions.push(callback);
        callback(cachedEvents);
        function unsubscribe() {
            subscriptions = subscriptions.filter(subscription => subscription !== callback);
        }
        return unsubscribe;
    }

    function notify(events){
        subscriptions.forEach(callback => callback(events));
    }

    function acknowledge(eventId, ackMessage = "Acknowledged without comments") {
        const userName = stateContainer.read('user.fullname');

        const ackEvent = [{
            "EventId": eventId,
            "AcknowledgeUser": userName,
            "AcknowledgeMessage": ackMessage
        }];

        return compactScada.setSignal("MOD.EventChecker.EventAcknowledgeRequest", JSON.stringify(ackEvent));        
    }

    function clean(){
        pause();
        unsubscribe();
    }
    
    return {
        init,
        subscribe,
        acknowledge,
        clean
    }
    
}