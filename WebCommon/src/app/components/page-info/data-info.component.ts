import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';

export function DataInfoComponent() {             
    
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();

    const partialInfoRender = `
    <div class="col-sm-6 info-container">
        {{#this: infoGroup}}
        <div class="info-group">
            <div class="title">
                {{infoGroup}}
            </div>
            <div class="text">
                {{#this: infoLine}}

                {{#if (typeof this === "string")}}                          
                    <span class="item-title">{{infoLine}}:</span> {{{this}}}
                    <br>

                {{elseif (this instanceof Array)}}
                    <div class="group-title">
                        {{infoLine}}
                    </div>
                    <div class="column-text">
                        <div class="text-item">
                            {{#each this}}
                                {{{this}}}
                                <br>
                            {{/each}}
                        </div>
                    </div> 

                {{else}}
                    <span class="item-title">Error on {{infoLine}}):</span> {{this}}
                    <br>

                {{/if}}
                
                {{/this}}
            </div>
        </div>                
        {{/this}}
    </div>`;

    const partialInfoEmpty = `
    <div class="col-xs-12 empty-message">
        Currently no info available
    </div>`;
    
    const ractiveData = {
        el: undefined,
        template: `
            {{#if empty===false}}
            {{#left}}
                {{>infoRender}}
            {{/left}}
            {{#right}}
                {{>infoRender}}
            {{/right}}
            {{else}}
                {{>infoEmpty}}
            {{/if}}
        `,
        partials: {
            infoRender: partialInfoRender,
            infoEmpty: partialInfoEmpty
        },
        data: {
            empty: true,
            left: {},
            right: {},
        }
    };
    
    function init(elem, info) {
        console.log("<data-info>");
        ractiveData.el = elem;

        if (info){
            ractiveData.data.empty = false;
            ractiveData.data.left = info.left;
            ractiveData.data.right = info.right;
        }
        else {
            ractiveData.data.empty = true;
        }

        ractive = new Ractive(ractiveData);
        console.log("</data-info>");
    }
    
    function clean() {
        if (ractive) ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}