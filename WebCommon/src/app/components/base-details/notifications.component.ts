import Ractive from 'ractive';

import { EventCheckerService } from '../../services/event-checker.service';
import { ModalWindowService } from '../../services/modal-window.service';

const eventChecker = EventCheckerService();
const modalWindow = ModalWindowService();

export function NotificationsComponent() {             
    
    let ractive: IRactive = undefined;    
    
    const ractiveData = {
        el: undefined,
        template: `
            <div class="system-control-icon clickable"
                 on-click="showNotifications"
                 title="{{eventsLength > 0 ? eventsLength+' event'+(eventsLength>1?'s':'')+' to acknowledge' : 'No events'}}">
                    <span class="icon dripicons-bell"></span>
                    {{#if eventsLength > 0}}
                    <span class="notification-flag {{importantEventsLength > 0 ? 'important' : 'not-important'}}">{{importantEventsLength > 0 ? importantEventsLength : ''}}</span>
                    {{/if}}
            </div>
        `,
        data: {
            eventsLength: 0,
            importantEventsLength: 0
        }
    };

    let unsubscribe = undefined;
    
    function init(elem) {
        console.log("<notifications>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        unsubscribe = eventChecker.subscribe(function(events) {
            const importantEvents = events
            .filter(event => event.Type === 'ERROR' || event.Type === 'SETPOINT' && event.SubType === "sound1");
            ractive.set({
                eventsLength: events.length,
                importantEventsLength: importantEvents.length
            });
        });

        ractive.on('showNotifications', () => modalWindow.displayEvents());

        console.log("</notifications>");
    }

    function acknowledge(event) {
        const eventId = event.CScadaEventId;
        const message = "no message";
        eventChecker.acknowledge(eventId, message)
        .then(response => {
            console.info(`Event ${eventId} acknowledged with message: ${message}`);
        });
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