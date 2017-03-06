import Ractive from 'ractive';
declare var System: any;

import { ErrorMessageComponent } from '../base/error-message.component';

import { StateContainerService } from '../../services/state-container.service';
 
export function SummaryLoaderComponent() {                 
    let ractive: IRactive = undefined;
    
    const stateContainer = StateContainerService();
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div id="summary-view"></div>
        `
    };
    const summaryViewElem = '#summary-view';
    
    let currentSummary = undefined;
    let unsubscribes = [];
    
    function init(elem) {
        console.log("<summary-loader>");
        ractiveData.el = elem;        
        ractive = new Ractive(ractiveData);
                
        unsubscribes.push(            
            stateContainer.subscribe("view", function(view){
                const role = stateContainer.read("role");
                onChange(view, role);
            }),
            stateContainer.subscribe("role", function(role){
                const view = stateContainer.read("view");
                onChange(view, role);
            }, true)
        );
        
        console.log("</summary-loader>");
    }
    
    function onChange(view, role){        
        const viewLevel = stateContainer.read("viewLevel");
        const summaryFile = `summary-${viewLevel.toLowerCase()}-${role}`;
        const summaryPath = `app/app/components/${summaryFile}/${summaryFile}.component`;  
        loadSummary(summaryPath);
    }
    
    function loadSummary(summaryPath) {              
        System.import(summaryPath)
        .then(component => {
           if(currentSummary) currentSummary.clean();
           currentSummary = component.SummaryComponent();
           currentSummary.init(summaryViewElem); 
        })
        .catch(error => {            
            printError("ERROR:: while loading "+summaryPath+"\n"+error.message); 
        });
    }
    
    function printError(errorMessage){
        //if (currentSummary) currentSummary.clean();
        currentSummary = ErrorMessageComponent();
        currentSummary.init(summaryViewElem, errorMessage); 
    }
    
    function clean() {        
        if(currentSummary) currentSummary.clean();
        currentSummary = undefined;
        unsubscribes.forEach(unsubscribe => unsubscribe());
        unsubscribes = [];
        ractive.teardown();                
    }
    
    return {
        init,
        clean
    };
}