import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';
import { CompactScadaService } from '../../services/compact-scada.service';
import { DeviceModelService } from '../../services/device-model.service';
import { ResourcesService } from '../../services/resources.service';

export function DevicesAvailabilityComponent() {
    
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    const compactScada = CompactScadaService();
    const deviceModel = DeviceModelService();
    const resources = ResourcesService();
    const ractiveData = {
        el: undefined,
        template: `
            {{#availabilities}}
            <div class="summary-item half-width">
                <div class="title-small">
                    Devices
                </div>
                <div class="data-number">
                    {{available !== undefined ? available : '_'}}<span class="small-text"> / {{amount}}</span>
                </div>
            </div>
            <div class="summary-item half-width">
                <div class="text-small">
                    Available: <span class="detail-number success">{{available !== undefined ? available : '_'}}</span>
                    <br>
                    Stopped: <span class="detail-number danger">{{stopped !== undefined ? stopped : '_'}}</span>
                    <br>
                    Maintenance: <span class="detail-number warning">{{maintenance !== undefined ? maintenance : '_'}}</span>
                    <br>
                    Error: <span class="detail-number error">{{error !== undefined ? error : '_'}}</span>
                    <br>
                    Disconnected: <span class="detail-number no-connection">{{disconnected !== undefined ? disconnected : '_'}}</span>
                </div>
            </div>
            {{/availabilities}}
            <div id="devices-availability-chart">
            </div>            
        `,
        data: {
            availabilities: {},
            amount: undefined
        }
    };

    let unsubcribe = undefined;
    
    function init(elem) {
        console.log("<devices-availability>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        const assetId = stateContainer.read('view');
        const asset = stateContainer.Static.Data.views[assetId];
        const deviceModels = asset.servicesData.deviceModel.models;
        //let devs = resources.getDevices().filter(device => device.asset == assetId);

        const subscribePattern = `^${assetId}\.(${deviceModels.join('|')})`; // ^PARK_Somewhere.(Gamesa|Eco)

        unsubcribe = compactScada.subscribe(subscribePattern, function(signals: Signal[]) {            
            //const devices = compactScada.groupDevices(signals, devs.hierarchy);
            //ractive.set('amount', devices.length);
            
            //const availabilities = getAvailabilities(devices);
            //ractive.set('availabilities', availabilities);
        });

        console.log("</devices-availability>");
    }

    function getAvailabilities(devices: Device[]) {
        const availabilities = {};
        const enumAvailabilities = ["available", "stopped", "maintenance", "error", "disconnected"];

        enumAvailabilities.forEach(availability => {
            const amountAvailability = devices
            .filter(function(device){                 
                return deviceModel.models[device.model].getAvailability(device.signals) === availability;
            }).length;
            availabilities[availability] = amountAvailability;
        });

        return availabilities;
    }

    function clean() {
        unsubcribe();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}