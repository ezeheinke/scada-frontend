import Ractive from 'ractive';

import { GroupedItemsService } from '../../services/grouped-items.service';
import { StateContainerService } from '../../services/state-container.service';
const groupedItems = GroupedItemsService();
const stateContainer = StateContainerService();  

declare const $: any;
declare const moment: any;

export function PageComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="row">
                <form action="{{serverPath}}/api/report/create" method="post">
                    <input type="hidden" name="minutesOffset" value="{{minutesOffset}}">
                    <div class="col-sm-6 padding-block">
                        <label for="date-range-input">Date Range</label>
                        <input id='date-range-input' type='text' placeholder="Date Range" class="input-field clickable"/>
                    </div>
                    <input type="hidden" name="startDate" value="{{startDate}}">
                    <input type="hidden" name="endDate" value="{{endDate}}">
                    <div class="col-sm-6 padding-block">
                        <label for="group-by-select">Group By</label>
                        <select id='group-by-select' type='text' class="input-field clickable" name="timeRange" value='{{timeRange}}'>
                            {{#each timeRanges}}
                            <option value="{{id}}">{{name}}</option>
                            {{/each}}
                        </select>
                    </div>
                    <div class="col-sm-4 padding-block">
                        <label>Groups</label>
                        <select multiple name="selectedGroups" value="{{selectedGroups}}">
                            {{#each groups}}
                            <option value="{{id}}">{{name}}</option>
                            {{/each}}
                        </select>
                    </div>
                    <div class="col-sm-4 padding-block">
                        <label>Items</label>
                        <select multiple name="selectedItems" value="{{selectedItems}}">
                            {{#each items}}
                            <option value="{{id}}">{{name}}</option>
                            {{/each}}
                        </select>
                    </div>
                    <div class="col-sm-4 padding-block">
                        <label for="file-name-input">File Name</label>
                        <input id='file-name-input' type='text' placeholder="File Name" class="input-field" name="fileName" value="{{fileName}}"/>
                        <button type="submit" id="generate-report-button" class="primary-button" disabled="{{!submitEnabled}}">
                            <i class="icon dripicons-export"></i> Generate Report
                        </button>
                    </div>
                </form>
            </div>
        `,
        data: {
            minutesOffset: undefined,
            startDate: undefined,
            endDate: undefined,
            timeRanges: [],
            timeRangeSelected: undefined,
            groups: [],
            selectedGroups: [],
            items: [],
            selectedItems: [],
            fileName: undefined,
            submitEnabled: false
        }
    };
    
    function init(elem,resolve) {
        console.log("<page-reports>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        ractive.set('serverPath', stateContainer.Static.Data.serverPath);

        //TODO
        resolve(true);

        // default start and end dates (Last 30 days)
	    const startDate = moment().subtract(29, 'days');
        const endDate = moment();
        const timeRanges = [            
            {id: "instantly", name: "Instantly"},
            {id: "minutely_1", name: "Minutely"},
            {id: "minutely_10", name: "Every 10 minutes"},
            {id: "minutely_60", name: "Hourly"},
            {id: "daily", name: "Daily"},
            {id: "monthly", name: "Monthly"}
        ];
        const timeRange = 'minutely_10';
        const fileName = `report_${moment().format('YYMMDD')}.xlsx`;        

        ractive.set({
            minutesOffset: (new Date()).getTimezoneOffset(),
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            timeRanges,
            timeRange,
            groups: [{id: undefined, name: 'Loading...'}],            
            fileName
        });

        initDateRangePicker(startDate, endDate);        

        groupedItems.get()
        .then(groups => {
            ractive.set('groups', groups);
        });

        ractive.observe('selectedGroups', function(groupsIds){
            const groups = ractive.get('groups');
            let items = [];
            groupsIds.forEach(groupId =>{
                const group = getObjectFromArray(groupId, groups);
                items = group ? items.concat(group.items) : items;
            });            
            ractive.set('items', items);
        });

        ractive.observe("selectedItems fileName", function () {
            const fileName = ractive.get('fileName');
            const selectedItems = ractive.get('selectedItems');
            const submitEnabled =
                (/^[a-zA-Z0-9_]+\.xlsx$/.test(fileName)) &&
                (selectedItems instanceof Array) &&
                (selectedItems.filter(x => typeof x === "string").length > 0);
            ractive.set("submitEnabled", submitEnabled);
        });
        
        ractive.on('generateReport', function(event){            
            // const postBody = {
            //     minutesOffset: (new Date()).getTimezoneOffset(),
            //     startDate: ractive.get('startDate'),
            //     endDate: ractive.get('endDate'),
            //     timeRange: ractive.get('timeRange'),
            //     fileName: ractive.get('fileName')
            // }
            // debugger
            // let postString = JSON.stringify(postBody);
            // postString = postString.slice(0, -1);

            // postString += '}';
            //     selectedGroups:PARK_SierraLacera
            //     selectedItems:PARK_SierraLacera.SetpointReceived
            //     selectedItems:PARK_SierraLacera.Temperature
        });

        console.log("</page-reports>");
    }

    function getObjectFromArray(id, array) {
        if (id===undefined) return undefined;
        const objects = array.filter(object => object.id === id);
        return objects[0];
    }

    function initDateRangePicker(startDate, endDate){
         $('#date-range-input').daterangepicker({
            startDate,
            endDate,
            "ranges": {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
            "locale": {
                "format": "DD/MM/YYYY",
                "firstDay": 1,
                "applyLabel": "Select"
            }
        }, function(startDate, endDate, label) {            
            ractive.set({
                startDate: startDate.format('YYYY-MM-DD'),
                endDate: endDate.format('YYYY-MM-DD')
            });
            debugger
        });
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}

// POST_body: {
//     minutesOffset:-120
//     startDate:2016-08-03
//     endDate:2016-08-10
//     timeRange:minutely_10
//     selectedGroups:PARK_SierraLacera
//     selectedItems:PARK_SierraLacera.SetpointReceived
//     selectedItems:PARK_SierraLacera.Temperature
//     fileName:report_160810.xlsx
// };