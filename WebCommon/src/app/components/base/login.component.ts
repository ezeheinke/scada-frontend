import Ractive from 'ractive';

declare var $: any;

import { StateContainerService } from '../../services/state-container.service'
import { LoginService } from '../../services/login.service';

const stateContainer = StateContainerService();
const loginService = LoginService();

export function LoginComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `
            <img id="bg-login-image" src="styles/images/fondo.jpg" >
            <div id="login-main">
                <div id="login-block">
                    <div id="login-header">
                        <img alt="logo" id="logo" src="data/logo.svg">
                        <h1>{{appName}}</h1>
                        <div id="intro-text">
                            Introduce tu usuario y contraseña para 
                            <br>
                            CompactSCADA® {{appType}} ENERGY CONTROL
                        </div>
                    </div>
                    <form id="login-form">
                        
                        <div class="input-group input-item">
                        <i class="icon dripicons-user input-group-addon login-group-addon" aria-hidden="true"></i>
                        <input id="login-username"  type="text" placeholder="Usuario" value='{{username}}'>
                        </div>
                        
                        <div class="input-group input-item">
                        <i class="icon dripicons-lock input-group-addon login-group-addon" aria-hidden="true"></i>
                        <input id="login-password" type="password" placeholder="Contraseña" value='{{password}}'>
                        </div>
                        <button id="login-button" class="input-item" on-click="login">Login</button>
                    </form>
                
                    <div id="login-footer">
                        ¿Has olvidado tu contraseña?
                        <br>
                        Contacta <a href="mailto:info@greeneaglesolutions.com">info@greeneaglesolutions.com</a>
                    </div>
                </div>
            </div>
        `,
        data: {
            appName: undefined,
            appType: undefined,
            username: undefined,
            password: undefined
        }
    };
    
    function init(elem) {
        console.log("<login>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);

        $('#login-form').submit(false);

        const rootView = stateContainer.Static.Data['rootView']; 
        const appName = stateContainer.Static.Data.views[rootView].name;
        let appType = stateContainer.Static.Data.views[rootView].viewLevel;
        appType = appType === 'CCR' ?
                        'CENTRAL':
                        appType === 'ASSET' ?
                            'LOCAL':
                            '';
        ractive.set({appName, appType});                            
        
        ractive.on("login", function(){
            const username = ractive.get('username');
            const password = ractive.get('password');

            loginService.login(username, password)
            .then(response => {                
                return response.status === 200 ?
                    response.json():
                    Promise.reject(response);
            })
            .then(user => {                
                loginService.setLogin(user);
            })
            .catch((error) => {                
                if (error.status && error.status === 401) alert("Unauthorized");
                else {
                    console.error(error);
                    alert("Could not establish connection with login server");
                }
            });    

        });        
        console.log("</login>");
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}