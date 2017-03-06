import { StateContainerService } from './state-container.service';

let subscriptions = {};
let cachedPatterns = {};
let interval = undefined;

export function CompactScadaService() {

    const stateContainer = StateContainerService();
    
    function init() {
        console.log("<compact-scada>");
                
        interval = setInterval(function(){ // TODO change timeout for Interval !!
            updateSignals();          
        }, 3000);
        // updateSignals();

        console.log("</compact-scada>");
    }

    function updateSignals(){
        const patterns = Object.keys(subscriptions)
        if (patterns.length > 0) {
            getSignals( patterns.join('|') )
            .then(function(signals: Signal[]) {                
                const signalsByPattern = classifySignalsByPattern(patterns, signals);
                saveCache(signalsByPattern);
                patterns.forEach(pattern => notify(pattern, signalsByPattern[pattern]) );
            });   
        }   
    }

    function saveCache(signalsByPattern){
        Object.keys(signalsByPattern).forEach(pattern => cachedPatterns[pattern] = signalsByPattern[pattern]);
    }
    
    function subscribe(pattern, callback){
        if (!subscriptions[pattern]) 
            subscriptions[pattern] = [];         
        subscriptions[pattern].push(callback);
        function unsubscribe() {
            if (subscriptions[pattern]) {
                subscriptions[pattern] = subscriptions[pattern].filter((_callback) => _callback !== callback);
                if (subscriptions[pattern].length === 0) 
                    delete subscriptions[pattern]; 
            }
        }
        if (cachedPatterns[pattern]) callback( cachedPatterns[pattern] );
        return unsubscribe;
    }
    
    function notify(pattern, signals: Signal[]) {
        if (subscriptions[pattern]){
            subscriptions[pattern].forEach(callback => {
                callback(signals);
            });
        }
    }

    function getSignalsSynch(pattern){        
        const token = stateContainer.read('user.token');
        const serverPath = stateContainer.Static.Data.serverPath;

        var xhr = new XMLHttpRequest();
        
        xhr.open('POST',serverPath+'/api/itemsFromPattern', false);
        
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Token ${token}`);

        xhr.send(pattern);
        if(xhr.statusText == "OK")
            return xhr.response;
        else
            return {};
    }
    
    function getSignals(pattern){        
        const token = stateContainer.read('user.token');
        const serverPath = stateContainer.Static.Data.serverPath;
        return fetch(serverPath+'/api/itemsFromPattern', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: pattern
        })
        .then(response => response.json())
        .then(signals => {
            signals = signals instanceof Array ? signals : []; 
            signals.forEach(signal => signal.Timestamp = new Date(signal.Timestamp));
            return signals;
        });        
    }

    function setSignal(signalName, value){
        const signal = {
            Name: signalName,
            Value: value,
            Quality: 192,
            Timestamp: (new Date()).toISOString()
        };

        const token = stateContainer.read('user.token');
        const serverPath = stateContainer.Static.Data.serverPath;
        return fetch(serverPath+'/api/item', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(signal)
        })
        .then(response => response.json());        
    }
    
    function classifySignalsByPattern(patterns, signals: Signal[]){
        const signalsMap= {};        
        patterns.forEach(pattern => {
            signalsMap[pattern] = getSignalsByPattern(signals, pattern);            
        });                
        return signalsMap;
    }
    
    function getSignalsByPattern(signals: Signal[], pattern){
        var regexp = new RegExp(pattern);
        let signalsByPattern = signals.filter(signal => regexp.test(signal.Name));
        return signalsByPattern;
    }

    function groupDevices(signals: Signal[], hierarchy: string){
        let devicesMap = {};

        signals.forEach(function(signal: Signal) {
            const signalNameParts = signal.Name.split('.');
            const l = signalNameParts.length;
            if(!hierarchy){ // Without hierarchy
                const deviceModel = signalNameParts[l - 3]
                const deviceId = signalNameParts[l - 2];
                const deviceSignal = signalNameParts[l - 1];
                if (devicesMap[deviceId] === undefined) { // create if first signal
                    devicesMap[deviceId] = {
                        'id': deviceId,
                        'model': deviceModel,
                        'signals': {} 
                    };                
                }
                devicesMap[deviceId].signals[deviceSignal] = signal; // add signal
            }else{ // With hierarchy
                const deviceModel = signalNameParts[l - 3]
                const deviceId = signalNameParts[l - 4] +'.'+ signalNameParts[l - 2];
                const deviceSignal = signalNameParts[l - 1];
                if (devicesMap[deviceId] === undefined) { // create if first signal
                    devicesMap[deviceId] = {
                        'id': deviceId,
                        'model': deviceModel,
                        'signals': {} 
                    };                
                }
                devicesMap[deviceId].signals[deviceSignal] = signal; // add signal
            }

        });

        const devices: Device[] = Object.keys(devicesMap).map(deviceId => devicesMap[deviceId]); // convert to array
        return devices;
    }
    
    function groupAssets(signals: Signal[]){
        let assetsMap = {};

        signals.forEach(function(signal: Signal) {
            const signalNameParts = signal.Name.split('.');
            const assetId = signalNameParts[0];
            const assetSignal = signalNameParts[1];
            if (assetsMap[assetId] === undefined) { // create if first signal
                assetsMap[assetId] = {
                    'id': assetId,
                    'signals': {} 
                };                
            }
            assetsMap[assetId].signals[assetSignal] = signal; // add signal
        });

        const assets = Object.keys(assetsMap).map(assetId => assetsMap[assetId]); // convert to array
        return assets;
    }

    function groupUProgs(signals: Signal[]){
        let uprogsMap = {};

        signals.forEach(function(signal: Signal) {
            const signalNameParts = signal.Name.split('.');
            const uprogId = signalNameParts[0];
            const assetSignal = signalNameParts[1];
            if (uprogsMap[uprogId] === undefined) { // create if first signal
                uprogsMap[uprogId] = {
                    'id': uprogId,
                    'signals': {} 
                };                
            }
            uprogsMap[uprogId].signals[assetSignal] = signal; // add signal
        });

        const uprogs = Object.keys(uprogsMap).map(uprogId => uprogsMap[uprogId]); // convert to array
        return uprogs;
    }

    function clean(){
        window.clearInterval(interval);
    }
    
    return {
        init,
        subscribe,
        getSignals,
        getSignalsSynch,
        setSignal,
        groupDevices,
        groupAssets,
        groupUProgs,
        clean
    }
    
}