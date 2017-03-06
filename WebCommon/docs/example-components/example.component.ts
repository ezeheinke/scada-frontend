import Ractive from 'ractive';   // use Ractive.default() instead of new Ractive()

import { ExampleChildComponent } from './example-child.component';

export function ExampleComponent() {                 
    let ractive: IRactive = undefined;
    
    const exampleChild = ExampleChildComponent();
    
    const ractiveData = {
        el: '#example',
        template: `
            <h4>ExampleComponent</h4>
            <div id="example-child">EXAMPLE CHILD...</div>
        `
    };
    
    function init() {
        console.log("<example>");
        ractive = new Ractive(ractiveData);
        
        exampleChild.init();
        
        console.log("</example>");
    }
    
    function clean() {
        exampleChild.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}