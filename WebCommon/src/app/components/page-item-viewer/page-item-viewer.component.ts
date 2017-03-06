import Ractive from 'ractive';
import * as RactiveEventsKeys from 'ractive-events-keys';

import { CompactScadaService } from '../../services/compact-scada.service';
import { EditableItemRowComponent } from './editable-item-row.component';


const compactScada = CompactScadaService();
const defaultPattern = `.*`;

export function PageComponent() {             
    
    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        events: { 
            enter: RactiveEventsKeys['enter'],
        },
        template: `
            <div class="bottom-tab-view-container">
                <!-- Items list -->                
                <div class="content-container">
                    <div id="item-viewer-table">
                        <table class="table table-responsive custom-table-with-theme">
                            <thead>
                                <tr>
									<th>Signal Name</th>
                                    <th>Value</th>
                                    <th>Timestamp</th>
                                    <th>Quality</th>
                                </tr>
                            </thead>
							<tbody>
							    <!-- <div class="{{showMessage ? '' : 'hidden'}}">Loading...</div> -->
                                {{#items}}
                                    <tr id="editable-item-{{Name}}" >
                                    </tr>
                                {{/items}}
							</tbody>
                        </table>
                    </div>
                </div>

                <!-- query pattern -->
                <div class="bottom-tab-bar responsive-large">
                    <div id="item-viewer-query">
                        <div class="bottom-filter-wrapper">
                            <label for="date-range-input">Query Pattern:</label>
                            <input id='date-range-input' type='text' placeholder="pattern" on-enter="retrieveItems:{{queryPattern}}" class="input-field" value="{{queryPattern}}"/>
                        </div>
                        <div class="bottom-filter-button-wrapper">
                            <button id="query-pattern-button" class="primary-button" on-click="retrieveItems:{{queryPattern}}">
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        data: {
            items: [],
            queryPattern: defaultPattern
        }
    };
    
    let editableItemsRow = [];
    
    function init(elem,resolve) {
        
        console.log("<page-item-viewer>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        resolve(getItems(defaultPattern));
        
        ractive.on('retrieveItems', function(event, queryPattern){            
            if (queryPattern !=="") {
                resolve(getItems(queryPattern));
            }
            else {
                alert("You must enter a pattern");
                }
        });
        
        console.log("</page-item-viewer>");

        return this;
    }

    function getItems(pattern) {

        if (ractiveData.data.items.length > 0 || editableItemsRow.length > 0) {
            disposeData();
        }

        return compactScada.getSignals(pattern)
                .then(items => {
                    //ractive.set('showMessage',false);
                    ractive.set('items', items);
                    items.forEach(item => {
                        initEditableRow(item);
                    });
                });

    }


    function initEditableRow(item) {

        const itemRow = EditableItemRowComponent();
        itemRow.init(`editable-item-${item.Name}`,item);
        editableItemsRow.push(itemRow);
    }

    function disposeData() {
    
        ractiveData.data.items = [];
        ractive.set('items',ractiveData.data.items);
        //ractive.set('showMessage',true);

        editableItemsRow.forEach(editableSignal => editableSignal.clean());
        editableItemsRow = [];
        
    }
    function clean() {
        disposeData();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}