import {autoinject, bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {DialogService} from 'aurelia-dialog';
import {Authentication} from '../../services/authentication';
import {Database} from '../../services/database';
import {Calculator} from '../calculator/calculator';
import {log} from '../../services/log';

@autoinject()
export class NavBar {
    @bindable router:Router;

    constructor(private element:Element, private auth:Authentication, private database:Database, private dialogService:DialogService) { }

    attached() {
        let $fixedMenu = $('#fixed-menu', this.element),
            $mainMenu = $('#main-menu', this.element);

        $mainMenu.visibility({
            once: false,
            onBottomPassed: () => $fixedMenu.transition('fade in'),
            onBottomPassedReverse: () => $fixedMenu.transition('fade out')
        });

        $('.dropdown', this.element).dropdown();
    }

    logout() {
        this.auth.logout();
    }

    destroy() {
        this.database.destroy()
            .then(() => {
                this.database.init();
            });
    }

    showCalculator() {
        this.dialogService.open({
            viewModel: Calculator
        }).then(response => {
            if(response.wasCancelled) return;

            log.debug(response.output);
        })
    }

    get userName() {
        return (this.auth.userInfo || {}).name;
    }
}
