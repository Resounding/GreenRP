import {singleton} from 'aurelia-framework';
import {Week, WeekZones} from '../models/week';

@singleton()
export class ReferenceData {
    get weeks():Week[] {
        const start = moment().startOf('isoWeek'),
            zones:WeekZones =  {
            A: {
                zone: {
                    name: 'A',
                        tables: 352,
                        autoSpace: false,
                        isPropagationZone: false
                },
                available: 50
            },
            'B/C': {
                zone: {
                    name: 'B/C',
                        tables: 126,
                        autoSpace: false,
                        isPropagationZone: true
                },
                available: 20
            },
            D: {
                zone: {
                    name: 'D',
                        tables: 154,
                        autoSpace: false,
                        isPropagationZone: false
                },
                available: 50
            },
            E: {
                zone: {
                    name: 'E',
                        tables: 185,
                        autoSpace: false,
                        isPropagationZone: false
                },
                available: 80
            },
            'F/G': {
                zone: {
                    name: 'F/G',
                        tables: 681,
                        autoSpace: true,
                        isPropagationZone: false
                },
                available: 80
            }
        };

        return _.chain(_.range(0, 100))
            .map(idx => {
                const date = start.clone().add(idx, 'weeks');

                return {
                    _id: date.toWeekNumberId(),
                    year: date.isoWeekYear(),
                    week: date.isoWeek(),
                    zones: zones
                };
            })
            .value();
    }
}
