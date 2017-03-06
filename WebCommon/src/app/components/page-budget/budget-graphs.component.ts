declare var dc: any;
declare var d3: any;
declare var crossfilter: any;

import Ractive from 'ractive';
import {BudgetService} from '../../services/budget.service';


import {SummaryTabComponent} from './summary-tab.component';
import {IncomeTabComponent} from './income-tab.component';
import {ProductionTabComponent} from './production-tab.component';
import {PenaltiesTabComponent} from './penalties-tab.component';
/*
import {PenaltiesTabYearly} from './penalties-tab-yearly.component';
import {PenaltiesTabMonthly} from './penalties-tab-monthly.component';
import {PenaltiesTabDaily} from './penalties-tab-daily.component';
*/
export function BudgetGraphsComponent() {

    let ractive: IRactive = undefined;
    const budget = BudgetService();
    let tabSelected = undefined;
    let cleanUpAsked = false;
    
    const tabs = {
        'summary' : 'Summary',
        'income' : 'Income',
        'production' : 'Production',
        'penalties' : 'Power Factor',
        'default' : 'Summary'
    }
    const summaryTab = SummaryTabComponent();
    const incomeTab = IncomeTabComponent();
    const productionTab = ProductionTabComponent();
    const penaltiesTab = PenaltiesTabComponent();
    // const penaltiesTabYearly  = PenaltiesTabYearly();
    // const penaltiesTabMonthly = PenaltiesTabMonthly();
    // const penaltiesTabDaily   = PenaltiesTabDaily();
    
    const templateSummary = `
            <div id ="whole-tab-summary">
            </div>              
        `;
    const templateIncome =  `
            <div id ="whole-tab-income">
            </div>
        `;
    const templateProduction=`
            <div id ="whole-tab-production">
            </div>       
        `;
    const templatePowerFactor = `
            <div id ="whole-tab-penalties">
            </div>      
        `;
    const ractiveData = {
        el: undefined,
        template: undefined,
   };
    /**
     * TODO:
     * Change the way the template is selected!! the code is very unmantainable!
     * 
     */
    function init(elem, year,selectedTable) {        
        ractiveData.el = elem;
        tabSelected = selectedTable;

        ractiveData.template = eval('template'+selectedTable.replace(" ",""));
        ractive = new Ractive(ractiveData);
        doProcess(year,tabSelected);
    }

    function doProcess(year,selectedTable) {
            overlay();
            drawGraphs(year, selectedTable)
                .then(function(value) {overlay()},function(reason) {console.log(reason)});  
    }

    function drawGraphs(year, selectedTable) {
        return budget.getCompleteData(year)
                .then(dcData =>{

                    //check if we are still on the graphs component
                    if (!cleanUpAsked) {
                        if(selectedTable ===tabs['summary'] ){                    
                            summaryTab.init('whole-tab-summary',dcData["completeDcData"],year);
                        
                        }else if(selectedTable === tabs['income']){
                            incomeTab.init('whole-tab-income',dcData["completeDcData"],year);
                         
                        }else if(selectedTable === tabs['production'] ){
                            productionTab.init('whole-tab-production',dcData["completeDcData"],year);

                        }else if(selectedTable ===tabs['penalties']){
                            penaltiesTab.init('whole-tab-penalties',dcData["completeDcData"],year);
                            
                            // penaltiesTabYearly.init('yearly-penalties-tab',dcData["completeDcData"]);
                            // penaltiesTabMonthly.init('monthly-penalties-tab',dcData["completeDcData"], penaltiesTabDaily);                                    
                            // penaltiesTabDaily.init('daily-penalties-tab',dcData["completeDcData"], "#chart-daily-penalties-tab", year);
                        }

                    }else {
                        return Promise.reject("Services load succesfully, but state changed");
                    }
                });
    }


    function clean() {
        //because promises are unstoppable!
        cleanUpAsked = true;
        //if clean is called while loading.. take the loading icon away..
        cleanLoadingIcon();
        cleanDcComponents(tabSelected);

    }

    function cleanDcComponents(tab) {
        
         if(tab === tabs['summary']){
             summaryTab.clean();
        }else if(tab === tabs['income'] ){
            incomeTab.clean();
        }else if(tab === tabs['production']){
            productionTab.clean();
        }else if(tab === tabs['penalties'] ){
            penaltiesTab.clean();
            // penaltiesTabYearly.clean();
            // penaltiesTabMonthly.clean();
            // penaltiesTabDaily.clean();
        }
    }
    function cleanLoadingIcon() {

        if ( window.document.getElementById("load-icon-container").classList.contains("load-icon") )
            window.document.getElementById("load-icon-container").classList.toggle("load-icon");
    }

    function overlay() {
        window.document.getElementById("budget-overlay").classList.toggle("overlay");
        window.document.getElementById("load-icon-container").classList.toggle("load-icon");
        window.document.getElementById("load-icon-container").classList.toggle("white");

    }

    return {
        init,
        drawGraphs,
        clean,
        cleanDcComponents,
        doProcess
    }
}