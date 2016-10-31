import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogController, DialogService, DialogResult} from 'aurelia-dialog';
import {log} from '../../services/log';
import {ReferenceService} from '../../services/data/reference-service';
import {CapacityService} from '../../services/domain/capacity-service';
import {OrderCalculator} from '../../services/domain/order-calculator';
import {OrdersService} from "../../services/data/orders-service";
import {CalculatorZone} from "../../services/domain/models/calculator-zone";
import {Prompt} from '../controls/prompt';
import {ErrorNotification} from '../controls/error-notification';
import {Plant} from '../../models/plant';
import {Customer} from '../../models/customer';
import {Season} from '../../models/season';
import {Zone} from '../../models/zone';
import {SeasonTime} from '../../models/season-time';
import {CapacityWeek} from '../../models/capacity-week';

@autoinject()
export class Calculator {
    customers:Customer[];
    plants:Plant[];
    season:Season;
    calculator:OrderCalculator;
    partialSpace:boolean = false;

    constructor(private ordersService:OrdersService, referenceService:ReferenceService, capacityService:CapacityService,
                private dialogService:DialogService, private controller:DialogController, private element:Element) {
        controller.settings.lock = true;
        controller.settings.position = position;

        referenceService.customers().then(result => {
            this.customers = result;
        });
        referenceService.plants().then(result => {
            this.plants = result;
        });

        let zones:Zone[],
            seasons:Season[],
            weeks:Map<string, CapacityWeek> = new Map<string,CapacityWeek>(),
            propagationTimes:SeasonTime[],
            flowerTimes:SeasonTime[];
        Promise.all([
            referenceService.seasons().then(result => {
                seasons = result;
            }),
            referenceService.zones().then(result => {
                zones = result;
            }),
            referenceService.propagationTimes().then(result => {
                propagationTimes = result;
            }),
            referenceService.flowerTimes().then(result => {
                flowerTimes = result;
            }),
            capacityService.getCapacityWeeks().then(result => {
                weeks = result;
            })
        ]).then(() => {
            this.calculator = new OrderCalculator(zones, weeks, seasons, propagationTimes, flowerTimes);
        });


    }

    attached() {
        $('#customer', this.element).dropdown({
            onChange: (value:string) => {
                this.calculator.order.customer = _.find(this.customers, c => c.name === value);
            }
        });
        $('#plant', this.element).dropdown({
            onChange: this.onPlantChange.bind(this)
        });
        $('.calendar', this.element).calendar({
            type: 'date',
            onChange: this.onDateChange.bind(this)
        });
    }

    detached() {
        $('#customer', this.element).dropdown('destroy');
        $('.calendar', this.element).calendar('destroy');
    }

    @computedFrom('calculator.order.arrivalDate')
    get dateDisplay():string {
        let display = 'Choose Date';
        if(this.calculator && _.isDate(this.calculator.order.arrivalDate)) {
            display = moment(this.calculator.order.arrivalDate).format('ddd, MMM Do');
        }
        return display;
    }

    onPlantChange(value:string) {
        this.calculator.setPlant(_.find(this.plants, p => p.name === value));
        log.debug(this.season);
    }
    onDateChange(value:string) {
        this.calculator.setArrivalDate(moment(value).toDate());
        log.debug(this.season);
    }

    createOrder(zone:CalculatorZone) {
        let revision = 0;

        //noinspection JSUnusedLocalSymbols
        const saver = () => {
            this.calculator.order.zone = zone;

            this.ordersService.create(this.calculator.getOrderDocument())
                .then(result => {
                    this.controller.close(true, result);                    
                })
                .catch(error => {
                    log.error(error);
                    if(error.status === 409) {
                        // if this is the first conflict, prompt
                        if(revision === 0) {
                            const customer = this.calculator.order.customer.name,
                                date = moment(this.calculator.order.arrivalDate).format('MMM D, YYYY');
                            this.dialogService.open({ viewModel: Prompt, model: `There is already an order for ${customer} on ${date}. Would you like to continue creating this order?` })
                                .then((result:DialogResult) => {
                                    if(result.wasCancelled) return;

                                    //noinspection TypeScriptUnresolvedFunction
                                    recreate();
                                });
                        // if there are multiple conflicts, don't ask every time
                        } else {
                            //noinspection TypeScriptUnresolvedFunction
                            recreate();
                        }
                    } else {
                        this.dialogService.open({ viewModel: ErrorNotification, model: error.message })
                    }
                });
        },
        recreate = () => {
            const order = this.calculator.order;
            order._id = void 0;
            const id = this.calculator.getOrderDocument().toJSON()._id;

            revision++;
            this.calculator.order._id = `${id} (${revision})`;
            saver();
        };

        if(zone.canFit) {
            saver();
        } else {
            this.dialogService.open({ viewModel: Prompt, model: `This order will put zone ${zone.name} over capacity. Are you sure you want to schedule this order?` })
                .then((result:DialogResult) => {
                    if(result.wasCancelled) return;

                    saver();
                });
        }
    }
}

function position(modalContainer:Element) {
    const $container = $(modalContainer),
        $aiFooter = $container.find('ai-dialog-footer'),
        $aiBody = $container.find('ai-dialog-body'),
        footerHeight = $aiFooter.outerHeight(),
        bodyHeight = `calc(100% - ${footerHeight}px)`;

    $aiBody.css({ height: bodyHeight });
}
