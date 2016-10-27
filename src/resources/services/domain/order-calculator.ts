import {computedFrom} from 'aurelia-binding';
import {log} from '../log';
import {SeasonSelector} from "./season-selector";
import {TimeSelector} from "./time-selector";
import {SpaceCalculator, TableSpaceResult} from './space-calculator';
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

    @computedFrom('order.partialSpace')
    get partialSpace():boolean {
        return _order && _order.partialSpace;
    }

    set partialSpace(value:boolean) {
        if(_order) {
            _order.partialSpace = value;
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

    @computedFrom('plant', 'order.quantity', 'order.arrivalDate', 'order.flowerDate', 'order.lightsOutDate', 'order.stickDate', 'order.rootInPropArea', 'order.partialSpace')
    get weeks():CalculatorWeek[] {
        return _weeks;
    }

    public getOrderDocument() {
        return this.order.toOrderDocument(this.weeks);
    }

    private resetWeeks() {

        let stickEventCreated = false,
            partialSpaceEventCreated = false,
            lightsOutEventCreated = false, 
            fullSpaceEventCreated = false,
            flowerEventCreated = false;

        const weeks:CalculatorWeek[] = [],
            shipWeek = this.getShipWeek(),
            flowerWeek = this.getFlowerWeek(),
            fullSpaceWeek = this.getFullSpaceWeek(),
            lightsOutWeek = this.getLightsOutWeek(),
            partialSpaceWeek = this.getPartialSpaceWeek(),
            stickWeek = this.getStickWeek();

        if(shipWeek) {
            log.debug(`Ship week: ${shipWeek._id}`);

            const tables = this.spaceCalculator.getTables(shipWeek._id),
                zones = this.getZones(shipWeek, tables),
                tableCount = typeof tables === 'number' ? tables : tables.manualSpacing;
            weeks.push({
                week: shipWeek,
                events: [{
                    name: Events.ShipEventName,
                    date: _order.arrivalDate
                }],
                tables: tableCount,
                zones: zones
            });

            if(flowerWeek) {
                const flowerEvent:Event = {
                    name: Events.FlowerEventName,
                    date: _order.flowerDate
                };
                if(flowerWeek._id === shipWeek._id) {
                    weeks[0].events.unshift(flowerEvent);
                    flowerEventCreated = true;
                } else {
                    const tables = this.spaceCalculator.getTables(flowerWeek._id),
                        tableCount = typeof tables === 'number' ? tables : tables.manualSpacing,
                        zones = this.getZones(flowerWeek, tables);
                    weeks.unshift({
                        week: flowerWeek,
                        events: [flowerEvent],
                        tables: tableCount,
                        zones: zones
                    });
                    flowerEventCreated = true;
                }
            } else {
                log.debug('No flower week');
            }
        } else {
            log.debug('No ship week!');
        }

        if(fullSpaceWeek) {
            log.debug(`Full space  week: ${fullSpaceWeek._id}`);
            
            const fullSpaceDate = moment(_order.lightsOutDate).add(1, 'week'),
                fullSpaceStartOfWeek = fullSpaceDate.clone().startOf('isoweek'),
                fullSpaceId = fullSpaceDate.toWeekNumberId(),
                loopDate = moment(_order.flowerDate).startOf('isoweek');
            while(loopDate.isSameOrAfter(fullSpaceStartOfWeek)) {
                let id = loopDate.toWeekNumberId(),
                    week = this.allWeeks.get(id);

                if(week) {
                    const isFullSpaceWeek = week._id === fullSpaceId; 
                        
                    let tables = this.spaceCalculator.getTables(week._id),
                        tableCount = typeof tables === 'number' ? tables : tables.manualSpacing,
                        zones = this.getZones(week, tables),
                        calculatorWeek:CalculatorWeek = {
                        week: week,
                        events: [],
                        tables: tableCount,
                        zones: zones
                    };

                    if(isFullSpaceWeek) {
                        calculatorWeek.events.push({
                            name: Events.FullSpaceEventName,
                            date: fullSpaceDate.toDate(),
                            readonly: true
                        });
                        fullSpaceEventCreated = true;
                    }

                    weeks.unshift(calculatorWeek);
                    
                    if(isFullSpaceWeek) {
                        // now add lights-out...
                        loopDate.subtract(1, 'week');
                        id = loopDate.toWeekNumberId(),
                        week = this.allWeeks.get(id);

                        if(week) {
                            tables = this.spaceCalculator.getTables(week._id);
                            tableCount = typeof tables === 'number' ? tables : tables.manualSpacing;
                            zones = this.getZones(week, tables);
                            calculatorWeek = {
                                week: week,
                                events: [
                                    {
                                        name: Events.LightsOutEventName,
                                        date: _order.lightsOutDate
                                    }
                                ],
                                tables: tableCount,
                                zones: zones
                            }

                            weeks.unshift(calculatorWeek);
                            lightsOutEventCreated = true;
                        }

                        // ... & partial space
                        loopDate.subtract(1, 'week');
                        id = loopDate.toWeekNumberId(),
                        week = this.allWeeks.get(id);

                        if(week) {
                            tables = this.spaceCalculator.getTables(week._id);
                            tableCount = typeof tables === 'number' ? tables : tables.manualSpacing;
                            zones = this.getZones(week, tables);
                            calculatorWeek = {
                                week: week,
                                events: [
                                    {
                                        name: Events.PartialSpaceEventName,
                                        date:fullSpaceDate.clone().subtract(2, 'weeks').toDate(),
                                        readonly: true
                                    }
                                ],
                                tables: tableCount,
                                zones: zones
                            }

                            weeks.unshift(calculatorWeek);
                            partialSpaceEventCreated = true;
                        }

                        // break out so it doesn't subtract another week
                        break;
                    }
                }

                loopDate.subtract(1, 'week');
            }
        } else if(lightsOutWeek) {
            log.debug(`Lights out week: ${lightsOutWeek._id}`);

            const lightsOutDate = moment(_order.lightsOutDate),
                lightsOutStartOfWeek = lightsOutDate.clone().startOf('isoweek'),
                lightsOutId = lightsOutDate.toWeekNumberId(),
                loopDate = moment(_order.flowerDate).add(-1, 'week');
            while(loopDate.isSameOrAfter(lightsOutStartOfWeek)) {
                let id = loopDate.toWeekNumberId(),
                    week = this.allWeeks.get(id);

                if(week) {
                    const tables = this.spaceCalculator.getTables(week._id),
                        tableCount = typeof tables === 'number' ? tables : tables.manualSpacing,
                        zones = this.getZones(week, tables);
                    const calculatorWeek:CalculatorWeek = {
                        week: week,
                        events: [],
                        tables: tableCount,
                        zones: zones
                    };

                    if(week._id === lightsOutId) {
                        calculatorWeek.events.push({
                            name: _order.plant.hasLightsOut ? Events.LightsOutEventName : Events.SpacingEventName,
                            date: lightsOutDate.toDate()
                        });
                    }

                    weeks.unshift(calculatorWeek);
                    lightsOutEventCreated = true;
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
                        stickDateStartOfWeek = stickDate.clone().startOf('isoweek'),
                        // if it's partial-spaced, the week after lights-out has already been added
                        lastDate = moment(_order.lightsOutDate).subtract(fullSpaceWeek ? 1 : 0, 'weeks'),
                        loopDate = lastDate.add(-1, 'week');

                    while(loopDate.isSameOrAfter(stickDateStartOfWeek)){
                        let id = loopDate.toWeekNumberId(),
                            week = this.allWeeks.get(id);

                        if(week) {
                            const tables = this.spaceCalculator.getTables(week._id),
                                tableCount = typeof tables === 'number' ? tables : tables.manualSpacing,
                                zones = this.getZones(week, tables, true);
                            const calculatorWeek = {
                                week: week,
                                events: [],
                                tables: tableCount,
                                zones: zones
                            };

                            if(week._id === stickWeek._id) {
                                calculatorWeek.events.push({
                                    name: Events.StickEvent,
                                    date: stickDate.toDate()
                                });
                                stickEventCreated = true;
                            }

                            weeks.unshift(calculatorWeek);
                        }

                        loopDate.add(-1, 'week');
                    }
                } else {
                    log.debug(`Propagation time not found for ${_order.plant.crop} in ${season.name}`);
                }
            } else {
                log.debug(`Season not found for ${_order.plant.crop} on ${_order.arrivalDate}`);
            }
        } else {
            log.debug('No stick week');
        }

        // if events overlaps another event's week, we'll put
        //  the event where it belongs
        if(stickWeek && !stickEventCreated) {
            const week = _.find(weeks, w => {
                return w.week._id === stickWeek._id;
            });
            if(week) {
                week.events.unshift({
                    name: Events.StickEvent,
                    date: _order.stickDate
                });
            }
        }
        if(partialSpaceWeek && !partialSpaceEventCreated) {
            const week = _.find(weeks, w => {
                return w.week._id === partialSpaceWeek._id;
            });
            if(week) {
                week.events.unshift({
                    name: Events.PartialSpaceEventName,
                    date: moment(_order.lightsOutDate).subtract(1, 'week').toDate()
                });
            }
        }
        if(lightsOutWeek && !lightsOutEventCreated) {
            const week = _.find(weeks, w => {
                return w.week._id === lightsOutWeek._id;
            });
            if(week) {
                const eventName = (_order.plant.hasLightsOut || _order.partialSpace) ? Events.LightsOutEventName : Events.SpacingEventName;
                week.events.unshift({
                    name: eventName,
                    date: _order.lightsOutDate
                });
            }
        }
        if(fullSpaceWeek && !fullSpaceEventCreated) {
            const week = _.find(weeks, w => {
                return w.week._id === fullSpaceWeek._id;
            });
            if(week) {
                week.events.unshift({
                    name: Events.FullSpaceEventName,
                    date: moment(_order.lightsOutDate).add(1, 'week').toDate()
                });
            }
        }
        if(flowerWeek && !flowerEventCreated) {
            const week = _.find(weeks, w => {
                return w.week._id === flowerWeek._id;
            });
            if(week) {
                week.events.unshift({
                    name: Events.FlowerEventName,
                    date: _order.flowerDate
                });
            }
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

    private getPartialSpaceWeek():Week {
        if(!_order.partialSpace || !_order.lightsOutDate) return null;

        const id = moment(_order.lightsOutDate).subtract(1, 'week').toWeekNumberId(),
        week = this.allWeeks.get(id);

        return week;
    }

    private getFullSpaceWeek():Week {
        if(!_order.partialSpace || !_order.lightsOutDate) return null;

        const id = moment(_order.lightsOutDate).add(1, 'week').toWeekNumberId(),
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

    private getZones(week:Week, tables:number|TableSpaceResult, usePropZone:boolean = false):WeekZones {
        const zones = { },
            keys = Object.keys(week.zones);
        for(const key of keys) {
            const zone = _.clone(week.zones[key]),
                tableCount = typeof tables === 'number' ? tables : (zone.zone.autoSpace ? tables.autoSpacing : tables.manualSpacing),
                isPropZone = (this.propagationZone && key === this.propagationZone.name),
                noPropZone = !usePropZone || !this.order.rootInPropArea;
            
            // reduce the prop zone if you're using it, reduce anything else if you're not
            if((usePropZone && this.order.rootInPropArea && isPropZone) || (!isPropZone && noPropZone)) {
                zone.available -= tableCount;
                zone.tables = tableCount;
            } else if(usePropZone && this.order.rootInPropArea && !isPropZone) {
                zone.tables = 0;
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
