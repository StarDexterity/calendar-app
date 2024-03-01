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

export function monthString(year: number, month: number): string {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${monthNames[month]}, ${year}`
}