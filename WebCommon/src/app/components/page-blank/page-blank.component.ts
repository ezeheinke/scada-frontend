import Ractive from 'ractive';

export function PageComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `            
            <h4>Blank Page</h4>            
        `
    };
    
    function init(elem) {
        console.log("<page-blank>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        console.log("</page-blank>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}