export function format24HourTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false})
}

export function format12HourTime(date: Date): string {
    let hours = date.getHours()
    let minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'pm' : 'am'
    hours = hours % 12 || 12
    const fMin = minutes < 10 ? '0' + minutes : minutes
    const formattedTime = hours + '.' + fMin + ampm
    return formattedTime
}

/** Combines a date with a time
 * @param dateString Example: 'Fri Feb 02 2024'
 * @param timeString Example: '15:35'
 * @returns A date object based on the date and time of the inputs
 */
export function combineDateWithTime(dateString: string, timeString: string): Date {
    console.log(timeString)
    const date = new Date(dateString).setHours(0, 0, 0, 0)
    const time = new Date('1970-01-01 ' + timeString + 'Z').getTime()

    return new Date(date + time)
}

export function monthYearString(year: number, month: number): string {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${monthNames[month]}, ${year}`
}

export function monthStringShort(month: number): string {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[month]
}

/** Gets the time from midnight in milliseconds
 */
export function getTimeFromMidnight(date: Date): number {
    return new Date(date).setFullYear(1970, 0, 1)
}