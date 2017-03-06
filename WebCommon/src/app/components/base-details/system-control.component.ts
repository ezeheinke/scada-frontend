import Ractive from 'ractive';

import { NotificationsComponent } from './notifications.component';

import { LoginService } from '../../services/login.service';
import { StateContainerService } from '../../services/state-container.service';

const loginService = LoginService();
const stateContainer = StateContainerService();

export function SystemControlComponent() {             
    
    let ractive: IRactive = undefined;
    
    const notifications = NotificationsComponent();      
    
    const ractiveData = {
        el: undefined,
        template: `
            <div id="notifications" class="system-control-icon-wrapper"></div>`+
            `<div id="logout-wrapper" class="system-control-icon-wrapper">
                <button class="system-control-icon" on-click="logout">
                    <span class="icon dripicons-exit" title="Logout" aria-hidden="true"></span>
                </button>
            </div>
            <div id="user-name-wrapper" class="system-control-icon-wrapper">
                <span class="hidden-xs username-text">{{fullname}}</span>
            </div>
        `,
        data: {
            fullname: undefined
        }
    };

    let unsubscribe = undefined;
    
    function init(elem) {
        console.log("<system-control>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        ractive.on("logout", () => loginService.logout());
        notifications.init('#notifications');                 
        unsubscribe = stateContainer.subscribe('user.fullname', (fullname) => ractive.set({fullname}) );
        console.log("</system-control>");
    }
    
    function clean() {
        unsubscribe();
        notifications.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}