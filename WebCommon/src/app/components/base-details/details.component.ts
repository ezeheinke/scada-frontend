import Ractive from 'ractive';

import { DetailsNavbarComponent } from './details-navbar.component';
import { PageLoaderComponent } from './page-loader.component';

export function DetailsComponent() {             
    
    let ractive: IRactive = undefined;
    
    const detailsNavbar = DetailsNavbarComponent();
    const pageLoader = PageLoaderComponent();        
    
    const ractiveData = {
        el: undefined,
        template: `
            <div id="details-navbar"></div>
            <div id="page-loader"></div>
            <button id="mobile-summary-show-button" on-click="showSummary">
                <span class="icon dripicons-chevron-right"></span>
            </button>
        `,
        data: {
            activeUrl: undefined 
        }
    };        
    
    function init(elem) {
        console.log("<details>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        ractive.on("showSummary", function(){
            document.getElementById("summary").classList.remove("mobile-hidden");
            document.getElementById("mobile-shadow").classList.remove("mobile-hidden");
        });
        detailsNavbar.init('#details-navbar');        
        pageLoader.init('#page-loader');              
        console.log("</details>");
    }
    
    function clean() {
        detailsNavbar.clean();
        pageLoader.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}