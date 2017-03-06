import Ractive from 'ractive';

import { ResourcesService } from '../../services/resources.service';

export function AssetsAvailabilityComponent() {
    
    let ractive: IRactive = undefined;

    const resources = ResourcesService();
    
    const ractiveData = {
        el: undefined,
        template: `
            <div class="summary-item half-width">
                <div class="title-small">
                    Assets
                </div>
                <div class="data-number">
                    {{availables !== undefined ? availables : '_'}}<span class="small-text"> / {{amount}}</span>
                </div>
            </div>
            <div class="summary-item half-width">
                <div class="text-small">
                    <div>Available: <span class="detail-number success">{{availabilities.available !== undefined ? availabilities.available : '_'}}</span></div>
                    <div>On Regulation: <span class="detail-number warning">{{availabilities.regulation !== undefined ? availabilities.regulation : '_'}}</span></div>
                    <div>Disconnected: <span class="detail-number no-connection">{{availabilities.disconnected !== undefined ? availabilities.disconnected : '_'}}</span></div>
                </div>
            </div>
        `,
        data: {
            availables: undefined,
            amount: undefined,
            availabilities: {}
        }
    };

    const assetAvailabilities = {
        "available": "Available",
        "regulation": "On Regulation",
        "disconnected": "Disconnected"
    }; 

    let unsubscribes = undefined;
    
    function init(elem) {
        console.log("<assets-availability>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        unsubscribes = [
            resources.subscribeSignalsToAssets(["Availability"]),            
            resources.subscribeToAssets(assets => {                
                ractive.set('amount', assets.length);
                const availabilities = getAvailabilities(assets);
                const availables = availabilities['available'];  
                ractive.set('availables', availables);
                ractive.set('availabilities', availabilities);                
            })
        ];

        console.log("</assets-availability>");
    }

    function getAvailabilities(assets) {
        const availabilities = {};        

        Object.keys(assetAvailabilities)
        .forEach(availability => {
            const amountAvailability = assets
            .filter(function(asset){                 
                return asset.signals['Availability'] ? 
                            asset.signals['Availability'].Value === availability:
                            false;
            }).length;
            availabilities[availability] = amountAvailability;
        });

        return availabilities;
    }

    function clean() {        
        unsubscribes.forEach(unsubscribe => unsubscribe());
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}