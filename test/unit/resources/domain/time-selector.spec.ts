import {TimeSelector} from "../../../../src/resources/services/domain/time-selector";
import {Season} from "../../../../src/resources/models/season";
import {SeasonTime, SeasonTimeSeasons} from "../../../../src/resources/models/season-time";

class Plants {
    static Mums = '4.5" Mums';
    static Kalanchoe = '6" Kalanchoe';
    static Gerbera = '4.5" Gerbera';
    static Cyclamen = '4.5" Cyclamen';
}

describe('propagation time selector', () => {
    let selector:TimeSelector,
        season:Season = { name: "spring", year: 2017, week: 7 },
        propagationTimes:SeasonTime[] = [
            {
                year: 2017,
                plant: Plants.Mums,
                times: {
                    spring: 2.4,
                    winter: 3,
                    fall: 2.6,
                    summer: 2.1
                }
            },
            {
                year: 2017,
                plant: Plants.Kalanchoe,
                times: {
                    spring: 6.5,
                    winter: 7.5,
                    fall: 7,
                    summer: 6
                }
            },
            {
                year: 2017,
                plant: Plants.Gerbera,
                times: {
                    spring: 3,
                    winter: 3,
                    fall: 3,
                    summer: 3
                }
            },
            {
                year: 2017,
                plant: Plants.Cyclamen,
                times: 5
            }
        ];

    beforeEach(() => {
        selector = new TimeSelector(propagationTimes);
    });

    it('selects the right time', () => {
        const time:number = selector.get(season, Plants.Mums);

        expect(time).toEqual(2.4);
    });

    it('selects the right time if the times are a number', () => {
        const time:number = selector.get(season, Plants.Cyclamen);

        expect(time).toEqual(5);
    });

    it('returns undefined if the plant isn\'t found', () => {
        const time = selector.get(season, 'Not there!');

        expect(time).toBeUndefined();
    });

    it('returns undefined if the season isn\'t found', () => {
        season.year = 2020;

        const time = selector.get(season, Plants.Mums);

        expect(time).toBeUndefined();
    });
});
