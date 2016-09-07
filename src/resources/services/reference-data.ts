import {singleton} from 'aurelia-framework';
import {Week, WeekZones} from '../models/week';

@singleton()
export class ReferenceData {
    zones = {
        _id: 'zones',
        zones: [
            {"name": "A", "tables": 352, "autoSpace": false},
            {"name": "B/C", "tables": 112, "autoSpace": false},
            {"name": "D", "tables": 352, "autoSpace": false},
            {"name": "E", "tables": 185, "autoSpace": false},
            {"name": "F", "tables": 405, "autoSpace": false},
            {"name": "G", "tables": 278, "autoSpace": false}
        ]
    };

    plants = {
        _id: "plants",
        plants: [
        {
            "name": "4.5\" Kalanchoe",
            "size": "4.5",
            "cuttingsPerPot": 5,
            "potsPerCase": 8,
            "cuttingsPerTable": 100,
            "weeksFromLightsOutToFlower": 8
        },
        {
            "name": "6\" Kalanchoe",
            "size": "6",
            "cuttingsPerPot": 8,
            "potsPerCase": 6,
            "cuttingsPerTable": 120,
            "weeksFromLightsOutToFlower": 8
        },
        {
            "name": "4.5\" Mums",
            "size": "4.5",
            "cuttingsPerPot": 5,
            "potsPerCase": 8,
            "cuttingsPerTable": 100,
            "weeksFromLightsOutToFlower": 9
        },
        {
            "name": "6\" Mums",
            "size": "6",
            "cuttingsPerPot": 8,
            "potsPerCase": 6,
            "cuttingsPerTable": 120,
            "weeksFromLightsOutToFlower": 9
        }
    ]
    };

    customers = {
        _id: 'customers',
        customers: [
            {"name": "Fall Festival", "abbreviation": "FF"},
            {"name": "Wegner's", "abbreviation": "WG"}
        ]
    };

    propagationTimes = {
        _id: 'propagation-times',
        propagationTimes: [
            {
                "plant": "4.5\" Kalanchoe",
                "year": 2016,
                "propagationTimes": [{"spring": 2.8}, {"winter": 3.2}, {"fall": 2.8}, {"summer": 2.0}]
            },
            {
                "plant": "6\" Kalanchoe",
                "year": 2016,
                "propagationTimes": [{"spring": 2.8}, {"winter": 3.2}, {"fall": 2.8}, {"summer": 2.0}]
            },
            {
                "plant": "4.5\" Mums",
                "year": 2016,
                "propagationTimes": [{"spring": 2.8}, {"winter": 3.2}, {"fall": 2.8}, {"summer": 2.0}]
            },
            {
                "plant": "6\" Mums",
                "year": 2016,
                "propagationTimes": [{"spring": 2.8}, {"winter": 3.2}, {"fall": 2.8}, {"summer": 2.0}]
            },
            {
                "plant": "4.5\" Kalanchoe",
                "year": 2017,
                "propagationTimes": [{"spring": 2.8}, {"winter": 3.2}, {"fall": 2.8}, {"summer": 2.0}]
            },
            {
                "plant": "6\" Kalanchoe",
                "year": 2017,
                "propagationTimes": [{"spring": 2.8}, {"winter": 3.2}, {"fall": 2.8}, {"summer": 2.0}]
            },
            {
                "plant": "4.5\" Mums",
                "year": 2017,
                "propagationTimes": [{"spring": 2.8}, {"winter": 3.2}, {"fall": 2.8}, {"summer": 2.0}]
            },
            {
                "plant": "6\" Mums",
                "year": 2017,
                "propagationTimes": [{"spring": 2.8}, {"winter": 3.2}, {"fall": 2.8}, {"summer": 2.0}]
            }
        ]
    };

    seasons = {
        _id: 'seasons',
        seasons: [
            {"name": "fall", "year": 2016, "week": 2016.39},
            {"name": "winter", "year": 2016, "week": 2016.50},
            {"name": "spring", "year": 2017, "week": 2017.13},
            {"name": "summer", "year": 2017, "week": 2017.21},
            {"name": "fall", "year": 2017, "week": 2017.39},
            {"name": "winter", "year": 2017, "week": 2017.50}
        ]
    };

    get weeks():Week[] {
        const start = moment().startOf('isoWeek'),
            zones:WeekZones =  {
            A: {
                zone: {
                    name: 'A',
                        tables: 352,
                        autoSpace: false
                },
                available: 50
            },
            'B/C': {
                zone: {
                    name: 'B/C',
                        tables: 126,
                        autoSpace: false
                },
                available: 20
            },
            D: {
                zone: {
                    name: 'D',
                        tables: 154,
                        autoSpace: false
                },
                available: 50
            },
            E: {
                zone: {
                    name: 'E',
                        tables: 185,
                        autoSpace: false
                },
                available: 80
            },
            'F/G': {
                zone: {
                    name: 'F/G',
                        tables: 681,
                        autoSpace: true
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
