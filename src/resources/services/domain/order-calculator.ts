import {computedFrom} from 'aurelia-binding';
import {log} from '../log';
import {SeasonSelector} from "./season-selector";
import {TimeSelector} from "./time-selector";
import {SpaceCalculator} from './space-calculator';
import {CalculatorWeek, Events, Event} from './models/calculator-week';
import {CalculatorOrder} from './models/calculator-order';
import {CalculatorZone} from "./models/calculator-zone";
import {Zone} from '../../models/zone';
import {Season} from '../../models/season';
import {Week, WeekDocument, WeekZones} from '../../models/week';
import {Plant} from "../../models/plant";
import {SeasonTime} from "../../models/season-time";
import {CapacityWeek} from "../../models/capacity-week";
import {OrderDocument} from "../../models/order";

interface WeekMap {
    [id:string]: WeekDocument
}

let _order:CalculatorOrder,
    _weeks:CalculatorWeek[];

export class OrderCalculator {
    zones:CalculatorZone[];
    propagationZone:Zone;
    season:Season;
    seasonSelector:SeasonSelector;
    propagationTimeSelector:TimeSelector;
    flowerTimeSelector:TimeSelector;
    spaceCalculator:SpaceCalculator;

    constructor(zones:Zone[], private allWeeks:Map<string, CapacityWeek>, seasons:Season[], private propagationTimes:SeasonTime[], private flowerTimes:SeasonTime[], order?:OrderDocument) {
        _order = new CalculatorOrder(order);
        _weeks = [];

        this.zones = _.sortBy(zones, z => z.name.toLowerCase()).map(z => new CalculatorZone(z));
        this.propagationZone = _.find(zones, z => z.isPropagationZone);
        this.seasonSelector = new SeasonSelector(seasons);
        this.propagationTimeSelector = new TimeSelector(propagationTimes);
        this.flowerTimeSelector = new TimeSelector(flowerTimes);
        this.spaceCalculator = new SpaceCalculator(_order);

        if(order && _.isDate(order.arrivalDate)){
            this.setArrivalDate(order.arrivalDate);
        }
    }

    setArrivalDate(date:Date):OrderCalculator {
        _order.arrivalDate = date;
        this.resetFlowerDate();
        this.resetLightsOutDate();
        this.resetStickDate();
        this.resetWeeks();

        return this;
    }

    setPlant(plant:Plant):OrderCalculator {
        _order.plant = plant;
        this.resetFlowerDate();
        this.resetLightsOutDate();
        this.resetStickDate();
        this.resetWeeks();

        return this;
    }

    @computedFrom('order.quantity')
    get orderQuantity():number {
        let quantity = 0;

        if(_order) {
            quantity = numeral(_order.quantity).value();
        }
        return quantity;
    }

    set orderQuantity(quantity:number) {
        if(_order) {
            _order.quantity = numeral(quantity).value();
            this.resetWeeks();
        }
    }

    @computedFrom('order.plant')
    get potsPerCase():number {
        let potsPerCase = 0;

        if(_order && _order.plant) {
            potsPerCase = numeral(_order.plant.potsPerCase).value();
        }

        return potsPerCase;
    }

    set potsPerCase(potsPerCase:number) {
        if(_order && _order.plant) {
            _order.plant.potsPerCase = numeral(potsPerCase).value();
        }
    }

    @computedFrom('order.rootInPropArea')
    get rootInPropagationZone():boolean {
        return _order && _order.rootInPropArea;
    }

    set rootInPropagationZone(value:boolean) {
        if(_order) {
            _order.rootInPropArea = value;
            this.resetWeeks();
        }
    }

    setFlowerDate(date:Date):OrderCalculator {
        _order.flowerDate = date;
        this.resetWeeks();

        return this;
    }

    setLightsOutDate(date:Date):OrderCalculator {
        _order.lightsOutDate = date;
        this.resetStickDate();
        this.resetWeeks();

        return this;
    }

    setStickDate(date:Date):OrderCalculator {
        _order.stickDate = date;
        this.resetWeeks();

        return this;
    }

    get order():CalculatorOrder {
        return _order;
    }

    @computedFrom('plant', 'order.quantity', 'order.arrivalDate', 'order.flowerDate', 'order.lightsOutDate', 'order.stickDate', 'order.rootInPropArea')
    get weeks():CalculatorWeek[] {
        return _weeks;
    }

    public getOrderDocument() {
        return this.order.toOrderDocument(this.weeks);
    }

