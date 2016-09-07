import {Order} from "../../../../src/resources/models/order";
import {Spacings, SpacingOptions} from "../../models/plant";

export class SpaceCalculator {

    constructor(private order:Order) { }

    getTables(weekId:string):number {
        if(!this.order.stickDate || !this.order.plant) return 0;

        let loop = moment(this.order.stickDate).startOf('isoWeek'),
            spacingOption:SpacingOptions = <SpacingOptions>Spacings.Tight;

        if(this.order.lightsOutDate) {
            const lightsOutDate = moment(this.order.lightsOutDate).startOf('isoWeek');

            while(loop.isBefore(lightsOutDate)) {
                if(loop.toWeekNumberId() === weekId) {
                    return this.calculateTables(spacingOption);
                }
                loop.add(1, 'week');
            }
            spacingOption = <SpacingOptions>Spacings.Full;

            if(this.order.arrivalDate) {
                const arrivalDate = moment(this.order.arrivalDate).startOf('isoWeek');

                while(loop.isSameOrBefore(arrivalDate)) {
                    if(loop.toWeekNumberId() === weekId) {
                        return this.calculateTables(spacingOption);
                    }
                    loop.add(1, 'week');
                }
            }
        }

        return 0;
    }

    private calculateTables(spaceType:SpacingOptions):number {
        if(this.order.plant.cuttingsPerPot == 0) return 0;

        const potsPerTable:number = this.order.plant.cuttingsPerTable[spaceType] / this.order.plant.cuttingsPerPot;

        if(potsPerTable == 0) return 0;

        return Math.ceil(this.order.quantity / potsPerTable);
    }
}
