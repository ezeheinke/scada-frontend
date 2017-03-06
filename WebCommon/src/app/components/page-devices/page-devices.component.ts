import Ractive from 'ractive';
declare var $: any;

import { StateContainerService } from '../../services/state-container.service';
import * as utils from '../../utils';
import { ResourcesService } from '../../services/resources.service';

import { DevicesTableComponent } from './devices-table.component';
import { DevicesHeaderComponent } from './devices-header.component';

export function PageComponent() {             
    
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    const resources = ResourcesService();
    
    const devicesTable = DevicesTableComponent();
    
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="devices-container">
                <div id="park-devices-table"/>
            </div>
        `
    };

    let unsubscribe = undefined;
    
    function init(elem,resolve) {
        console.log("<page-devices>");

        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        const asset = resources.getCurrentAsset();
        let tab = $('#page-tabs').find('.active').children().children().last().html();   
        const deviceType = stateContainer.Static.Data.views[asset.id].pages.operator.filter(page => page['name'] == tab)[0].deviceType;
        let currentDevices = stateContainer.Static.Data.devices
            .filter(devices => devices.asset == asset.id)
        devicesTable.init('#park-devices-table', eval('currentDevices[0].'+deviceType+'.elements'), eval('currentDevices[0].'+deviceType+'.signals'), deviceType, asset.id); 
        resolve(devicesTable.loadColumns(eval('currentDevices[0].'+deviceType+'.signals'), asset.id, deviceType)); 
        utils.fixTable('#page-view', '#park-devices-table', 1, 1);   

        $(window).resize(function(){
            utils.fixTable('#page-view', '#'+$('table').parent().attr('id'), 1, 1);
        });  
        console.log("</page-devices>");
    }
    
    
    function clean() {
        devicesTable.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}