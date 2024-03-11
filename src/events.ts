
import { Observer, Subject } from "./observer"
import { getTimeFromMidnight } from "./time"

export class Event {
    constructor(title: string, startTime: Date) {
        if (!title || !startTime) {
            throw new Error('Cannot construct event, improperly formed')
        }
        this.title = title
        this.startTime = startTime
    }

    public equals(otherObj: Event): boolean {
        return (this.title == otherObj.title 
            && this.startTime.toISOString() == otherObj.startTime.toISOString())
    }

    public getDateStr(): string {
        if (!this.startTime) return 

        return this.startTime.toDateString()
    }

    /** Title of the event (combination of title and start date, not including time, must be unique) */
    title: string

    /** Start date and time (if not all day) of the event */
    startTime: Date
    
    /** End date and time (if not all day) of the event. Optional. */
    endTime: Date
    
    /** Extra details or notes. Optional. */
    description: string

    /** Does the event occur for the whole day */
    allDay: boolean = false
}


export class Events implements Subject {
    private data: Map<string, Array<Readonly<Event>>>
    private observers: Array<Observer>

    constructor() {
        this.data = new Map()
        this.observers = new Array()
    }

    public count(): number {
        let c = 0
        this.data.forEach(e => {
            c += e.length
        })
        return c
    }

    /**Gets events from a specified date
    * @param dateStr Date string from calling date.toDateString(). Example 'Fri 1 March 2024'
    */
    public getEventsFromDate(dateStr: string): Readonly<Array<Readonly<Event>>> {
        if (!this.data.has(dateStr)) return []

        return Array.from(this.data.get(dateStr))
    }

    public addEvent(event: Event): void {
        if (!event) {
            console.log('null event cannot be added')
            return
        }

        // if date key is not in map, add it and set to empty array
        const dateStr = event.startTime.toDateString()
        if (!this.data.has(dateStr)) {
            this.data.set(dateStr, [])
        }

        if (this.includes(event)) {
            console.log('cannot add, event is already in data')
            return
        }
        
        const dateEvents = this.data.get(dateStr)
        dateEvents.push(event)
        this.sortEvents(dateStr)
        this.notify()
    }

    public includes(event: Event): boolean {
        if (!event) {
            console.log('Event is null')
            return
        }

        const dateStr = event.startTime.toDateString()
        const dateEvents = this.data.get(dateStr)
        return (dateEvents && dateEvents.findIndex((ev) => ev.equals(event)) !== -1)
    }

    public from(jsonText: string) {
        const events: Map<string, Array<Event>> = new Map(JSON.parse(jsonText))
        events.forEach((eventList, date) => {
            eventList.map((event) => {
                const e = event as Event
                e.startTime = new Date(event.startTime)
                if (event.endTime) e.endTime = new Date(event.endTime)
                return e
            })
        })
        this.data = new Map(events)
    }

    public stringify(): string {
        return JSON.stringify(Array.from(this.data.entries()))
    }

    public getId(event: Event): string {
        if (!this.includes(event)) {
            console.log('event not in data')
            return
        }

        const dateStr = event.startTime.toDateString()
        const index = this.data.get(dateStr).indexOf(event)
        return [dateStr, index].join(',')
    }

    /** Gets event from id: '[date string],[index]' */
    public getEventFromId(id: string): Readonly<Event> {
        const [dateStr, i] = id.split(',')
        const dateEvents = this.data.get(dateStr)
        if (!dateEvents || dateEvents.length <= Number(i)) {
            console.log('Id is not valid')
            return
        }

        return dateEvents[Number(i)]
    }

    /** Replaces or updates an event.
     * This operation has three steps, remove the old event, push the new event, and then sort the events.
     */
    public replaceEvent(eventIndex: string, event: Event): void {
        const [dateStr, i] = eventIndex.split(',')
        const dateEvents = this.data.get(dateStr)
        dateEvents.splice(Number(i), 1)

        dateEvents.push(event)
        this.sortEvents(dateStr)

        this.notify()
    }

    public removeEvent(event: Event): void {
        if (!this.includes(event)) {
            console.log('cannot remove, event not present')
            return
        }

        const dateEvents = this.data.get(event.startTime.toDateString())
        const eventIndex = dateEvents.findIndex(ev => ev.equals(event))
        this.data.get(event.startTime.toDateString()).splice(eventIndex, 1)

        this.notify()
    }

    /** Sorts events by time from midnight ascending
    * @param events events array is sorted in place
    */
    private sortEvents(dateStr: string): void {
        const dateEvents = this.data.get(dateStr)
        if (!dateEvents) {
            console.log('No events from that date, cannot sort')
            return
        }

        dateEvents.sort((a, b) => getTimeFromMidnight(a.startTime) - getTimeFromMidnight(b.startTime))
    }

    /** Observer will be notified when the events object is modified */
    public attachEventsObserver(observer: Observer): void {
        if (this.observers.includes(observer)) {
            console.log('attempted to attach an already attached observer')
            return
        }

        this.observers.push(observer)
    }

    /** Detaches registered observer from subject */
    public detach(observer: Observer): void {
        const observerIndex = this.observers.indexOf(observer)
        if (observerIndex == -1) {
            console.log('attempted to detach observer that has not been attached')
        }

        this.observers.splice(observerIndex, 1)
    }

    public notify(): void {
        this.observers.forEach(ob => ob.update(this))
    }
}
