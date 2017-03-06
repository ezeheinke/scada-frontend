import Ractive from 'ractive';

import { LoginComponent } from './app/components/base/login.component';
import { DashboardComponent } from './app/components/base/dashboard.component';
import { UsersComponent } from './app/components/base/users.component';

import { StateContainerService } from './app/services/state-container.service';
import { StaticConfigService } from './app/services/static-config.service';
import { RouteManagerService } from './app/services/route-manager.service';
import { LoginService } from './app/services/login.service';
import { DeviceModelService } from './app/services/device-model.service';
import { ModalWindowService } from './app/services/modal-window.service';

export function AppComponent() {
             
    let ractive = undefined;
        
    const stateContainer = StateContainerService();
    const staticConfig = StaticConfigService();
    const routeManager = RouteManagerService();
    const loginService = LoginService();
    const deviceModel = DeviceModelService();
    const modalWindow = ModalWindowService();

    const ractiveData = {
        el: undefined,
        template: `            
            <div id="main-view" class="theme-{{role}}">MAIN VIEW...</div>
        `,
        data: {
            role: undefined
        }
    };        
    
    function init(elem) {        
        console.log("<app>");
        console.log("------------> Init Services");
        stateContainer.init();
        staticConfig.init()
        .then(() => {            
            routeManager.init();
            loginService.init();
            deviceModel.init();
            modalWindow.init();
            loadComponents(elem);
        });
    }

    function loadComponents(elem) {
        console.log("------------> Init Components");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        stateContainer.subscribe("role", role => ractive.set("role", role));
        let mainView = undefined;
        stateContainer.subscribe("user.logged", function(logged){
            if (mainView) mainView.clean();
            mainView = logged ? DashboardComponent() : LoginComponent();
            mainView.init('#main-view');
        });
        stateContainer.subscribe("window", function(window){
            if (mainView) mainView.clean();
            const windows = {
                'dashboard': DashboardComponent(),
                'users': UsersComponent()
            };
            mainView = windows[window] || DashboardComponent();
            mainView.init('#main-view');
        }, true);

        console.log("</app>");
        window.document.getElementById("load-icon-container").classList.toggle("load-icon"); 
        
        console.log("------------> Finish App Loading"); 
    }

    
    
    return {
        init
    };
}