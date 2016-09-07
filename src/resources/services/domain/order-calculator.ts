import {computedFrom} from 'aurelia-binding';
import {log} from '../log';
import {SeasonSelector} from "./season-selector";
import {TimeSelector} from "./time-selector";
import {SpaceCalculator} from './space-calculator';
import {CalculatorWeek, Events, Event} from './models/calculator-week';
import {Zone} from '../../models/zone';
import {Season} from '../../models/season';
import {OrderDocument} from "../../models/order";
import {Week, WeekDocument} from '../../models/week';
import {Plant} from "../../models/plant";
import {SeasonTime} from "../../models/season-time";

interface WeekMap {
    [id:string]: WeekDocument
}

const _order:OrderDocument = new OrderDocument();
let _weeks:CalculatorWeek[] = [];

export class OrderCalculator {
    zones:Zone[];
    season:Season;
    allWeeks:WeekMap = { };
    seasonSelector:SeasonSelector;
    propagationTimeSelector:TimeSelector;
    flowerTimeSelector:TimeSelector;
    spaceCalculator:SpaceCalculator;

    constructor(zones:Zone[], allWeeks:Week[], seasons:Season[], private propagationTimes:SeasonTime[], private flowerTimes:SeasonTime[]) {
        this.zones = _.sortBy(zones, z => z.name.toLowerCase());
        const sortedWeeks = _.sortBy(allWeeks, w => w.year * 100 + w.week);
        sortedWeeks.forEach(week => {
            this.allWeeks[week._id] = new WeekDocument(week);
        });
        this.seasonSelector = new SeasonSelector(seasons);
        this.propagationTimeSelector = new TimeSelector(propagationTimes);
        this.flowerTimeSelector = new TimeSelector(flowerTimes);
        this.spaceCalculator = new SpaceCalculator(_order);
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

    set orderQuantity(quantity:number) {
        _order.quantity = quantity;
        this.resetWeeks();
        return this;
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

    get order():OrderDocument {
        return _order;
    }

    @computedFrom('plant', 'order.quantity', 'order.arrivalDate', 'order.flowerDate', 'order.lightsOutDate', 'order.stickDate')
    get weeks():CalculatorWeek[] {
        return _weeks;
    }

    private resetWeeks() {

        const weeks:CalculatorWeek[] = [],
            shipWeek = this.getShipWeek(),
            flowerWeek = this.getFlowerWeek(),
            lightsOutWeek = this.getLightsOutWeek(),
            stickWeek = this.getStickWeek();

        if(shipWeek) {
            log.debug(`Ship Week: ${shipWeek._id}`);
            const tables = this.spaceCalculator.getTables(shipWeek._id);
            weeks.push({
                week: shipWeek,
                events: [{
                    name: Events.ShipEventName,
                    date: _order.arrivalDate
                }],
                tables: tables
            });

            if(flowerWeek){
                log.debug(`Flower week: ${flowerWeek._id}`);
                const flowerEvent:Event = {
                    name: Events.FlowerEventName,
                    date: _order.flowerDate
                };
                if(flowerWeek._id === shipWeek._id) {
                    weeks[0].events.unshift(flowerEvent);
                } else {
                    const tables = this.spaceCalculator.getTables(flowerWeek._id);
                    weeks.unshift({
                        week: flowerWeek,
                        events: [flowerEvent],
                        tables: tables
                    });
                }
            } else {
                log.debug('No flower week');
            }
        } else {
            log.debug('No ship week');
        }

        if(lightsOutWeek) {
            log.debug(`Lights-out week: ${lightsOutWeek._id}`);
            const lightsOutDate = moment(_order.lightsOutDate),
                lightsOutId = lightsOutDate.toWeekNumberId(),
                flowerDate = moment(_order.flowerDate),
                loopDate = flowerDate.add(-1, 'week');
            while(loopDate.isSameOrAfter(lightsOutDate)) {
                let id = loopDate.toWeekNumberId(),
                    week = this.allWeeks[id];

                if(week) {
                    const tables = this.spaceCalculator.getTables(week._id);
                    const calculatorWeek:CalculatorWeek = {
                        week: week,
                        events: [],
                        tables: tables
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
                            week = this.allWeeks[id];

                        if(week) {
                            const tables = this.spaceCalculator.getTables(week._id);
                            const calculatorWeek = {
                                week: week,
                                events: [],
                                tables: tables
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

        _weeks = weeks;
    }

    private getShipWeek():Week {
        if(!_order.arrivalDate) {
            log.debug('No arrival date - ship week null');
            return null;
        }

        const id = moment(_order.arrivalDate).toWeekNumberId(),
            week = this.allWeeks[id];

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
            week = this.allWeeks[id];

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
            week = this.allWeeks[id];

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
            week = this.allWeeks[id];

        return week;
    }

    private getSeason():Season {
        const season = this.seasonSelector.get(_order.arrivalDate, _order.plant.crop);
        return season;
    }

    static FLOWER_LEAD_TIME:number = 4;
}
