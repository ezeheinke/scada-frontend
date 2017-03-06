import {StateContainerService} from './state-container.service';
import {ResourcesService} from './resources.service';
import * as util from "../utils";

declare var crossfilter: any;
declare var d3: any;
declare var $: any;

const stateContainer = StateContainerService();
const resources = ResourcesService();

let riIncomeArray = new Array();

export function BudgetService() {

    function init() {

    }
    
    function createBodyRequest(year?) {
        
        const assetsInfo = resources.getAssets().map(asset => {
            var obj = {'assetId': asset.id,
                        'dbProduccionName': asset.dbProduccionName ? asset.dbProduccionName: "",
                        'dbPrediccionGraficaName':asset.dbPrediccionGraficaName ? asset.dbPrediccionGraficaName: ""
                    }
            return obj;  
        });

        return {
            "assetsInfo" : assetsInfo,
            "year" : year ||0
            }
    }    


    function getTodaysEarningsData() {
        
        const serverPath = stateContainer.Static.Data.serverPath;
        const token = stateContainer.read('user.token');  
        
        const request = JSON.stringify(createBodyRequest());
        
        return fetch(serverPath+'/api/budget/todaysearningsdata',{
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: request
            })
            .then(response => 
                response.json())
            .then(earningsData => {
                return earningsData;
        });
    
    }


    function getSummaryDailyData(){
       
        const serverPath = stateContainer.Static.Data.serverPath;
        const token = stateContainer.read('user.token');  
        const request = JSON.stringify(createBodyRequest());
        
        
        const promise = new Promise(resolve => {
                fetch(serverPath+'/api/budget/dailydata',{
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: request
                })
                .then(response => response.json())
                .then(dataset => {
                    
                    const ndx = crossfilter(dataset);
                    //record.hour needs an offset of one hour!
                    const hourDimension = ndx.dimension(function(record){ return +record.hour+1;});

                    const dcData = {
                        ndx,
                        hourDimension
                    };
                    resolve(dcData);  
                });
        });

        return promise;
        
    }

    function getCompleteData(year){
        
        const serverPath = stateContainer.Static.Data.serverPath;
        const token = stateContainer.read('user.token');  
        
        const request = JSON.stringify(createBodyRequest(year));
       
        const promise = new Promise(resolve => {

            fetch(serverPath+`/api/budget/completedata`,{
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: request
            })
            .then(response => response.json())
            .then(dataset => {                

                const completeDcData = prepareCompleteDcData(dataset.assetsInfo);

                const dcData = {
                    completeDcData
                };
                resolve(dcData);  
                })
                .catch(error => console.log());
        });
        return promise;
    }


    function parseData(dataset) {
        const dateFormat = d3.time.format('%m/%d/%Y');
        const monthFormat = d3.time.format('%m/%Y');
        
        dataset.forEach(function (record: BudgetAssetRecord) {
            record.dateParsed = dateFormat.parse(record.date);
            record.monthParsed = monthFormat.parse(monthFormat(record.dateParsed));
        });

        return dataset;
    }

    function prepareCompleteDcData(datasetAssetInfo) {
        
        const parsedDataset = parseData(datasetAssetInfo);
        const ndx = crossfilter(parsedDataset);

        const dailyDimension = ndx.dimension(function(record: BudgetAssetRecord){ return record.dateParsed;});
        const monthDimension = ndx.dimension(function(record: BudgetAssetRecord){ return record.monthParsed;});
        const assetDimension = ndx.dimension(function(record: BudgetAssetRecord){ return record.assetId;});        
        const domain = getNiceMonthlyDomain(monthDimension);
        const data = {
                    ndx,
                    dailyDimension,
                    monthDimension,
                    assetDimension,
                    domain
        };

        return data;

    }

    function getNiceMonthlyDomain(monthlyDimension) {
        
        var dateStart = monthlyDimension.bottom(1)[0].monthParsed;
        var dateEnd = monthlyDimension.top(1)[0].monthParsed;

        return {
           start : d3.time.day.offset(dateStart,-15),
           end :  d3.time.day.offset(dateEnd,+15)
        }

    }

    function getMoment() {
        
        let date = new Date();
        let year = date.getUTCFullYear();
	    let month = date.getUTCMonth() + 1;
	    let day = date.getUTCDate();
	    let hour = date.getUTCHours();

        return `${year}-${month}-${day} ${hour}`;
    }

    function clean() {
        
    }

    return {
        init,
        clean,
        getTodaysEarningsData,
        getSummaryDailyData,
        getCompleteData
    }

}