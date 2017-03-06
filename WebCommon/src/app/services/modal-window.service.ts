import Ractive from 'ractive';

declare var $: any;

import { ModalConfirmComponent } from '../components/modals/modal-confirm.component';
import { ModalCarouselPicsComponent } from '../components/modals/modal-carousel-pics.component';
import { ModalEventsComponent } from '../components/modals/modal-events.component';

import { StateContainerService } from './state-container.service';

const stateContainer = StateContainerService();

export function ModalWindowService() {
    
    const elem = '#modal-window';
    let cleanModal = undefined;

    let ractive: IRactive = undefined;
    let unsubscribe = undefined;    

    function init() {
        console.log("<modal-window>");

        $(elem).on('hidden.bs.modal', function () {
            if (ractive) ractive.teardown();
            if (unsubscribe) unsubscribe();
            if (cleanModal) cleanModal();
        });

        let oldRole = undefined;
        stateContainer.subscribe("role", role => {
            const modalWindow = document.querySelector(elem);
            modalWindow.classList.remove('theme-'+oldRole);
            modalWindow.classList.add('theme-'+role);
            oldRole = role;
        });

        console.log("</modal-window>");
    }

    function confirm(message: string, confirm: ()=>void, cancel = ()=>{}) {
        const modal = ModalConfirmComponent();
        modal.init(elem, message, confirm, cancel);
        cleanModal = modal.clean;
        $(elem).modal('show');
    }
    
    function carouselPics(images: string[]) {
        const modal = ModalCarouselPicsComponent();
        modal.init(elem, images);
        cleanModal = modal.clean;
        $(elem).modal('show');
    }
    
    function displayEvents(asset?) {
        const modal = ModalEventsComponent();
        modal.init(elem, asset);
        cleanModal = modal.clean;
        $(elem).modal('show');
    }    
    
    return {
        init,
        confirm,
        carouselPics,
        displayEvents
    }
    
}