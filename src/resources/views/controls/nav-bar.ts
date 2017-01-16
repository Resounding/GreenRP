import {autoinject, bindable} from 'aurelia-framework';
import {Router, RouteConfig} from 'aurelia-router';
import {DialogService} from 'aurelia-dialog';
import {Authentication, Roles} from '../../services/authentication';
import {Database} from '../../services/database';
import {Calculator} from '../calculator/calculator';
import {Search} from '../search/search';
import {log} from '../../services/log';

@autoinject()
export class NavBar {
    @bindable router:Router;
    authorizedRoutes:RouteConfig[] = [];
    year:number;

    constructor(private element:Element, private auth:Authentication, private database:Database, private dialogService:DialogService) { }

    attached() {
        this.router.routes.forEach(r => {
            // prevent duplicates
            if(this.authorizedRoutes.some(ar => r.moduleId === ar.moduleId)) return false;
            if(!Array.isArray(r.settings.roles) || r.settings.roles.some(this.auth.isInRole)){
                this.authorizedRoutes.push(r);
            }
        });

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

    showCalculator() {
        this.dialogService.open({
            viewModel: Calculator
        }).then(response => {
            if(response.wasCancelled) return;

            log.debug(response.output);
        })
    }

    showSearch() {
        let year:number = new Date().getFullYear();

        const params = this.router.currentInstruction.params;
        if('year' in params) {
            const yearParam:number = parseInt(params.year);
            if(!isNaN(yearParam)) {
                year = yearParam;
            }
        }


        this.dialogService.open({
            viewModel: Search,
            model: year
        });
    }

    get userName():string {
        if(!this.auth || !this.auth.userInfo) return '';
        return this.auth.userInfo.name;
    }

    get canCreateOrders():boolean {
        return this.auth.isInRole(Roles.Grower) || this.auth.isInRole(Roles.Administrator);
    }
}
