import { StateContainerService } from './state-container.service';
import { CompactScadaService } from './compact-scada.service';
import { UserAccessesService } from './user-accesses.service';

const stateContainer = StateContainerService();
const compactScada = CompactScadaService();
const permissions = UserAccessesService();

const resources = {
    nodes: [],
    sets: [],
    assets: [],
    devices: [],
    uProgs: []
};

let assetsSubscriptions = {};
let devicesSubscriptions = {};
let uProgSubscriptions = {};
let uProgAssetSubscriptions = {};
let unsubscribeAssets = undefined;
let unsubscribeDevices = undefined;
let unsubscribeUProgs = undefined;
let unsubscribeUProgsAsset = undefined;
let assetsCallbackSubscriptions = [];
let devicesCallbackSubscriptions = [];
let uProgCallbackSubscriptions = [];
let uProgsAssetCallbackSubscriptions = [];

export function ResourcesService() {
    
    function init() {
        console.log("<resources>");
        
        let nodes = []; // stateContainer.Static.Data.nodes;
        let sets = []; // stateContainer.Static.Data.sets;
        let assets = []; // stateContainer.Static.Data.assets;
        let devices = []; // stateContainer.Static.Data.devices;
        let uProgs = []; // stateContainer.Static.Data.uProgs;

        const views = stateContainer.Static.Data.views;

        if(stateContainer.Static.Data.devices){
            devices = stateContainer.Static.Data.devices
            .filter(device => {
                if (permissions.hasAccess('assets', device.id)){
                    device['signals'] = {};
                    return true;
                }
                return false;
            });
        }
        
        if(stateContainer.Static.Data.uProgs){
            uProgs = stateContainer.Static.Data.uProgs
            .filter(uProg => {
                if (permissions.hasAccess('assets', uProg.id)){
                    uProg['signals'] = {};
                    uProg.uProgAssets.forEach(function(asset){
                        asset['signals'] = {};
                    });
                    return true;
                }
                return false;
            });
        }

        assets = stateContainer.Static.Data.assets
        .filter(asset => {
            if (permissions.hasAccess('assets', asset.id)){
                asset['configured'] = views[asset.id] !== undefined;
                asset['signals'] = {};
                return true;
            }
            return false;
        });

        sets = stateContainer.Static.Data.sets
        .filter(set => {            
            const assetsFilters = set.assetIds
            .filter(assetId => {
                const asset = getObject(assets, assetId); 
                return asset !== undefined;
            });
            const hasAccess = assetsFilters.length > 0;
            return hasAccess;
        })
        .map(set => {
            set.assets = [];
            set.assetIds
            .forEach(assetId => {
                const asset = getObject(assets, assetId);                
                if (asset) set.assets.push(asset);  
            }); 
            return set;
        });

        nodes = stateContainer.Static.Data.nodes
        .filter(node => {            
            const setsFilters = node.setIds
            .filter(setId => {
                const set = getObject(sets, setId); 
                return set !== undefined;
            });
            const hasAccess = setsFilters.length > 0;
            return hasAccess;
        })
        .map(node => {
            node.sets = [];
            node.setIds
            .forEach(setId => {
                const set = getObject(sets, setId);                
                if (set) node.sets.push(set);  
            }); 
            return node;
        });

        resources.nodes = nodes;
        resources.sets = sets;
        resources.assets = assets;
        resources.devices = devices;
        resources.uProgs = uProgs;

        console.log("</resources>");

        return getNominalPowers();
    }

    function getNominalPowers() {
        return compactScada
        .getSignals('^(PARK|SOLAR|HYDRO)_.*\\.NominalPower$')
        .then(signals => {
            const assetsSignals = compactScada.groupAssets(signals);
            resources.assets            
            .forEach(asset => {
                const assetSignals = getObject(assetsSignals, asset.id);
                if (assetSignals) {
                    const nominalPowerSignal = assetSignals.signals['NominalPower'];
                    asset['nominalPower'] = nominalPowerSignal ? nominalPowerSignal.Value : undefined; 
                }
            });
        });
    }

    function updateScadaSubscription(){        
        const signals = Object.keys(assetsSubscriptions)
        .filter(subscription => assetsSubscriptions[subscription] > 0);

        if (signals.length > 0) {
            subscribePetition(signals);
        }
        else {
            cleanPetitions();
        }
    }

    function updateScadaDeviceSubscription(assetId: string, deviceType:string){        
        const signals = Object.keys(devicesSubscriptions)
        .filter(subscription => devicesSubscriptions[subscription] > 0);

        if (signals.length > 0) {
            subscribeDevicePetition(signals, assetId, deviceType);
        }
        else {
            cleanPetitions();
        }
    }

    function updateScadaUProgSubscription(){        
        const signalsUProg = Object.keys(uProgSubscriptions)
        .filter(subscription => uProgSubscriptions[subscription] > 0);

        if (signalsUProg.length > 0) {
            subscribeUProgsPetition(signalsUProg);
        }
        else {
            cleanPetitions();
        }
    }
    
    function updateScadaUProgAssetSubscription(){        
        const signalsUProgAsset = Object.keys(uProgAssetSubscriptions)
        .filter(subscription => uProgAssetSubscriptions[subscription] > 0);

        if (signalsUProgAsset.length > 0) {
            subscribeUProgsAssetPetition(signalsUProgAsset);
        }
        else {
            cleanPetitions();
        }
    }

    function subscribePetition(signalNames){
        if (unsubscribeAssets) unsubscribeAssets();

        const realSignals = replaceFakeSignals(signalNames);        
        let subscribePattern = [];

        if (realSignals.ccr.length > 0) subscribePattern.push(`^CCR\\.(${realSignals.ccr.join('|')})$`);
        const assetsPrefix = permissions.hasAccess('assets') ? 'PARK_|SOLAR_|HYDRO_' : permissions.getAccesses('assets').join('|');
        if (realSignals.park.length > 0) subscribePattern.push(`^(${assetsPrefix}).*\\.(${realSignals.park.join('|')})$`);        
        
        unsubscribeAssets = compactScada
        .subscribe(subscribePattern.join('|'), function(signals){                        
            let assetsSignals = compactScada.groupAssets(signals);
            assetsSignals = processFakeSignals(realSignals.fake, assetsSignals);            
            resources.assets
            .forEach(asset => {
                const assetSignals = getObject(assetsSignals, asset.id);
                if (assetSignals && assetSignals.signals){
                    Object.assign(asset['signals'], assetSignals.signals);
                }
            });
            assetsCallbackSubscriptions.forEach(callback => callback(resources.assets));
        });
    }

    function subscribeDevicePetition(signalNames, assetId: string, deviceType: string){
        if (unsubscribeDevices) unsubscribeDevices();

        const realSignals = signalNames;        
        let subscribePattern = [];

        const assetsPrefix = permissions.hasAccess('assets') ? assetId : permissions.getAccesses('assets').join('|');
        if (realSignals.length > 0) subscribePattern.push(`^(${assetsPrefix})\.*(${deviceType})\.\\d+\.(${realSignals.join('|')})$`);
                  
        
        unsubscribeDevices = compactScada
        .subscribe(subscribePattern.join('|'), function(signals){                        
            let devicesSignals = undefined;
            let devices = resources.devices.filter(device => device.asset == assetId);
            devices.forEach(device => {      
                let devices = eval('device.' + deviceType);
                if(devices.hierarchy){
                    let elements = devices.elements;
                    devicesSignals= compactScada.groupDevices(signals, devices.hierarchy);   
                    devicesSignals.forEach(dev => {
                        let id1 = dev.id.split('.')[0];
                        let id2 = dev.id.split('.')[1];

                        let element = elements.filter(e => e.id === id1);
                        element.forEach(e => {
                            let child = e.children.filter(child => child.id == id2);
                            if(child[0] != undefined){
                                child[0]['signals'] = {};
                                Object.assign( child[0]['signals'], dev.signals);
                            }
                    })});
                }else{
                    devicesSignals= compactScada.groupDevices(signals, devices.hierarchy);
                    devices.elements.forEach(e => e.children.
                        forEach(child => {
                            const deviceSignals = getObject(devicesSignals, child.id);
                            if (deviceSignals && deviceSignals.signals){
                                child['signals'] = {};
                                Object.assign( child['signals'], deviceSignals.signals);
                            }
                        }));
                }
            });
            devicesCallbackSubscriptions.forEach(callback => callback(resources.devices));
        });
        
    }

    function subscribeUProgsPetition(signalNames){
        if (unsubscribeUProgs) unsubscribeUProgs();

        const realSignals = signalNames;        
        let subscribePattern = [];

        const uprogPrefix = permissions.hasAccess('assets') ? 'UPROG_' : permissions.getAccesses('assets').join('|');
         if (realSignals.length > 0) subscribePattern.push(`^(${uprogPrefix}).*\\.(${realSignals.join('|')})$`);

        unsubscribeUProgs = compactScada
        .subscribe(subscribePattern.join('|'), function(signalsUProg){
            let uProgsignals = compactScada.groupUProgs(signalsUProg);
            resources.uProgs
            .forEach(uProg => {
                let uProgSignals = getObject(uProgsignals, uProg.uProgId);
                if (uProgSignals && uProgSignals.signals){
                    Object.assign(uProg['signals'], uProgSignals.signals);
                }               
            });
            uProgCallbackSubscriptions.forEach(callback => callback(resources.uProgs));
        });
    }
    
    function subscribeUProgsAssetPetition(signalNames){
        if (unsubscribeUProgsAsset) unsubscribeUProgsAsset();

        const realSignals = signalNames;        
        let subscribePattern = [];

        const assetsPrefix = permissions.hasAccess('assets') ? 'PARK_|SOLAR_|HYDRO_' : permissions.getAccesses('assets').join('|');
         if (realSignals.length > 0) subscribePattern.push(`^(${assetsPrefix}).*\\.(${realSignals.join('|')})$`);

        unsubscribeUProgsAsset = compactScada
        .subscribe(subscribePattern.join('|'), function(signalsUProgAsset){
            let uProgsignals = compactScada.groupAssets(signalsUProgAsset);
            resources.uProgs
            .forEach(uProg => {
                uProg.uProgAssets.forEach(uProgAsset =>{
                    let uProgAssetSignals = getObject(uProgsignals, uProgAsset.id);
                    if (uProgAssetSignals && uProgAssetSignals.signals){
                        Object.assign(uProgAsset['signals'], uProgAssetSignals.signals);
                    }
                })                
            });
            uProgsAssetCallbackSubscriptions.forEach(callback => callback(resources.uProgs));
        });
    }


    function replaceFakeSignals(signals: string[]) {
        let signalsCopy = signals.slice(0);
        let ccrSignals = [];
        let parkSignals = [];
        let fakeSignals = [];
        let index;

        index = signalsCopy.indexOf("SetpointReceived");
        if (index !== -1) {
            fakeSignals.push( signalsCopy.splice(index, 1)[0] );
            ccrSignals = addUnique(ccrSignals, "RoleApplied");
            parkSignals = addUnique(parkSignals, "CECOELSetpointReceived", "CECORESetpointReceived");
        }
        
        index = signalsCopy.indexOf("SetpointMotive");
        if (index !== -1) {
            fakeSignals.push( signalsCopy.splice(index, 1)[0] );
            ccrSignals = addUnique(ccrSignals, "RoleApplied");
            parkSignals = addUnique(parkSignals, "CECOELSetpointMotive", "CECORESetpointMotive");
        }

        index = signalsCopy.indexOf("Availability");
        if (index !== -1) {
            fakeSignals.push( signalsCopy.splice(index, 1)[0] );
            fakeSignals = addUnique(fakeSignals, "SetpointMotive");
            ccrSignals = addUnique(ccrSignals, "RoleApplied");
            parkSignals = addUnique(parkSignals, "Active", "CECOELSetpointMotive", "CECORESetpointMotive");
        }

        parkSignals = parkSignals.concat(signalsCopy);
        return {ccr: ccrSignals, park: parkSignals, fake: fakeSignals};
    }

    function processFakeSignals(fakeSignals, resourcesSignals){
        if (fakeSignals.length === 0) return resourcesSignals;

        const ccr = resourcesSignals.filter(assetSignals => assetSignals.id === 'CCR')[0];
        const assets = resourcesSignals.filter(assetSignals => assetSignals.id !== 'CCR');

        let roleApplied = ccr && ccr.signals && ccr.signals['RoleApplied'] ? ccr.signals['RoleApplied'].Value : undefined;
        const setpointOrigin = roleApplied === 1 ? 'CECORE' : 'CECOEL';

        if (fakeSignals.indexOf("SetpointReceived") !== -1) {
            assets
            .forEach(asset => {                
                asset.signals['SetpointReceived'] = asset.signals[setpointOrigin+'SetpointReceived'];
                asset.signals['SetpointReceived'].fakeSignal = true;
            });
        }

        if (fakeSignals.indexOf("SetpointMotive") !== -1) {
            assets
            .forEach(asset => {
                asset.signals['SetpointMotive'] = asset.signals[setpointOrigin+'SetpointMotive'];
                asset.signals['SetpointMotive'].fakeSignal = true;
            });
        }

        if (fakeSignals.indexOf("Availability") !== -1) {            
            assets
            .forEach(asset => {                
                asset.signals['Availability'] = {
                    Name: asset.id+'.Availability',
                    Value: getAssetAvailability(asset.signals),
                    Quality:   asset.signals['Active'] ? asset.signals['Active'].Quality   : undefined,
                    Timestamp: asset.signals['Active'] ? asset.signals['Active'].Timestamp : undefined,
                    fakeSignal: true
                };
            });
        }        

        return assets;
    }

    function addUnique(array, ...elems){
        elems.forEach(elem => {
            const index = array.indexOf(elem);
            if (index === -1) {
                array.push(elem);
            }
        });
        return array;
    }

    function cleanPetitions(){
        resources.assets.forEach(asset => asset['signals'] = {});
        assetsCallbackSubscriptions.forEach(callback => callback(resources.assets));

        resources.devices.forEach(device => device['signals'] = {});
        devicesCallbackSubscriptions.forEach(callback => callback(resources.devices));

        resources.uProgs.forEach(uProg => uProg['signals'] = {});
        uProgCallbackSubscriptions.forEach(callback => callback(resources.uProgs));

        resources.uProgs.forEach(uProg => 
            uProg.uProgAssets.forEach(function(asset){
                asset['signals'] = {};
            }));
    }
    
    function subscribeSignalsToAssets(signalNames: string[]) {        
        signalNames.forEach(signalName => {
            if (assetsSubscriptions[signalName] === undefined) assetsSubscriptions[signalName] = 0;
            assetsSubscriptions[signalName]++;
        });        
        updateScadaSubscription();
        function unsubscribe(){
            signalNames.forEach(signalName => assetsSubscriptions[signalName]--);
            updateScadaSubscription();
        }        
        return unsubscribe;
    }

    function subscribeSignalsToDevices(signalNames: string[], assetId: string, deviceType: string) {        
        signalNames.forEach(signalName => {
            if (devicesSubscriptions[signalName] === undefined && signalName != undefined) devicesSubscriptions[signalName] = 0;
            if (signalName != undefined) devicesSubscriptions[signalName]++;
        });        
        updateScadaDeviceSubscription(assetId, deviceType);
        function unsubscribe(){
            signalNames.forEach(signalName => devicesSubscriptions[signalName]--);
            updateScadaDeviceSubscription(assetId, deviceType);
        }        
        return unsubscribe;
    }

    function subscribeSignalsToUProgsAsset(signalNames: string[]) {        
        signalNames.forEach(signalName => {
            if (uProgAssetSubscriptions[signalName] === undefined) uProgAssetSubscriptions[signalName] = 0;
            uProgAssetSubscriptions[signalName]++;
        });        
        updateScadaUProgAssetSubscription();
        function unsubscribe(){
            signalNames.forEach(signalName => uProgAssetSubscriptions[signalName]--);
            updateScadaUProgAssetSubscription();
        }        
        return unsubscribe;
    }
    
    function subscribeSignalsToUProgs(signalNames: string[]) {        
        signalNames.forEach(signalName => {
            if (uProgSubscriptions[signalName] === undefined) uProgSubscriptions[signalName] = 0;
            uProgSubscriptions[signalName]++;
        });        
        updateScadaUProgSubscription();
        function unsubscribe(){
            signalNames.forEach(signalName => uProgSubscriptions[signalName]--);
            updateScadaUProgSubscription();
        }        
        return unsubscribe;
    }

    function getAssetAvailability(signals) {
        let availability = "disconnected";
        if (signals && signals.Active && signals.Active.Value === true){
            availability = "available";
            if (signals.SetpointMotive && signals.SetpointMotive.Value > 0) {
                availability = "regulation";
            }
        }
        return availability;
    }    

    function subscribeToAssets(callback) {
        assetsCallbackSubscriptions.push(callback);
        function unsubscribe(){
            assetsCallbackSubscriptions = assetsCallbackSubscriptions.filter(_callback => _callback !== callback);
        }        
        return unsubscribe;
    }     

    function subscribeToDevices(callback) {
        devicesCallbackSubscriptions.push(callback);
        function unsubscribe(){
            devicesCallbackSubscriptions = devicesCallbackSubscriptions.filter(_callback => _callback !== callback);
        }        
        return unsubscribe;
    } 

    function subscribeToUProgsAsset(callback) {
        uProgsAssetCallbackSubscriptions.push(callback);
        function unsubscribe(){
            uProgsAssetCallbackSubscriptions = uProgsAssetCallbackSubscriptions.filter(_callback => _callback !== callback);
        }        
        return unsubscribe;
    }  

    function subscribeToUProgs(callback) {
        uProgCallbackSubscriptions.push(callback);
        function unsubscribe(){
            uProgCallbackSubscriptions = uProgCallbackSubscriptions.filter(_callback => _callback !== callback);
        }        
        return unsubscribe;
    }        

    function getObject(array, id) {
        return array.find(object => object.id === id);
    }

    function getDevice(array, id) {
        return array.find(object => object.id.split('.')[1] === id);
    }

    function getNodes() {
        return resources.nodes;
    }

    function getDevices(asset) {
        let devices = resources.devices.filter( device => asset.id == device.asset);
        return devices;
    }

    function getAssets() {
        return resources.assets;
    }

    function getUProgs() {
        return resources.uProgs;
    }

    function getAsset(assetId) {
        return getObject(resources.assets, assetId);
    }

    function getCurrentAsset(){
        const assetId = stateContainer.read("view");
        return getAsset(assetId);
    }

    function clean() {
        if (unsubscribeAssets) unsubscribeAssets();
        if (unsubscribeDevices) unsubscribeDevices();
        if (unsubscribeUProgsAsset) unsubscribeUProgsAsset();
        if (unsubscribeUProgs) unsubscribeUProgs();
    }
    
    return {
        init,
        getNodes,
        getAssets,
        getAsset,
        getUProgs,
        getDevices,
        getCurrentAsset,
        subscribeSignalsToAssets,
        subscribeSignalsToDevices,
        subscribeSignalsToUProgs,
        subscribeSignalsToUProgsAsset,
        subscribeToAssets,
        subscribeToDevices,
        subscribeToUProgs,
        subscribeToUProgsAsset,
        clean
    }
    
}