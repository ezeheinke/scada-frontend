import Ractive from 'ractive';
import * as RactiveTooltip from 'ractive-tooltip';

declare var moment: any;

import { ResourcesService } from '../../services/resources.service';
import { EventCheckerService } from '../../services/event-checker.service';
import { ModalWindowService } from '../../services/modal-window.service';

const resources = ResourcesService();
const eventChecker = EventCheckerService();
const modalWindow = ModalWindowService();  

export function DevicesAlertsComponent() {  

const ractiveData = {
    isolated: true,
    decorators: { tooltip: RactiveTooltip.default },
    template: `
        <div class="alert-cell alert-{{timeRemain||disconnectedGrid ? 'error' : regulation ? 'danger' : ''}}">
            {{#if disconnected}}
                <span 
                    decorator='tooltip: Asset disconnected'
                    class="icon dripicons-link-broken"> 
                </span>
            {{/if}}
            {{#if disconnectedGrid}}
                <span 
                    decorator='tooltip: Disconnected from Grid'
                    class="icon dripicons-warning"> 
                </span>
            {{/if}}
            {{#if regulation}}
                <span
                    decorator='tooltip: Regulation active'
                    class="icon dripicons-lightbulb">
                </span>
                <span class="setpoint-motive" decorator='tooltip:{{getSetpointMotive(setpointMotive)}}'><b>{{setpointMotive}}</b></span>
            {{/if}}
            {{#if timeRemain}}
                <span on-click="showNotifications"
                        decorator='tooltip: Time remaining to acknowledge'
                        class="time-remain clickable">
                    {{timeRemain}}
                </span>
            {{/if}}
        </div>
    `,
    data: {            
        'disconnected': false,
        'disconnectedGrid': false,
        'regulation': false,
        'timeRemain': false,
        getSetpointMotive        
    },
    oninit
};

function oninit(){
    const ractive = this;
    const unsubscribes = [];

    const asset = ractive.get('asset');                   

    ractive.on('teardown', () => {
        unsubscribes.forEach(unsubscribe => unsubscribe());
        console.log('adios '+asset.id);
    });
    // this component doesn't subscribe signals to assets cause there are many of this components (one per each cell) 
    unsubscribes.push(
        resources.subscribeToDevices(assets => {
            const availability = asset.signals['Availability'] ? asset.signals['Availability'].Value : undefined;
            const gridConnection = asset.signals['GridConnection'] ? asset.signals['GridConnection'].Value : undefined;
            ractive.set({
                disconnected: availability === 'disconnected',
                disconnectedGrid: gridConnection !== 2,                
                regulation: availability === 'regulation'
            });            
            setpointMotive = asset.signals['SetpointMotive'] ? asset.signals['SetpointMotive'].Value : 0;
            ractive.set('setpointMotive', setpointMotive);
        })
    );
    
    let setpointMotive = 0;
    let timeOfLastEvent = undefined;

    unsubscribes.push( 
        eventChecker.subscribe(function(events) {                
            const assetEventsUrgent = events.filter(event => {
                return event.Source === asset.eventSourceName && event.Type === 'SETPOINT' && event.SubType !== "silence";
            });
            if (assetEventsUrgent.length > 0){
                const lastEvent = assetEventsUrgent[0];
                timeOfLastEvent = moment(lastEvent.StartDate);                
            }
            else {
                timeOfLastEvent = undefined;
                ractive.set('timeRemain', false);
            }
        })
    );

    const seconds15min = 15 * 60;

    const interval = window.setInterval(function(){
        if (timeOfLastEvent) {
            const secondsDiff = moment().diff(timeOfLastEvent, 'seconds');
            const remain = moment.duration(seconds15min - secondsDiff, 'seconds');
            const remainSign = remain.seconds() >= 0;
            let remainMinutes: any = Math.abs(remain.minutes());
            let remainSeconds: any = Math.abs(remain.seconds());
            remainMinutes = remainMinutes < 10 ? '0'+remainMinutes : remainMinutes;
            remainSeconds = remainSeconds < 10 ? '0'+remainSeconds : remainSeconds;
            ractive.set('setpointMotive', setpointMotive);
            ractive.set('timeRemain', `${remainSign?'':'-'}${remainMinutes}:${remainSeconds}`);
        }
    }, 1000);
    unsubscribes.push(
        () => window.clearInterval(interval)
    );

    ractive.on('showNotifications', () => {            
        modalWindow.displayEvents(asset);
    });
}

const setpointMotives = {
    0: "0 - No limitation",
    1: "1 - Evacuation of wind energy congested",
    2: "2 - Voltage dips",
    3: "3 - Power in short circuit",
    4: "4 - Balance of power viability",
    5: "5 - Exceeded production poured into the grid",
    6: "6 - Unknown motive",
    "default": "Unknown motive"
};

function getSetpointMotive(setpointMotive){
    return setpointMotives[setpointMotive] || setpointMotives['default'];
}

return Ractive.extend(ractiveData);

}