import Ractive from 'ractive';


export function SummaryComponent() {             
    
    let ractive: IRactive = undefined;
    const ractiveData = {
        el: undefined,
        template: `
           <div class="summary-line no-padding">
                <div>
                Asset level.
                </div>
            </div> 
        `
    };
    
    function init(elem) {
        console.log("<summary-asset-owner>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData); 
        console.log("</summary-asset-owner>");
    }

    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}