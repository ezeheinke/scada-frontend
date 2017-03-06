import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';

export function RoleSelectorComponent() {                 
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    
    const ractiveData = {
        el: '#role-selector',
        template: `
            <div id="role-select-wrapper">
                <select id="role-select" value='{{role}}' on-change="changeRole:{{role}}">
                    {{#roles}}
                    <option value='{{id}}'>{{name}}</option>
                    {{/roles}}
                </select>
                <span class="caret"></span>
            </div>
        `,
        data: {
            role: undefined,
            roles: []
        }
    };

    let unsubscribe = undefined;
    
    function init(elem) {
        console.log("<role-selector>");
        ractiveData.el = elem;        
                
        const role = stateContainer.read("role");
        const roles = stateContainer.read("user.roles");         
        const rolesCollection = getRoleCollection(roles);
        ractiveData.data = {
            role,
            roles: rolesCollection
        };

        ractive = new Ractive(ractiveData);

        ractive.on("changeRole", function(event, role){
            const viewId = stateContainer.read("view");
            const viewPage = stateContainer.read("viewPage");

            const view = stateContainer.Static.Data.views[viewId];
            const page = view.pages[role].find(page => page.id===viewPage);

            if (page === undefined) {
                const firstRolePage = view.pages[role][0];
                if (firstRolePage === undefined) {
                    //there is no page configurated.. lets try with the root level..
                    gotoTopLevel(role);

                }else 
                    location.assign('#/'+firstRolePage.id); // route-manager.service will capture this event
            }

            stateContainer.change("role", role);
        });

        unsubscribe = stateContainer.subscribe('role', function(role) {
            ractive.set('role', role); 
        });
                
        console.log("</role-selector>");
    }

    function gotoTopLevel(role) {
        //there is no page configurated.. lets try with the root level..
        var lastChance = stateContainer.Static.Data.views[stateContainer.Static.Data.rootView].pages[role][0];
        if (lastChance !== undefined) {
            stateContainer.change("viewLevel", "CCR");
            location.assign('#/'+lastChance.id);
        }
    }
    
    function getRoleCollection(roles){
        const roleNameMap = {
            "admin": "Admin",
            "maintainer": "Maintenance",
            "operator": "Operation",
            "owner": "Finances"
        };
        const rolesCollection = roles.map(roleId => {        
            return {
                id: roleId,
                name: roleNameMap[roleId] || "undefined role"
            }; 
        });
        return rolesCollection;
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