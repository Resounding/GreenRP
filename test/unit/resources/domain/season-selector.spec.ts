import {Season} from '../../../../src/resources/models/season';
import {Crops} from '../../../../src/resources/models/plant';
import {SeasonSelector} from '../../../../src/resources/services/domain/season-selector';

describe('season selector', () => {
    let selector:SeasonSelector,
        seasons:Season[] = [
            { name: "spring", year: 2017, week: 7 },
            { name: "summer", year: 2017, week: 20 },
            { name: "fall", year: 2017, week: 30 },
            { name: "winter", year: 2017, week: 47 }
        ],
        cropSeasons:Season[] = [
            { name: "spring", year: 2017, week: 7 },
            { name: "summer", year: 2017, week: 20 },
            { name: "fall", year: 2017, week: {
                Kalanchoe: 34,
                Mums: 30,
                Cyclamen: 30,
                Gerbera: 30
            } },
            { name: "winter", year: 2017, week: 47 }
        ];

    beforeEach(() => {
        selector = new SeasonSelector(seasons);
    });

    it('has a seasons property', () => {
        expect(selector.seasons.length).toEqual(seasons.length);
    });

    it('selects the right season', () => {
        const date = new Date(2017, 2, 7),
            m = moment(date),
            year = m.isoWeekYear(),
            week =  m.isoWeek();

        expect(year).toBe(2017);
        expect(week).toBe(10);

        const season = selector.get(date, Crops.Mums);

        expect(season.name).toBe('spring');
    });

    it('returns undefined if the selection is before the first season', () => {
        const date = new Date(2016, 0, 1),
            season = selector.get(date, Crops.Mums);

        expect(season).toBeUndefined();
    });

    it('selects the right season from year to year', () => {
        seasons = [
            { name: "spring", year: 2016, week: 6 },
            { name: "summer", year: 2016, week: 19 },
            { name: "fall", year: 2016, week: 29 },
            { name: "winter", year: 2016, week: 46 },
            { name: "spring", year: 2017, week: 7 },
            { name: "summer", year: 2017, week: 20 },
            { name: "fall", year: 2017, week: 30 },
            { name: "winter", year: 2018, week: 47 },
            { name: "spring", year: 2018, week: 7 },
            { name: "summer", year: 2018, week: 20 },
            { name: "fall", year: 2018, week: 30 },
            { name: "winter", year: 2018, week: 47 }
        ];
        selector = new SeasonSelector(seasons);

        const spring2016 = new Date(2016, 1, 10),
            summer2017 = new Date(2017, 6, 17),
            winter2018 = new Date(2018, 11, 30);

        let season = selector.get(spring2016, Crops.Mums);
        expect(season.name).toBe('spring');
        expect(season.year).toBe(2016);
        expect(season.week).toBe(6);

        season = selector.get(summer2017, Crops.Mums);
        expect(season.name).toBe('summer');
        expect(season.year).toBe(2017);
        expect(season.week).toBe(20);

        season = selector.get(winter2018, Crops.Mums);
        expect(season.name).toBe('winter');
        expect(season.year).toBe(2018);
        expect(season.week).toBe(47);
    });

    it('selects the right season when the week varies by crop', () => {
        selector = new SeasonSelector(cropSeasons);

        const date = new Date(2017, 6, 31);

        expect(moment(date).isoWeek()).toEqual(31);

        const mumSeason = selector.get(date, Crops.Mums),
            kalanchoeSeason = selector.get(date, Crops.Kalanchoe);

        expect(mumSeason.name).toEqual('fall');
        expect(kalanchoeSeason.name).toEqual('summer');
    });

    it('selects the previous winter over the New Year', () => {
        seasons = [
            {name: "winter", year: 2016, week: 40},
            {name: "spring", year: 2017, week: 7}
        ];
        selector = new SeasonSelector(seasons);
        const date = new Date(2016, 11, 31),
            m = moment(date),
            week = m.isoWeek(),
            year = m.isoWeekYear(),
            season = selector.get(date, Crops.Mums);

        expect(year).toEqual(2016);
        expect(week).toEqual(52);
        expect(season.name).toEqual('winter');
    });
});
