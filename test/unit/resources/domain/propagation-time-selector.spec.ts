import {PropagationTimeSelector} from "../../../../src/resources/services/domain/propagation-time-selector";
import {PropagationTime} from "../../../../src/resources/models/propagation-time";
import {Season} from "../../../../src/resources/models/season";

class Plants {
    static Mums = '4.5" Mums';
    static Kalanchoe = '6" Kalanchoe';
    static Gerbera = '4.5" Gerbera';
    static Cyclamen = '4.5" Cyclamen';
}

describe('propagation time selector', () => {
    let selector:PropagationTimeSelector,
        season:Season = { name: "spring", year: 2017, week: 7 },
        propagationTimes:PropagationTime[] = [
            {
                year: 2017,
                plant: Plants.Mums,
                propagationTimes: {
                    spring: 2.4,
                    winter: 3,
                    fall: 2.6,
                    summer: 2.1
                }
            },
            {
                year: 2017,
                plant: Plants.Kalanchoe,
                propagationTimes: {
                    spring: 6.5,
                    winter: 7.5,
                    fall: 7,
                    summer: 6
                }
            },
            {
                year: 2017,
                plant: Plants.Gerbera,
                propagationTimes: {
                    spring: 3,
                    winter: 3,
                    fall: 3,
                    summer: 3
                }
            },
            {
                year: 2017,
                plant: Plants.Cyclamen,
                propagationTimes: {
                    spring: 5,
                    winter: 5,
                    fall: 5,
                    summer: 5
                }
            }
        ];

    beforeEach(() => {
        selector = new PropagationTimeSelector(propagationTimes);
    });

    it('selects the right time', () => {
        const time = selector.get(season, Plants.Mums);

        expect(time.year).toEqual(2017);
        expect(time.plant).toEqual(Plants.Mums);
        expect(time.propagationTimes.spring).toEqual(2.4);
        expect(time.propagationTimes.fall).toEqual(2.6);
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
