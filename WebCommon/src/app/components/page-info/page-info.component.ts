import Ractive from 'ractive';

import { StateContainerService } from '../../services/state-container.service';
import { ResourcesService } from '../../services/resources.service';

import { MapComponent } from '../common-pages/map.component';
import { PhotoGalleryComponent } from './photo-gallery.component';
import { DataInfoComponent } from './data-info.component';
import { CompactScadaService } from '../../services/compact-scada.service';

export function PageComponent() {             
    
    let ractive: IRactive = undefined;

    const stateContainer = StateContainerService();
    const resources = ResourcesService();
    const compactScada = CompactScadaService();
    const map = MapComponent();
    const photoGallery = PhotoGalleryComponent();

    const dataInfo = DataInfoComponent();

    const ractiveData = {
        el: undefined,
        template: `            
            <div class="row">
                <div class="col-sm-6 no-padding-wrapper">
                    <div id="small-map"></div>
                </div>
                <div class="col-sm-6 no-padding-wrapper">
                    <div id="photo-gallery">    
                    </div>
                </div>
                <div id="data-info">
                </div>
            </div>
        `
    };

    let unsubscribe = undefined;
    
    function init(elem,resolve) {
        console.log("<page-info>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        const asset = resources.getCurrentAsset();        
        let prefix = asset.id.split('_')[0];
        var jsonAlerts = JSON.parse(getAlerts(asset.id));
        var msgSignal, infoSignal, nominalPower, windSpeed, windDirection, activePower, reactivePower, temperature;
        jsonAlerts.forEach(alert => {
            if(asset.id+'.WeatherAlertMsg' == alert.Name)
                msgSignal = alert.Value;
            if(asset.id+'.WeatherAlertInfo' == alert.Name)
                infoSignal = alert.Value;
            if(asset.id+'.NominalPower' == alert.Name)
                nominalPower = alert.Value;
            if(asset.id+'.WindSpeed' == alert.Name)
                windSpeed = alert.Value;
            if(asset.id+'.WindDirection' == alert.Name)
                windDirection = alert.Value;
            if(asset.id+'.ActivePower' == alert.Name)
                activePower = alert.Value;
            if(asset.id+'.ReactivePower' == alert.Name)
                reactivePower = alert.Value;
            if(asset.id+'.Temperature' == alert.Name)
                temperature = alert.Value;
        });
        let marker  = {"id":asset.id,"type": (prefix? prefix.toLowerCase(): "default") + checkAlert(asset.id, jsonAlerts) , "latitude": asset.coords.latitude,
                                "longitude": asset.coords.longitude,"name":asset.name, "WeatherAlertMsg": msgSignal, "WeatherAlertInfo": infoSignal, "NominalPower": nominalPower,
                                "WindSpeed": windSpeed, "WindDirection": windDirection, "ActivePower": activePower, "ReactivePower": reactivePower, "Temperature": temperature};

        const markers = new Array(marker);

        map.init('#small-map', markers);

        fetch(`/data/components/page-info/${asset.id}.json`)
        .then(response => {
            if (response.status === 404) return Promise.reject(response);           
            return response.json();
        })
        .then((pageData: any) => {            

            let images = pageData.images;            
            images = images instanceof Array ? images.map(image => `data/components/page-info/images/${asset.id}/${image}`) : [];
            photoGallery.init('#photo-gallery', images);            

            unsubscribe = stateContainer.subscribe('role', function(role) {
                let info = pageData.rolesInfo[role];                
                if (typeof info === 'string') info = pageData.rolesInfo[info];
                dataInfo.clean();
                dataInfo.init('#data-info', info);
            });
        })
        .then(()=>resolve(1))
        .catch(response => {
            photoGallery.init('#photo-gallery', []);            
            dataInfo.init('#data-info', undefined);
            resolve(1);
        });                   

        console.log("</page-info>");
    }
    
    function getAlerts(prefix){
        //get alerts from compactScada signals 
        return compactScada.getSignalsSynch('^('+prefix+')(.)(NominalPower|ReactivePower|WindSpeed|WindDirection|WeatherAlertInfo|WeatherAlertMsg|Temperature|ActivePower)$');
    }
    
    function checkAlert(asset, jsonAlerts){
        var isAlert = false;
        jsonAlerts.forEach(alert =>{
            if(asset+'.WeatherAlertInfo' == alert.Name && (alert.Value != '[]' && alert.Value != '')){
                isAlert = true;
            }
        });

        return (isAlert)? 'alert':'';
    }
    
    function clean() {
        if (unsubscribe) unsubscribe();
        map.clean();
        photoGallery.clean();
        dataInfo.clean();
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}