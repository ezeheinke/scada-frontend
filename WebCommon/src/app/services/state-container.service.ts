let data = {    
    "role": null,    
    "viewLevel": null,
    "view": null,
    "viewPage": null,
    "user.fullname": null,
    "user.roles": null,    
    "user.token": null,
    "user.logged": null,
    "user.accesses": null,
    "window": "dashboard",
    "budgetFilters.assets":null,
    "budgetFilters.date":null
}
let subscriptions = {}; // same structure as data, fill in init()

let Static = {
    Data: undefined
};

export function StateContainerService() {
    function init() {
        console.log("<state-container>");
        Object.keys(data).forEach(key => subscriptions[key] = []); // initialize subscriptions array        
        console.log(data);             // TODO: this is debug
        console.log("</state-container>");
    }
    
    function subscribe(state, callback, noFirstCall?){
        if (data[state] === undefined) {
            console.error("ERROR:: trying to subscribe to an undefined state");
            return () => {};
        }
        subscriptions[state].push(callback);
        function unsubscribe() {
            subscriptions[state] = subscriptions[state].filter((_callback) => _callback !== callback);
        }
        // notify first time
        if (!noFirstCall) callback( data[state] ); 
        return unsubscribe;
    }
    
    function change(state, newValue) {
        if (data[state] === undefined) console.error(`ERROR:: trying to change undefined state ${state}`); 
        else if (data[state] !== newValue) {            
            data[state] = newValue;
            console.info(`state ${state} changed, subscriptors: ${subscriptions[state].length}`);
            console.log(data); // TODO: this is debug            
            subscriptions[state].forEach(callback => {
                callback(newValue);
            });                        
        }
    }
    
    function read(state){
        if (!data[state]) console.warn(`WARNING:: reading undefined state ${state}`);
        return data[state];
    }

    function initialized(state){
        return data[state] === null;
    }
    
    function write(state, newValue){
        // if (!data[state]) console.warn(`WARNING:: writing undefined state ${state}`);
        data[state] = newValue;
    }
    
    return {
        init,
        subscribe,
        change,
        read,
        initialized,
        write,
        Static
    }
    
}