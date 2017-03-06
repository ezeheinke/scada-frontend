import Ractive from 'ractive';


export function ReportsTableComponent() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="error-message">
                Sorry, there's no reports to show right now.
            </div>
        `
    };

    function init(elem) {
        console.log("<reports-table>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        console.log("</reports-table>");
    }

    function clean() {
        ractive.teardown();
    }

    return {
        init,
        clean
    };
}