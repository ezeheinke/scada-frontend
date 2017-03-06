import Ractive from 'ractive';

import { ModalWindowService } from '../../services/modal-window.service';

export function PhotoGalleryComponent() {
    
    let ractive: IRactive = undefined;
    let ractivePicsCarrousel: IRactive = undefined;

    const modalWindow = ModalWindowService();
    
    const ractiveData = { // TODO: James, don't kill me to put inline styles :P
        el: undefined,
        template: `
            <div id="photo-gallery-inner" title="Show images" on-click="carouselPics" style="height: inherit; cursor: pointer;">
                <img src="{{image}}" class="img-responsive" style="height: inherit;">
			</div>            
        `,
        data: {            
            image: undefined
        }
    }; 
    
    function init(elem, images) {
        console.log("<photo-gallery>");
        ractiveData.el = elem;
        
        images = images.length <= 0 ? ["data/components/page-info/images/no-image-available.png"] : images;

        ractiveData.data.image = images[0];
        ractive = new Ractive(ractiveData);
        ractive.on('carouselPics', () => modalWindow.carouselPics(images));

        console.log("</photo-gallery>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}

// <!-- Youtube videos -->
// <div class="item {{(i==0)?'active':''}}">
//     <div style="margin: 15px;padding: 0px;width: 500;height: 255px;margin-left: 70px;"> 
//         <iframe width="450" height="253" src="https://www.youtube.com/embed/bV6Jn9jgQBY" frameborder="0" allowfullscreen></iframe>                            
//     </div>
// </div>
// <div class="item {{(i==0)?'active':''}}">                                
//     <div style="margin: 15px;padding: 0px;width: 500;height: 255px;margin-left: 70px;">
//         <iframe width="450" height="253" src="https://www.youtube.com/embed/3YG2fLJHV2Y" frameborder="0"></iframe>
//     <!--https://www.youtube.com/watch?v=EHJmLRp_xqY-->
//     </div>                                
// </div>