    private resetWeeks() {

        const weeks:CalculatorWeek[] = [],
            shipWeek = this.getShipWeek(),
            flowerWeek = this.getFlowerWeek(),
            lightsOutWeek = this.getLightsOutWeek(),
            stickWeek = this.getStickWeek();

        if(shipWeek) {
            const tables = this.spaceCalculator.getTables(shipWeek._id),
                zones = this.getZones(shipWeek, tables);
            weeks.push({
                week: shipWeek,
                events: [{
                    name: Events.ShipEventName,
                    date: _order.arrivalDate
                }],
                tables: tables,
                zones: zones
            });

            if(flowerWeek){
                const flowerEvent:Event = {
                    name: Events.FlowerEventName,
                    date: _order.flowerDate
                };
                if(flowerWeek._id === shipWeek._id) {
                    weeks[0].events.unshift(flowerEvent);
                } else {
                    const tables = this.spaceCalculator.getTables(flowerWeek._id),
                        zones = this.getZones(flowerWeek, tables);
                    weeks.unshift({
                        week: flowerWeek,
                        events: [flowerEvent],
                        tables: tables,
                        zones: zones
                    });
                }
            } else {
                log.debug('No flower week');
            }
        } else {
            log.debug('No ship week!');
        }

        if(lightsOutWeek) {
            const lightsOutDate = moment(_order.lightsOutDate),
                lightsOutId = lightsOutDate.toWeekNumberId(),
                flowerDate = moment(_order.flowerDate),
                loopDate = flowerDate.add(-1, 'week');
            while(loopDate.isSameOrAfter(lightsOutDate)) {
                let id = loopDate.toWeekNumberId(),
                    week = this.allWeeks.get(id);

                if(week) {
                    const tables = this.spaceCalculator.getTables(week._id),
                        zones = this.getZones(week, tables);
                    const calculatorWeek:CalculatorWeek = {
                        week: week,
                        events: [],
                        tables: tables,
                        zones: zones
                    };

                    if(week._id === lightsOutId) {
                        calculatorWeek.events.push({
                            name: _order.plant.hasLightsOut ? Events.LightsOutEventName : Events.SpacingEventName,
                            date: lightsOutDate.toDate()
                        });
                    }

                    weeks.unshift(calculatorWeek);
                }

                loopDate.add(-1, 'week');
            }
        } else {
            log.debug('No lights-out week');
        }

        if(stickWeek) {
            log.debug(`Stick Week: ${stickWeek._id}`);

            const season:Season = this.seasonSelector.get(_order.arrivalDate, _order.plant.crop);

            if(season) {
                const propagationTime = this.propagationTimeSelector.get(season, _order.plant.name);

                if(propagationTime) {
                    const
                        stickDate = moment(_order.stickDate),
                        lightsOutDate = moment(_order.lightsOutDate),
                        loopDate = lightsOutDate.add(-1, 'week');

                    while(loopDate.isSameOrAfter(stickDate)){
                        let id = loopDate.toWeekNumberId(),
                            week = this.allWeeks.get(id);

                        if(week) {
                            const tables = this.spaceCalculator.getTables(week._id),
                                zones = this.getZones(week, tables, true);
                            const calculatorWeek = {
                                week: week,
                                events: [],
                                tables: tables,
                                zones: zones
                            };

                            if(week._id === stickWeek._id) {
                                calculatorWeek.events.push({
                                    name: Events.StickEvent,
                                    date: stickDate.toDate()
                                });
                            }

                            weeks.unshift(calculatorWeek);
                        }

                        loopDate.add(-1, 'week');
                    }
                }
            }
        } else {
            log.debug('No stick week');
        }

        this.zones.forEach(z => z.weeks = weeks);
        _weeks = weeks;
    }

    private getShipWeek():Week {
        if(!_order.arrivalDate) {
            log.debug('No arrival date - ship week null');
            return null;
        }

        const id = moment(_order.arrivalDate).toWeekNumberId(),
            week = this.allWeeks.get(id);

        return week;
    }

    private resetFlowerDate():Date {
        let date:Date = null;

        if(_order.arrivalDate) {
            date = moment(_order.arrivalDate).add(-OrderCalculator.FLOWER_LEAD_TIME, 'days').toDate();
        }

        _order.flowerDate = date;
        return date;
    }

    private getFlowerWeek():Week {
        if(!_order.flowerDate) return null;

        const id = moment(_order.flowerDate).toWeekNumberId(),
            week = this.allWeeks.get(id);

        return week;
    }

    private resetLightsOutDate():Date {
        let date:Date = null;

        if(_order.flowerDate && _order.plant) {

            const season: Season = this.getSeason();

            if (!season) return null;

            const time: number = this.flowerTimeSelector.get(season, _order.plant.name);
            if (!time) return null;

            const lightsOutDate = moment(_order.flowerDate).addWeeksAndDays(-time);

            date = lightsOutDate.toDate();
        }

        _order.lightsOutDate = date;
        return date;
    }

    private getLightsOutWeek():Week {
        if(!_order.lightsOutDate) return null;

        const id = moment(_order.lightsOutDate).toWeekNumberId(),
            week = this.allWeeks.get(id);

        return week;
    }

    private resetStickDate():Date {
        let date:Date = null;

        if(_order.arrivalDate && _order.plant) {

            const season = this.getSeason();

            if (season) {

                const time = this.propagationTimeSelector.get(season, _order.plant.name);
                if (time) {

                    const lightsOut = moment(_order.lightsOutDate);

                    date = lightsOut.addWeeksAndDays(-time).toDate();
                }
            }
        }

        _order.stickDate = date;
        return date;
    }

    private getStickWeek():Week {
        const id = moment(_order.stickDate).toWeekNumberId(),
            week = this.allWeeks.get(id);

        return week;
    }

    private getSeason():Season {
        const season = this.seasonSelector.get(_order.arrivalDate, _order.plant.crop);
        return season;
    }

    private getZones(week:Week, tables:number, usePropZone:boolean = false):WeekZones {
        const zones = { },
            keys = Object.keys(week.zones);
        for(const key of keys) {
            const zone = _.clone(week.zones[key]),
                isPropZone = (this.propagationZone && key === this.propagationZone.name),
                noPropZone = !usePropZone || !this.order.rootInPropArea;
            
            // reduce the prop zone if you're using it, reduce anything else if you're not
            if((usePropZone && this.order.rootInPropArea && isPropZone) || (!isPropZone && noPropZone)) {
                zone.available -= tables;                                
            }

            if(usePropZone || !isPropZone) {
                zones[key] = zone;
            } else {
                zones[key] = null;
            }
        }
        return zones;
    }

    static FLOWER_LEAD_TIME:number = 4;
}
