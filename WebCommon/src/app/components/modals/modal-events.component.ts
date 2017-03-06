import Ractive from 'ractive';

declare var moment: any;

import { EventCheckerService } from '../../services/event-checker.service';

const eventChecker = EventCheckerService();

export function ModalEventsComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
        <div class="modal-dialog modal-narrow" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <div class="modal-title">
                        Events {{asset ? 'from '+asset.name : ''}}
                    </div>
                    <div class="modal-tab-wrapper">
                        <div class="modal-tab {{activeTab === 'recent' ? 'active' : ''}}" on-click="select:recent">Recent ({{recent}})</div>
                        <div class="modal-tab {{activeTab === 'urgent' ? 'active' : ''}}" on-click="select:urgent">Urgent ({{urgent}})</div>
                    </div>
                </div>
                <div class="modal-body">
                    {{#if events.length === 0}}
                        <div class="notice-text">No events to acknowledge.</div>
                    {{else}}
                    <ul>
                    {{#events}}
                        <li>
                            <div class="list-icon error"><span class="icon dripicons-warning"></span></div>
                            <div class="list-title">{{Source}}</div>       
                            <div class="list-time">{{formatDate(StartDate)}}</div>
                            <div class="list-message">{{Text}}</div>
                            <div class="button-container">
                                {{#if editMode === false}}
                                <button on-click="enterEditMode:{{this}}">Add a Comment</button>
                                {{else}}
                                <input type="text" value="{{ackMessage}}"/>
                                {{/if}}
                                <button on-click="acknowledge:{{this}}">Acknowledge</button>
                            </div>
                        </li>
                    {{/events}}
                    </ul>
                    {{/if}}
                </div>            
            </div>
        </div>`,
        data: {
            asset: undefined,
            activeTab: 'urgent',
            recent: 0,
            urgent: 0,
            events: [],            
            formatDate: date => moment(date).format("YYYY-MM-DD HH:mm:ss")
        }
    };

    let unsubscribe = undefined;
    
    function init(elem, asset = undefined) {
        console.log("<modal-events>");
        ractiveData.el = elem;
        ractiveData.data.asset = asset;
        ractive = new Ractive(ractiveData);

        ractive.on('select', function(event, selected){
            if (selected !== ractive.get('activeTab')) {
                ractive.set({
                    'activeTab': selected,
                    'events': selected === 'urgent' ? eventsUrgent : eventsRecent
                });                    
            }
        });

        ractive.on('acknowledge', function(domEvent, event){
            eventChecker
            .acknowledge(event.CScadaEventId, event.ackMessage)
            .then(function(response){
                console.info(`Event ${event.CScadaEventId} - ${event.Source} - ${event.Text} acknowledged`);
            });
        });

        let eventsUrgent = [];
        let eventsRecent = [];
        
        let firstLoad = true;
        let eventsInEdition = {};
        unsubscribe = eventChecker.subscribe(function(_events){
            const events = _events.slice(0)
            .filter(event => asset ? event.Source === asset.eventSourceName : true)
            .map(event => {
                let editMode = false;
                let ackMessage = "Acknowledged without comments";                
                if (eventsInEdition[event.CScadaEventId] !== undefined){
                    editMode = true;
                    ackMessage = eventsInEdition[event.CScadaEventId];
                }                
                event.editMode = editMode;
                event.ackMessage = ackMessage;
                return event;
            });            
            eventsUrgent = events
            .filter(event => event.Type === 'ERROR' || event.Type === 'SETPOINT' && event.SubType === "sound1");
            eventsRecent = events
            .filter(event => eventsUrgent.find(eventUrgent=>eventUrgent.CScadaEventId===event.CScadaEventId) === undefined); // not urgents
            if (firstLoad) {
                if (eventsUrgent.length === 0) ractive.set('activeTab', 'recent'); 
                firstLoad = false;
            }
            ractive.set({
                'recent': eventsRecent.length,
                'urgent': eventsUrgent.length,
                'events': ractive.get('activeTab') === 'urgent' ? eventsUrgent : eventsRecent
            });
            //clear events that doesnt exist anymore
            Object.keys(eventsInEdition).forEach(function(eventId){
                if (events.find(event => event.CScadaEventId === parseInt(eventId)) === undefined){                    
                    delete eventsInEdition[eventId];
                }
            });
        });

        ractive.on('enterEditMode', function(domEvent, event){
            event.editMode = true;
            event.ackMessage = '';            
            ractive.update();
        });

        ractive.observe('events.*.ackMessage', function ( newValue, oldValue, keypath ) {
            const event = ractive.get(keypath.split('.').slice(0, -1).join('.'));            
            eventsInEdition[event.CScadaEventId] = newValue;
        }, {init: false});

        console.log("</modal-events>");
    }
    
    function clean() {
        unsubscribe();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}