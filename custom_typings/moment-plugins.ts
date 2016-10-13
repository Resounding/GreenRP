export {};

declare global {
    namespace moment {
        interface Moment {
            toWeekNumberId(): string;
            toWeekNumber(): number;
            addWeeksAndDays():MomentStatic;
        }
    }
}
