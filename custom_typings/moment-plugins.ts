export {};

declare global {
    namespace moment {
        interface MomentStatic {
            toWeekNumberId(): string;
            toWeekNumber(): number;
            addWeeksAndDays():MomentStatic;
        }
    }
}
