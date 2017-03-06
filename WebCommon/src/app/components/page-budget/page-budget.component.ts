import Ractive from 'ractive';

import { BudgetGraphsComponent } from './budget-graphs.component';
import {StateContainerService} from '../../services/state-container.service';

export function PageComponent() {

    let ractive: IRactive = undefined;
    const stateContainer = StateContainerService();

    const tabs = {
        'summary' : 'Summary',
        'income' : 'Income',
        'production' : 'Production',
        'penalties' : 'Power Factor',
        'default' : 'Summary'
    }

    const buttonPartial = `<button type="button" on-click="selectTable:{{.type}}" class="{{currentTable===tabs[.type] ? 'active' : ''}} bottom-tab-button">
                        <span class="icon {{.icon}}" aria-hidden="true"></span>
                        {{tabs[.type]}}
                    </button>`;

    const budgetGraphs = BudgetGraphsComponent();
    const ractiveData = {
        el: undefined,
        template: `    
            <div id="budget-overlay" class="white">
            </div>
            <div class="row budget-top-bar">
                <div class="col-md-6 padding-block">
                    <div id="year-selector" class="col-md-6">
                        <a id="previous-year-button" on-click="translateYear:-1">
                            <span class="icon dripicons-chevron-left" aria-hidden="true"></span>
                        </a>
                        <span id="current-year">{{yearShown}}</span>
                        <a id="next-year-button" on-click="translateYear:1">
                            <span class="icon dripicons-chevron-right" aria-hidden="true"></span>
                        </a>
                    </div>
                </div>
                <div class="col-md-6 padding-block">
                    <button id="clear-filter-button" class="no-margin" on-click="cleanFilters">
                        Clear Filter
                    </button>
                </div>
            </div> 
            <div id="budget-graphs" class="row">
            </div>
            <div id="tableSelector" class="bottom-tab-bar">
                {{#buttonList}}{{>.partialName}}{{/}}
            </div> 
            `,
            partials: {buttonPartial},
            data : {
                yearShown : undefined,
                currentTable : undefined,
                tabs : tabs,
                buttonList : [
                    {partialName: 'buttonPartial' , type:'summary', icon:'dripicons-align-justify'},
                    {partialName: 'buttonPartial' , type:'income', icon:'dripicons-graph-line'},
                    {partialName: 'buttonPartial' , type:'production',icon:'dripicons-pulse'},
                    {partialName: 'buttonPartial' , type:'penalties',icon:'dripicons-warning'}
                ]
            }
        };

    const graphsPartialList = [ {partialName: 'defaultPartial' , type:'income'},
                                {partialName: 'defaultPartial' , type:'production'},
                                {partialName: 'defaultPartial' , type:'penalties'}
                              ];

    function init(elem,resolve) {
        
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        let year = new Date().getFullYear();
        ractive.set('yearShown',year);
        ractive.set('currentTable',tabs['default']);
        
        ractive.on('selectTable', function(event, optionSelected){
            let option = tabs[optionSelected] ||   tabs['default'];
            if (ractive.get('currentTable') !== option ){                
                ractive.set('currentTable',option);
                budgetGraphs.cleanDcComponents(option);
                budgetGraphs.init("#budget-graphs",ractive.get('yearShown'), option);
            }            
        });
        
        budgetGraphs.init("#budget-graphs", ractive.get('yearShown'),ractive.get('currentTable'));
        
        ractive.on('translateYear', function(event,number){
            ractive.set('yearShown',ractive.get('yearShown') + number);
            budgetGraphs.doProcess(ractive.get('yearShown'),ractive.get('currentTable') );
        });

        
        ractive.on('cleanFilters', function(event){
            let tab = ractive.get('currentTable');
            //clear the state !!
            // stateContainer.change("budgetFilters.assets",null);
            // stateContainer.change("budgetFilters.date",null);
            budgetGraphs.cleanDcComponents(tab);
            budgetGraphs.doProcess(ractive.get('yearShown'),tab);
        });
        
        resolve(1);
    }

    function clean() {
        budgetGraphs.clean();    
        ractive.teardown();
    }

    return {
        init,
        clean
    };
}