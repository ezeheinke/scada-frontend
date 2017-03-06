import Ractive from 'ractive';

export function ModalCarouselPicsComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div id="carousel-slides" class="carousel slide" data-ride="carousel">
                    <!-- Wrapper for slides -->
                    <div class="carousel-inner" role="listbox">
                        {{#each images:i}}
                        <div class="item {{(i==0)?'active':''}}">
                            <img class="center-block" src="{{this}}">
                        </div>
                        {{/each}}
                    </div>
                    <!-- Controls -->
                    <a class="left carousel-control" href="#carousel-slides" role="button" data-slide="prev">
                        <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
                        <span class="sr-only">Previous</span>
                    </a>
                    <a class="right carousel-control" href="#carousel-slides" role="button" data-slide="next">
                        <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>                
                </div>
            </div>
        </div>`,
        data: {
            images: []
        } 
    };
    
    function init(elem, images: string[]) {
        console.log("<modal-carousel-pics>");
        ractiveData.el = elem;
        ractiveData.data.images = images;
        ractive = new Ractive(ractiveData);
        console.log("</modal-carousel-pics>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}