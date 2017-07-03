import { Notifications } from '../../services/notifications';
import { ChangePassword } from './change-password';
import {autoinject, bindable, computedFrom} from 'aurelia-framework';
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
    el:Element;

    constructor(private auth:Authentication, private database:Database, private dialogService:DialogService) { }

    attached() {
        this.router.routes.forEach(r => {
            // prevent duplicates
            if(this.authorizedRoutes.some(ar => r.moduleId === ar.moduleId)) return false;
            if(r.nav && (!Array.isArray(r.settings.roles) || r.settings.roles.some(this.auth.isInRole))) {
                this.authorizedRoutes.push(r);
            }
        });

        let $fixedMenu = $('#fixed-menu', this.el),
            $mainMenu = $('#main-menu', this.el);

        $mainMenu.visibility({
            once: false,
            onBottomPassed: () => $fixedMenu.transition('fade in'),
            onBottomPassedReverse: () => $fixedMenu.transition('fade out')
        });

        $('.dropdown', this.el).dropdown();
    }

    changePassword() {
        this.dialogService.open({ viewModel: ChangePassword })
            .whenClosed(response => {
                if(response.wasCancelled) return;

                Notifications.success('Password changed successfully');
            })
            .catch(Notifications.error);

    }

    logout() {
        this.auth.logout();
    }

    showCalculator() {
        this.dialogService.open({
            viewModel: Calculator
        }).whenClosed(response => {
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

    @computedFrom('auth.userInfo')
    get userName():string {
        if(!this.auth || !this.auth.userInfo) return '';
        return this.auth.userInfo.name;
    }

    get canCreateOrders():boolean {
        return this.auth.isInRole(Roles.ProductionManager) || this.auth.isInRole(Roles.Administrator);
    }

    get canSearch():boolean {
        return this.auth.isInRole(Roles.ProductionManager) || this.auth.isInRole(Roles.Administrator);
    }
}
