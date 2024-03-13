export enum CalendarViewType {
    Month,
    Week,
    Day
}

export interface CalendarView {
    render(): void;
    renderDate(date: Date): void;
    renderScrollDate(amount: number): void;
}