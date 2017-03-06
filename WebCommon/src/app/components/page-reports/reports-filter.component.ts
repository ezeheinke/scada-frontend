import Ractive from 'ractive';

// declare var dc: any;
// declare var d3: any;
// declare const $: any;

export function ReportsFilterComponent() {

    let ractive: IRactive = undefined;

    const ractiveData = {
        el: undefined,
        template: `   
            <div class="bottom-filter-wrapper">
                <label for="date-range-input">Date Range</label>
                <input id='date-range-input' type='text' placeholder="Date Range" class="input-field clickable"/>
            </div>
            <div class="bottom-filter-wrapper">
                <label for="group-by-select">Group By</label>
                <select id='group-by-select' type='text' class="input-field clickable">
                    <option>Day</option>
                    <option>Week</option>
                    <option>Month</option>
                    <option>Season</option>
                </select>
            </div>
            <div class="bottom-filter-button-wrapper">
                <button id="generate-report-button" class="primary-button">
                    <i class="icon dripicons-export"></i> Generate Report
                </button>
            </div>
        `
    };

    function init(elem) {
        console.log("<reports-filter>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);                

        // dateTimePicker('#date-start-input', new Date(2016, 6 - 1, 6));
        // dateTimePicker('#date-end-input', new Date(2016, 6 - 1, 13));

        console.log("</reports-filter>");
    }

    // function dateTimePicker(elem, defaultDate) {
    //     var datePicker = $(elem).datetimepicker({
    //         format: 'DD/MM/YYYY'
    //     });
    //     $(elem).data("DateTimePicker").date(defaultDate);
    // }

    function clean() {
    }

    return {
        init,
        clean
    };
}