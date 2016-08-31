import {SeasonSelector} from "./season-selector";
import {CalculatorWeek, Events, Event} from './models/calculator-week';
import {Zone} from '../../models/zone';
import {Season} from '../../models/season';
import {OrderDocument} from "../../models/order";
import {Week, WeekDocument} from '../../models/week';
import {Plant} from "../../models/plant";
import {PropagationTime} from "../../models/propagation-time";
import {PropagationTimeSelector} from "./propagation-time-selector";

interface WeekMap {
    [id:string]: WeekDocument
}

const _order:OrderDocument = new OrderDocument();

export class OrderCalculator {
    zones:Zone[];
    season:Season;
    allWeeks:WeekMap = { };
    seasonSelector:SeasonSelector;
    propagationTimeSelector:PropagationTimeSelector;

    constructor(zones:Zone[], allWeeks:Week[], seasons:Season[], private propagationTimes:PropagationTime[]) {
        this.zones = _.sortBy(zones, z => z.name.toLowerCase());
        const sortedWeeks = _.sortBy(allWeeks, w => w.year * 100 + w.week);
        sortedWeeks.forEach(week => {
            this.allWeeks[week._id] = new WeekDocument(week);
        });
        this.seasonSelector = new SeasonSelector(seasons);
        this.propagationTimeSelector = new PropagationTimeSelector(propagationTimes);
    }

    setArrivalDate(date:Date) {
        _order.arrivalDate = date;
    }

    setPlant(plant:Plant) {
        _order.plant = plant;
    }

    get order():OrderDocument {
        return _order;
    }

    get weeks():CalculatorWeek[] {
        const weeks = [],
            shipWeek = this.getShipWeek(),
            flowerWeek = this.getFlowerWeek(),
            lightsOutWeek = this.getLightsOutWeek(),
            stickWeek = this.getStickWeek();

        if(shipWeek) {
            weeks.push({
                week: shipWeek,
                events: [{
                    name: Events.ShipEventName,
                    date: _order.arrivalDate
                }]
            });
        }

        if(flowerWeek){
            const flowerEvent:Event = {
                name: Events.FlowerEventName,
                date: this.getFlowerDate()
            };
            if(flowerWeek._id === shipWeek._id) {
                weeks[0].events.unshift(flowerEvent);
            } else {
                weeks.unshift({
                    week: flowerWeek,
                    events: [flowerEvent]
                })
            }
        }

        if(lightsOutWeek) {
            const lightsOutDate = moment(this.getLightsOutDate()),
                lightsOutId = lightsOutDate.toWeekNumberId(),
                flowerDate = moment(this.getFlowerDate()),
                loopDate = flowerDate.add(-1, 'week');
            while(loopDate.startOf('week').isAfter(lightsOutDate.startOf('week'))) {
                let id = loopDate.toWeekNumberId(),
                    week = this.allWeeks[id];

                if(week) {
                    const calculatorWeek = {
                        week: week,
                        events: []
                    };

                    if(week._id === lightsOutId) {
                        calculatorWeek.events.push({
                            name: Events.LightsOutEventName,
                            date: lightsOutDate.toDate()
                        });
                    }

                    weeks.unshift(calculatorWeek);
                }

                loopDate.add(-1, 'week');
            }
        }

        if(stickWeek) {
            const season:Season = this.seasonSelector.get(_order.arrivalDate, _order.plant.crop);

            if(season) {
                const propagationTime = this.propagationTimeSelector.get(season, _order.plant.name);

                if(propagationTime) {
                    const
                        stickDate = moment(this.getStickDate()),
                        lightsOutDate = moment(this.getLightsOutDate()),
                        flowerDate = moment(this.getFlowerDate()),
                        lastEvent = lightsOutDate.isValid() ? lightsOutDate : flowerDate,
                        lastEventId = lastEvent.toWeekNumberId,
                        loopDate = lastEvent.add(-1, 'week');

                    while(loopDate.startOf('week').isAfter(stickDate.startOf('week'))){
                        let id = loopDate.toWeekNumberId(),
                            week = this.allWeeks[id];

                        if(week) {
                            const calculatorWeek = {
                                week: week,
                                events: []
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
        }

        return weeks;
    }

    private getShipWeek():Week {
        if(!_order.arrivalDate) return null;

        const id = moment(_order.arrivalDate).toWeekNumberId(),
            week = this.allWeeks[id];

        return week;
    }

    private getFlowerDate():Date {
        if(!_order.arrivalDate) return null;

        return moment(_order.arrivalDate).add(-OrderCalculator.FLOWER_LEAD_TIME, 'days').toDate();
    }

    private getFlowerWeek():Week {
        if(!_order.arrivalDate) return null;

        const id = moment(this.getFlowerDate()).toWeekNumberId(),
            week = this.allWeeks[id];

        return week;
    }

    private getLightsOutDate():Date {
        if(!this.getFlowerDate() || !_order.plant || !_order.plant.hasLightsOut) return null;

        const time = _order.plant.weeksFromLightsOutToFlower,
            lightsOutDate = moment(this.getFlowerDate()).addWeeksAndDays(-time);

        return lightsOutDate.toDate();
    }

    private getLightsOutWeek():Week {
        const date = this.getLightsOutDate();

        if(!date) return null;

        const id = moment(date).toWeekNumberId(),
            week = this.allWeeks[id];

        return week;
    }

    private getStickDate():Date {
        if(!_order.arrivalDate || !_order.plant) return null;

        const season = this.seasonSelector.get(_order.arrivalDate, _order.plant.crop);

        if(!season) return null;

        const propagationTime = this.propagationTimeSelector.get(season, _order.plant.name);
        if(!propagationTime) return null;

        const time = propagationTime.propagationTimes[season.name],
            previous = moment(this.getLightsOutDate() || this.getFlowerDate()),
            stickDate = previous.addWeeksAndDays(-time).toDate();

        return stickDate;
    }

    private getStickWeek():Week {
        const date = this.getStickDate();

        if(!date) return null;

        const id = moment(date).toWeekNumberId(),
            week = this.allWeeks[id];

        return week;
    }

    static FLOWER_LEAD_TIME:number = 4;
}
