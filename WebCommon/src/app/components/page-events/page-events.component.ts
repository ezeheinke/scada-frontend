import Ractive from 'ractive';

declare var moment: any;

import { EventsFilterComponent } from './events-filter.component';
import { EventsGraphsComponent } from './events-graphs.component';

export function PageComponent() {             
    
    let ractive: IRactive = undefined;

    const eventsFilter = EventsFilterComponent();
    const eventsGraphs = EventsGraphsComponent();
    
    const ractiveData = {
        el: undefined,
        template: `
            <div class="row">
                <div id="events-filter" class="row">
                </div>
                <div id="events-graphs" class="row">
                </div>
            </div>
        `
    };
    
    function init(elem,resolve)  {
        console.log("<page-events>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        eventsFilter.init('#events-filter');
        resolve(eventsGraphs.init('#events-graphs'));
        //eventsGraphs.load(moment('2016-06-01'), moment('2016-08-09'));

        console.log("</page-events>");
    }
    
    function clean() {
        eventsFilter.clean();
        eventsGraphs.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}