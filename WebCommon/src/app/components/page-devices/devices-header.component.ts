import Ractive from 'ractive';

export function DevicesHeaderComponent() {

    let ractive: IRactive = undefined;
    const ractiveData = {
        el: undefined,
       template: `
            <table class="table table-responsive custom-table-with-theme">
            <thead>
                <tr>
                    <th>Device</th>
                    {{#tableColumns}}
                        <th class="top-header">
                            {{name}}
                        </th>
                    {{/tableColumns}}
                    <th>Alerts</th>
                </tr>
            </thead>
            </table>
        `,
        data: {
            tableColumns: []
        }
    };
    function init(elem,tableColumns) {
        console.log("<devices-header>");
        
        ractiveData.el = elem;        
        ractiveData.data.tableColumns = tableColumns;
        ractive = new Ractive(ractiveData);
        
        console.log("</devices-header>");
    }

    function clean() {
        ractive.teardown();
    }

    return {
        init,
        clean
    }


}