import Ractive from 'ractive';
declare var $: any;

import { AssetsTableComponent } from './assets-table.component';
import * as utils from '../../utils';
import { StateContainerService } from '../../services/state-container.service';

const stateContainer = StateContainerService();

export function PageComponent() {             
    
    let ractive: IRactive = undefined;
    const assetsTable = AssetsTableComponent();
        
    const ractiveData = {
        el: undefined,
        template: `
            <div class="bottom-tab-view-container">
                <div id="tableSelector" class="bottom-tab-bar" role="group">
                    {{#tables}}
                        <button type="button" on-click="selectTable:{{this}}" class="{{selectedTable===name ? 'active' : ''}} bottom-tab-button">
                               <span class="{{icon}}" aria-hidden="true"></span>
                            {{name}}
                        </button>
                    {{/tables}}
                </div>
                <div class="content-container">
                    <div id="assets-table">
                    </div>
                </div>
            </div>
        `,
        data: {
            tables: [],
            selectedTable: undefined            
        }
    };
    
    function init(elem,resolve) {
        console.log("<page-assets>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        const asset = stateContainer.Static.Data.views['CCR'];
        const pageData = asset.pagesData['assets'];
        const tables = pageData['tables'];

        let selectedTable = tables[0]['name'];
        ractive.set({selectedTable, tables});

        const firstTableColumns = tables[0]['signals'];
        assetsTable.init('#assets-table');
        resolve(assetsTable.loadColumns(firstTableColumns));
        utils.fixTable('#page-view', '#assets-table-list', 2, 1, '#tableSelector');
        ractive.on('selectTable', function(event, table){            
            if (selectedTable !== table['name']){                
                selectedTable = table['name'];
                const tableColumns = table['signals'];
                ractive.set({selectedTable});
                resolve(assetsTable.loadColumns(tableColumns));
                utils.fixTable('#page-view', '#assets-table-list', 2, 1, '#tableSelector');
            }            
        });
        $(window).resize(function(){
            utils.fixTable('#page-view', '#'+$('table').parent().attr('id'), 2, 1, '#tableSelector');
        });       
        console.log("</page-assets>");
    }
    
    function clean() {
        assetsTable.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}