import Ractive from 'ractive';

export function PageComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `            
            <h4>PageSetComponent</h4>            
        `
    };
    
    function init(elem) {
        console.log("<page-set>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        console.log("</page-set>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}