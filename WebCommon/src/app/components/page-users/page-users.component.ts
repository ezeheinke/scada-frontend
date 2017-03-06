import Ractive from 'ractive';

import { UsersManagerService } from '../../services/users-manager.service';
import { ModalWindowService } from '../../services/modal-window.service';
const usersManager = UsersManagerService();
const modalWindow = ModalWindowService();

export function PageComponent() {             
    
    let ractive: IRactive = undefined;
    
    const ractiveData = {
        el: undefined,
        template: `            
            <div class="bottom-tab-view-container">

                <!-- Users list -->                
                <div class="content-container">
                    <div id="users-table">
                        <table class="table table-responsive custom-table-with-theme">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Full Name</th>
                                    <th>Claims</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{#users}}
                                <tr>
                                    <td>{{username}}</td>
                                    <td>{{fullname}}</td>
                                    <td>{{claims}}</td>
                                    <td>
                                        <button on-click="remove:{{username}}">Remove</button>
                                    </td>
                                </tr>
                                {{/users}}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Add user -->
                <div class="bottom-tab-bar responsive-large">
                    <div id="users-add">
                        {{#user}}
                        <div class="bottom-filter-wrapper">
                            <label for="date-range-input">Username</label>
                            <input id='date-range-input' type='text' placeholder="Username" class="input-field" value="{{username}}"/>
                        </div>
                        <div class="bottom-filter-wrapper">
                            <label for="date-range-input">Password</label>
                            <input id='date-range-input' type='password' placeholder="Password" class="input-field" value="{{password}}"/>
                        </div>
                        <div class="bottom-filter-wrapper">
                            <label for="date-range-input">Claims</label>
                            <input id='date-range-input' type='text' placeholder="Claims" class="input-field" value="{{claims}}"/>
                        </div>
                        <div class="bottom-filter-wrapper">
                            <label for="date-range-input">Full Name</label>
                            <input id='date-range-input' type='text' placeholder="Full Name" class="input-field" value="{{fullname}}"/>
                        </div>
                        {{/user}}
                        <div class="bottom-filter-button-wrapper">
                            <button id="generate-report-button" class="primary-button" on-click="add:{{user}}">
                                + Add User
                            </button>
                        </div>
                    </div>
                </div>

            </div>           
        `,
        data: {
            users: [],
            user: {
                username: undefined,
                password: undefined,
                fullname: undefined,
                claims: undefined,
            }
        }
    };
    
    function init(elem,resolve) {
        console.log("<page-blank>");
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);
        
        resolve(updateUsers());

        ractive.on('add', function(event, user){            
            if (user.username !=="" &&
                user.password !=="" &&
                user.fullname !=="" &&
                user.claims   !== "") {
                modalWindow.confirm(`Are you sure that you want to add ${user.username} to users database?`, function(){
                    usersManager.add(user)
                    .then(() => resolve(updateUsers()) );
                });
            }
            else {
                alert("You should fill all attributes");
            }
        });

        ractive.on('remove', function(event, username){
            modalWindow.confirm(`Are you sure that you want to remove ${username}?`, function(){
                usersManager.remove(username)
                .then(() => resolve(updateUsers()) );
            });
        });

        console.log("</page-blank>");
    }

    function updateUsers(){
        return usersManager.get().then(users => ractive.set('users', users) );
    }
    
    function clean() {
        ractive.teardown();
    }
    
    return {
        init,
        clean
    };
}