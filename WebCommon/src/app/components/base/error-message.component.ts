import Ractive from 'ractive';

export function ErrorMessageComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `  
            <b>{{{errorMessage}}}</b>
        `,
        data: {
            errorMessage: "undefined errorMessage"
        }
    };
    
    function init(elem, errorMessage) {
        console.log("<error-message>");
        console.error(errorMessage);
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        ractive.set("errorMessage", errorMessage.split('\n').join('</b><p><b>'));  
        console.log("</error-message>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}