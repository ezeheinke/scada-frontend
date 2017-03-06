import * as Director from 'director'; // use Director.Router(routes) instead of Router(routes)

import { StateContainerService } from './state-container.service';

export function RouteManagerService() {
    
    const stateContainer = StateContainerService();
    
    let rootView = undefined;
    
    function init() {
        console.log("<route-manager>");
        rootView = stateContainer.Static.Data.rootView;
        const routes = {            
            '/:section1': routeManager, 
            '/:section1/:section1': routeManager,
            '/:section1/:section1/:section3': routeManager
        };
        var router = Director.Router(routes);
        router.init();
        console.log("</route-manager>");
    }
    
    function routeManager(...route) {
        if (rootView === 'CCR') {
            ccrRouting(route);
        }
        else{
            assetRouting(route);
        }            
    };
    
    function ccrRouting(route){    
        const page = route[0]; 
        const assetView = route[1];
        if (page !== "assets" || page === "assets" && assetView === undefined){ // routing inside CCR
            stateContainer.change("viewLevel", "CCR");
            stateContainer.change("view", "CCR");
            stateContainer.change("viewPage", page);
        }
        else {                                             // routing inside assets/PARK_something/info            
            const assetViewPage = route[2];                    
            stateContainer.change("viewLevel", "ASSET");
            stateContainer.change("view", assetView);            
            const assetConfig = stateContainer.Static.Data.views[assetView];
            const role = localStorage.getItem('role');
            const firstPage = assetConfig.pages[role][0]; //  TODO: role should come from stateContainer
            stateContainer.change("viewPage", assetViewPage ? assetViewPage : firstPage.id);
        }
    }
    
    function assetRouting(route){
        const page = route[0];              
        if (page !== "wtgs"){                              // routing inside asset
            stateContainer.change("viewLevel", "ASSET");
            stateContainer.change("view", rootView);
            stateContainer.change("viewPage", page);                        
        }
    }      
    
    return {
        init
    }
    
}