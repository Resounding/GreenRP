import {autoinject, bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Authentication} from '../../services/authentication';

@autoinject()
export class NavBar {
    @bindable router:Router;

    constructor(private element:Element, private auth:Authentication) { }

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

    get userName() {
        return (this.auth.userInfo || {}).name;
    }
}
