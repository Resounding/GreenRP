import {autoinject, computedFrom} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
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
    private _repeatCount:number = 0;
    private _repeatDays:number = 1;
    private _isRepeatingOrder:boolean = false;
    private _zones:Zone[];
    private _seasons:Season[];
    private _weeks:Map<string, CapacityWeek> = new Map<string,CapacityWeek>();
    private _propagationTimes:SeasonTime[];
    private _flowerTimes:SeasonTime[];

    customers:Customer[];
    plants:Plant[];
    season:Season;
    calculator:OrderCalculator;
    repeatCalculators:OrderCalculator[] = [];
    partialSpace:boolean = false;

    constructor(private ordersService:OrdersService, private referenceService:ReferenceService, private capacityService:CapacityService,
                private dialogService:DialogService, private controller:DialogController, private element:Element,
                private events:EventAggregator) {
        controller.settings.lock = true;
        controller.settings.position = position;

        referenceService.customers().then(result => {
            this.customers = result;
        });
        referenceService.plants().then(result => {
            this.plants = result;
        });

        Promise.all([
            this.referenceService.seasons().then(result => {
                this._seasons = result;
            }),
            this.referenceService.zones().then(result => {
                this._zones = result;
            }),
            this.referenceService.propagationTimes().then(result => {
                this._propagationTimes = result;
            }),
            this.referenceService.flowerTimes().then(result => {
                this._flowerTimes = result;
            }),
            this.capacityService.getCapacityWeeks().then(result => {
                this._weeks = result;
            })
        ]).then(() => {
            this.calculator = this.createCalculator();
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

    @computedFrom('repeatCount', 'repeatDays')
    get numberRepeats():number {
        return this.repeatCalculators.length;
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

    createCalculator():OrderCalculator {
        return new OrderCalculator(this._zones, this._weeks, this._seasons, this._propagationTimes, this._flowerTimes);
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

    get isRepeatingOrder():boolean {
        return this._isRepeatingOrder;
    }

    set isRepeatingOrder(value:boolean) {
        this._isRepeatingOrder = value;

        if(!value) {
            this.repeatCount = 0;
        }
    }

    get repeatCount():number {
        return this._repeatCount;
    }
    set repeatCount(value:number) {
        value = numeral(value).value();

        if(value < 0) {
            value = 0;
        }

        this._repeatCount = value;

        this.repeatCalculators.length = value;

        for(let i=0; i < this.repeatCalculators.length; i++) {
            if(typeof this.repeatCalculators[i] === 'undefined') {
                const calculator = this.createCalculator();
                calculator.setArrivalDate(this.calculator.order.arrivalDate);
                calculator.setPlant(this.calculator.order.plant);
                this.repeatCalculators[i] = calculator;
            }
        }
    }

    get repeatDays():number {
        return this._repeatDays;
    }
    set repeatDays(value:number) {
        value = numeral(value).value();

        this._repeatDays = value;

        if(this.calculator.order.arrivalDate) {
            const firstArrival = moment(this.calculator.order.arrivalDate);
            this.repeatCalculators.forEach((calculator, index) => {
                const days = (index + 1) * value;
                calculator.setArrivalDate(firstArrival.clone().add(days, 'days').toDate());
            });

            this.repeatDays = this.repeatDays;
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
