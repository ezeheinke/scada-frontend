declare var System: any;

import { StateContainerService } from './state-container.service';

let models: {[modelId: string]: DeviceModel} = {};

export function DeviceModelService() {
    
    const stateContainer = StateContainerService();
    
    function init() {
        console.log("<device-model>");

        const views = stateContainer.Static.Data.views;
        let deviceModelsMap = {};

        Object.keys(views).forEach(viewId => { // collect in array deviceModels all the different types of models of each device
            const view = views[viewId];
            if (view.viewLevel === 'ASSET') {
                view.servicesData.deviceModel.models.forEach(deviceModel => deviceModelsMap[deviceModel] = true);
            }
        });

        const deviceModels = Object.keys(deviceModelsMap);

        const promise = new Promise(resolve => { // Load every model founded from /data/device-models/
            let modelsResolved = 0;            
            deviceModels.forEach(modelId => {
                System.import(`/data/device-models/${modelId}.js`)
                .then(model => {
                    models[modelId] = model;
                    modelsResolved++;
                    if (modelsResolved === deviceModels.length) {
                        console.log("</device-model>");
                        resolve();
                    }
                })
                .catch(error => {            
                    console.error(`Model ${modelId} not found:: ${JSON.stringify(error)}`);
                });
            });
        });                     
        return promise;
    }
    
    return {
        init,
        models
    }
    
}