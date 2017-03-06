import Ractive from 'ractive';
declare var System: any;

import { ErrorMessageComponent } from '../base/error-message.component';

import { StateContainerService } from '../../services/state-container.service';

export function PageLoaderComponent() {                 
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    
    const ractiveData = {
        el: undefined,
        template: `
           <div id="page-view"></div>
        `
    };
    
    let views = [];
    const pageViewElem = '#page-view';
    
    
    let currentPage = undefined;
    let unsubscribes = [];
    
    function init(elem) {
        console.log("<page-loader>");
        ractiveData.el = elem;           
        ractive = new Ractive(ractiveData);             
        views = stateContainer.Static.Data.views;
        unsubscribes.push(            
            stateContainer.subscribe("viewPage", function(viewPage){
                const view = stateContainer.read("view");
                const role = stateContainer.read("role");
                if (viewPage)
                    onChange(view, viewPage, role);
                
            })
            // stateContainer.subscribe("view", function(view){
            //     const viewPage = stateContainer.read("viewPage");
            //     const role = stateContainer.read("role");
            //     onChange(view, viewPage, role);
            // }, true),
            // stateContainer.subscribe("role", function(role){
            //     const view = stateContainer.read("view");
            //     const viewPage = stateContainer.read("viewPage");
            //     onChange(view, viewPage, role);
            // }, true)
        );
                      
        console.log("</page-loader>");
    }
    
    function onChange(viewId, viewPage, role){                  
        const view = views[viewId];
        if(view) {
            const page = view.pages[role].find(page => page.id===viewPage); // view.pages.find(page => page.id===viewPage&&page.role===role);
            if (page) {
                    const pagePath = `app/app/components/${page.pageFile}/${page.pageFile}.component`;
                    loadPage(pagePath);
                        
            }
            else printError(`ERROR:: Cannot find page ${viewPage} in view ${view.id} for role ${role}`);
        }
        else printError(`ERROR:: View ${viewId} doesn't exist`);
    }
    
    function loadPage(pagePath) {        
        
        System.import(pagePath)
        .then(component => {
            
            if (currentPage) currentPage.clean();  
            

            disableLinks()
            currentPage = component.PageComponent();
            new Promise( resolve => currentPage.init(pageViewElem,resolve))
                .then(function() { enableLinks()});
               
             
        })
        .catch(error => {            
            printError("ERROR:: while loading "+pagePath+"\n"+error.message);
        });   
    }
     
    function disableLinks() {
        window.document.getElementById("load-icon-container").classList.toggle("load-icon");
        let list = window.document.querySelectorAll("#page-tabs li");
        for (let i = 0; i < list.length; i++) {
            let li = list[i];
            li.classList.add("disabled");
            li.setAttribute("onclick","return false;");
        }
    }
    
    function enableLinks() {
        window.document.getElementById("load-icon-container").classList.toggle("load-icon");
        let list = window.document.querySelectorAll("#page-tabs li");
        for (let i = 0; i < list.length; i++) {
            let li = list[i];
            li.classList.remove("disabled");
            li.removeAttribute("onclick");
                
        }
        //trick to reset whatever the user clicked while loading..
        (<HTMLElement>document.activeElement).blur();

    }

    function printError(errorMessage) {
        //if (currentPage) currentPage.clean();
        currentPage = ErrorMessageComponent();
        currentPage.init(pageViewElem, errorMessage); 
    }
    
    function clean() {
        if (currentPage) currentPage.clean();       
        unsubscribes.forEach(unsubscribe => unsubscribe());
        ractive.teardown();
        currentPage = undefined;
        unsubscribes = [];
    }
    
    return {
        init,
        clean
    };
}