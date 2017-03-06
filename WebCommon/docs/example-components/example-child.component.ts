import Ractive from 'ractive';   // use Ractive.default() instead of new Ractive()

export function ExampleChildComponent() {                 
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: '#example-child',
        template: `
            <h4>ExampleChildComponent</h4>
        `
    };
    
    function init() {
        console.log("<example-child>");
        ractive = new Ractive(ractiveData);
        console.log("</example-child>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}