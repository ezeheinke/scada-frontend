import Ractive from 'ractive';

export function SummaryComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
            Admin CCR summary
        `
    };
    
    function init(elem) {
        console.log("<summary-ccr-admin>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData); 
        console.log("</summary-ccr-admin>");
    }
    
    function clean() {        
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}