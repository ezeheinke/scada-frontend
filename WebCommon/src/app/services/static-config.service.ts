import { StateContainerService } from './state-container.service';

export function StaticConfigService() {
    
    const stateContainer = StateContainerService();
    
    function init() {
        console.log("<static-config>");
        
        let appModel;

        return fetch('/data/app-model.json')
        .then(response => response.json())
        .then(response => {
            appModel = response;
            return fetch('/data/app-config.json'); 
        })        
        .then(response => response.json())
        .then(staticData => {
            console.log("Static config:");
            console.log(staticData);

            staticData.nodes = appModel.nodes;
            staticData.sets = appModel.sets;
            staticData.assets = appModel.assets;
            staticData.devices = appModel.devices;
            staticData.uProgs = appModel.uProgs;
            
            staticData.assets.forEach(asset => {
                let assetConfig = staticData.views[asset.id];
                if (assetConfig === 'default') {
                    staticData.views[asset.id] = Object.assign({}, staticData.defaultView);
                    assetConfig = staticData.views[asset.id];
                    assetConfig.id = asset.id;
                    assetConfig.name = asset.name;
                }

                asset['config'] = assetConfig;
            });            
            
            const view = staticData.rootView;
            const viewLevel = staticData.views[view].viewLevel;            
            
            stateContainer.change("view", view);
            stateContainer.change("viewLevel", viewLevel);

            stateContainer.Static.Data = staticData;            

            console.log("</static-config>");
            return staticData;                
        });
    }
    
    return {
        init        
    }
    
}