import Ractive from 'ractive';

declare var $: any;

export function ModalConfirmComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
        <div class="modal-dialog modal-narrow" on-keypress="keypress">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true" on-click="callback:{{cancel}}">&times;</span></button>
                    <div class="modal-title">Confirmation</div>
                </div>
                <div class="modal-body">
                    <div class="modal-message">
                        {{{message}}}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" on-click="callback:{{cancel}}">Cancel</button>
                    <button type="button" class="btn btn-primary" on-click="callback:{{confirm}}">Accept</button>
                </div>
            </div>
        </div>`,
        data: {
            message: undefined,
            confirm: ()=>{},
            cancel:  ()=>{}
        } 
    };
    
    function init(elem, message, confirm, cancel) {
        console.log("<modal-confirm>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        ractive.set({
            message,
            confirm,
            cancel
        });

        ractive.on('callback', function(event, callback){
            callback();
            $(elem).modal('hide');
        });
        ractive.on('keypress', function(event, callback){
            // debugger TODO: accept when keypress enter
        });

        console.log("</modal-confirm>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}