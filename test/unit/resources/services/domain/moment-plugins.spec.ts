describe('moment week number', () => {

    it('plugs the functions in to moment', () => {
        let m = moment();
        expect(m.toWeekNumberId).toBeDefined();
        expect(m.addWeeksAndDays).toBeDefined();
    });

    describe('toWeekNumberId', () => {
        it('returns the correct year & week number as a string', () => {
            let m = moment([2016, 0, 5]),
                weekNumber = m.toWeekNumberId();

            expect(weekNumber).toBe('week:2016.1');
        });

        it('returns two-digit weeks', () => {
            let m = moment([2017, 9, 5]),
                weekNumber = m.toWeekNumberId();

            expect(m.isoWeek()).toEqual(40);

            expect(weekNumber).toBe('week:2017.40');
        });
    });

    describe('addWeeksAndDays', () => {
        let date;

        beforeEach(() => {
            date =  moment(new Date(2016, 6, 15));
        });

        it('adds the weeks', () => {
            const week = date.isoWeek();

            date.addWeeksAndDays(3);

            expect(date.isoWeek()).toEqual(week + 3);
        });

        it('subtracts the weeks if negative', () => {
            const week = date.isoWeek();

            date.addWeeksAndDays(-3);

            expect(date.isoWeek()).toEqual(week - 3);
        });

        it('adds the weeks & days', () => {
            const week = date.isoWeek();

            date.addWeeksAndDays(1.1);

            // 1 week + 1 days = 8d
            expect(date.toDate()).toEqual(new Date(2016, 6, 23));
        });

        it('subtracts the weeks & days if negative', () => {
            const week = date.isoWeek();

            date.addWeeksAndDays(-2.2);

            // 2 weeks + 2 days = 816
            expect(date.toDate()).toEqual(new Date(2016, 5, 29));
        });
    });
});
