import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';

const stateContainer = StateContainerService();

export function UsersComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
            <div id="users-main">
                <div id="details">
                    <div id="details-navbar">
                        <div id="page-tabs">
                            <ul class="nav nav-tabs">
                                <li>
                                    <a href="#" id="back-button" on-click="displayDashboard">
                                        <i class="icon dripicons-arrow-thin-left"></i>
                                        <span>Settings</span>
                                    </a>
                                </li>
                                <li role="presentation" class="active"><a href="#"><i class="icon dripicons-user-group"></i><span>Users</span></a></li>
                            </ul>
                        </div>
                    </div>
                    <div id="page-loader">
                        <h1>User Management</h1>
                    </div>
                </div>
            </div>
        `,
        data: {
            username: undefined,
            password: undefined
        }
    };
    
    function init(elem) {
        console.log("<users>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        ractive.on('displayDashboard', function(){
            stateContainer.change('window', 'dashboard');
        });
        console.log("</users>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}