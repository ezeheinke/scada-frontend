import 'whatwg-fetch';

import { CompactScadaService } from './compact-scada.service';
import { ResourcesService } from './resources.service';
import { EventCheckerService } from './event-checker.service';
// import { EventsHistoryService } from './events-history.service';
import { StateContainerService } from './state-container.service';
import { UserAccessesService } from './user-accesses.service';

import * as fmt from "myers";

let unsubscribe = undefined;

const resources = ResourcesService();
const compactScada = CompactScadaService();
const eventChecker = EventCheckerService();
// const eventsHistory = EventsHistoryService();
const stateContainer = StateContainerService();
const permissions = UserAccessesService();

export function LoginService() {
    
    
    function init() {
        console.log("<login>");

        const logged = localStorage.getItem('logged');
        if (logged) {            
            const user = JSON.parse( localStorage.getItem('user') );
            setLogin(user);
        }        

        console.log("</login>");
    }

    function login(username, password){
        const serverPath = stateContainer.Static.Data.serverPath;
        const encryptedPassword = fmt.default(password);
        return fetch(serverPath+'/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                username,
                password: encryptedPassword
            })
        });                      
    }

    function setLogin(user){ // roles = ["maintainer", "operator", "owner"];    
        // rename accesses to roles        
        if (user.accesses instanceof Array) {
            user.accesses = processAccesses(user.accesses);
            user.roles =  user.accesses.roles;            
        }
        // get the role
        let role = localStorage.getItem('role');
        role = role ? role : user.roles[0];
        // save to localStorage
        localStorage.setItem('user', JSON.stringify(user) );
        localStorage.setItem('logged', 'true');
        // save to stateContainer
        stateContainer.write('user', user);
        stateContainer.write('user.fullname', user.fullname);
        stateContainer.write("user.roles", user.roles);
        stateContainer.write("user.accesses", user.accesses);
        stateContainer.write('user.token', user.token);
        resources.init().then(() => {
            compactScada.init();
            eventChecker.init();
            // eventsHistory.init();
            initializeStateContainer(user, role);
        });
    }

    function processAccesses(accessesString){        
        const accesses = {
            assets: ['ALL'],
            pages: ['ALL'],
        };
        accessesString
        .forEach(accessString => {
            const accessParts = accessString.split('(');
            const access = accessParts[0];            
            const value = accessParts[1] !== undefined ? accessParts[1].slice(0, -1).replace(/ /g ,'').split(',') : ['ALL'];            
            accesses[access] = value;
        });        
        return accesses;
    }

    function initializeStateContainer(user, role) {        
        stateContainer.change("role", role);

        const views = stateContainer.Static.Data.views; 
        Object.keys(views)
        .forEach(viewId => {
            const view = views[viewId];
            const pages = view.pages;
            Object.keys(pages)
            .forEach(role => {
                const rolePages = pages[role] ? pages[role] : [];
                const rolePagesFiltered = rolePages.filter(page => permissions.blockAccess('blockPages', page.id)===false);
                pages[role] = rolePagesFiltered;
            });
        });

        if (stateContainer.initialized('viewPage')) {
            const viewId = stateContainer.read('view');            
            const view = stateContainer.Static.Data.views[viewId];
            
            const viewPage = view.pages[role][0].id;
            // stateContainer.change('viewPage', viewPage);
            location.assign('#/'+viewPage);
        }
        
        unsubscribe = stateContainer.subscribe('role', role => localStorage.setItem('role', role));

        stateContainer.change("user.logged", true);
    }
    
    function logout(){        
        unsubscribe();        
        localStorage.removeItem('user');
        localStorage.removeItem('logged');
        stateContainer.change("user.logged", false);
        resources.clean();
        eventChecker.clean();
        // eventsHistory.clean();
        compactScada.clean();
    }
    
    return {
        init,
        login,
        setLogin,
        logout
    }
    
}