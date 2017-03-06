import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';

export function PageTabsComponent() {             
    
    let ractive: IRactive = undefined;
    
    const stateContainer = StateContainerService();
    
    const ractiveData = {
        el: undefined,
        template: `
            <ul class="nav nav-tabs">
                {{#pages}}
                <li role="presentation" class="{{activeUrl===id ? 'active' : ''}}"><a href="#/{{link}}"><i class="{{icon}}"></i><span>{{name}}</span></a></li>
                {{/pages}}
            </ul>
        `,
        data: {
            activeUrl: undefined,
            pages: []
        }
    };
    
    let unsubscribes = [];
    
    let views = [];
    
    function init(elem) {
        console.log("<page-tabs>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        views = stateContainer.Static.Data.views;

        unsubscribes.push(
            stateContainer.subscribe("view", viewId => {
                const role = stateContainer.read("role");
                onChange(viewId, role);
            }),
            stateContainer.subscribe("role", role => {
                const viewId = stateContainer.read("view");
                onChange(viewId, role);
            }, true),
            stateContainer.subscribe("viewPage", viewPage => ractive.set("activeUrl", viewPage))
        );
        
        console.log("</page-tabs>");
    }
    
    function onChange(viewId, role){        
        const view = views[viewId];
        if(view) {                    
            let pages = view.pages[role];
            const viewLevel = view.viewLevel;
            pages.forEach(page =>{
                page['link'] = viewLevel === 'CCR' ? page.id : `assets/${viewId}/${page.id}`;
            });
            ractive.set("pages", pages);            
        }
        else console.error(`ERROR:: View ${viewId} doesn't exist`);
    }
    
    function clean() {
        unsubscribes.forEach(unsubscribe => unsubscribe());
        unsubscribes = [];
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}