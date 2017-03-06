import Ractive from 'ractive';

export function SummaryActionsComponent() {                 
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
            <button id="mobile-summary-hide-button" class="action-link" on-click="hideSummary">
                <span class="icon dripicons-chevron-left"></span>
            </button>
        `
    };
    
    function init(elem) {
        console.log("<summary-actions>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        ractive.on("hideSummary", function(){
            document.getElementById("summary").classList.add("mobile-hidden"); 
            document.getElementById("mobile-shadow").classList.add("mobile-hidden");
        });
        console.log("</summary-actions>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}