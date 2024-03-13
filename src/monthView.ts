import { format12HourTime, monthStringShort, monthYearString } from "./time";
import { Event, Events } from './events'
import { Observer, Subject } from "./observer";
import { CalendarView } from "./calendarView";

import './monthView.css'

export default class MonthView implements Observer, CalendarView {
    private events: Events
    private calTitle: HTMLElement
    private datesDiv: HTMLElement
    private maxEvents = 3 // displayed per date
    private locale = 'en-GB'


    private viewedDate: Date
    private container: HTMLElement


    constructor(initialDate: Date, events: Events, containerId: string) {
        this.events = events
        this.container = document.getElementById(containerId)
        this.events.attachEventsObserver(this)
        this.viewedDate = initialDate

        this.init()
    }


    private init(): void {
        this.container.innerHTML = `<div class="month-view">
        <div class="cal-header">
          <div class="cal-days-div">
            <div class="cal-day-div">
              <p>SUN</p>
            </div>
            <div class="cal-day-div">
              <p>MON</p>
            </div>
            <div class="cal-day-div">
              <p>TUE</p>
            </div>
            <div class="cal-day-div">
              <p>WED</p>
            </div>
            <div class="cal-day-div">
              <p>THU</p>
            </div>
            <div class="cal-day-div">
              <p>FRI</p>
            </div>
            <div class="cal-day-div">
              <p>SAT</p>
            </div>
          </div>
        </div>
        <div class="cal-dates-div"></div>
      </div>
        </div>`

        this.calTitle = document.getElementById('calendar-title')
        this.datesDiv = document.querySelector('.cal-dates-div')

        for (let i = 0; i < 6 * 7; i++) {
            const calDateDiv = document.createElement('div')
            calDateDiv.className = 'cal-date-div'
            this.datesDiv.appendChild(calDateDiv)
        }
    }


    render(): void { this.renderDate(this.viewedDate) }

    renderScrollDate(amount: number): void {
        this.renderDate(new Date(this.viewedDate.getFullYear(), this.viewedDate.getMonth() + amount, this.viewedDate.getDate()))
    }

    update(subject: Subject): void {
        this.renderEvents()
    }


    /** Creates all the content within the calendar dates div, only call on setup, prevMonth, nextMonth, currentMonth, or when the vast majority of the content gets changed. Do not call for minor changes. */
    public renderDate(month: Date) {
        const date = new Date(month.getFullYear(), month.getMonth(), 1)
        const dayOffset = date.getDay();

        // set calendar title
        this.calTitle.textContent = monthYearString(date.getFullYear(), date.getMonth())

        Array.from(this.datesDiv.children).forEach((dateDiv, i) => {
            dateDiv.addEventListener('mouseup', this.calendarDateDivMouseUp)

            let cDate = new Date(date.getFullYear(), date.getMonth(), i + 1 - dayOffset)
            let fDate = cDate.getDate().toString()
            if (i == 0 || fDate === '1') {
                fDate = monthStringShort(cDate.getMonth()) + ' ' + fDate
            }

            dateDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <p class="cal-date-title">${fDate}</p>
                <div class="current-date-icon"></div>
            </div>
            <div class="cal-events-div"></div>
            `

            // can retrieve data value from div in the future
            dateDiv.setAttribute('data-date', `${cDate.toDateString()}`)

        })

        // add events
        this.renderEvents()


        // highlight current day
        const curDay = document.querySelector(`[data-date="${new Date().toDateString()}"]`)
        if (curDay) {
            const c = (curDay as HTMLElement)
            c.classList.add('current-date')
        }

        this.viewedDate = month
    }


    /** Renders all events. Clears current events, adds all events from event data. Only call if all events are likely to change. For example: if loading event data. */
    private renderEvents() {
        Array.from(this.datesDiv.children).forEach((dateDiv, i) => {
            // get date str
            const dateStr = dateDiv.getAttribute('data-date')

            this.renderEventsOnDate(dateStr, dateDiv.querySelector('.cal-events-div'))
        })
    }

    /** Renders events on a date. */
    private renderEventsOnDate(dateStr: string, div: HTMLElement): void {
        // if date is not valid return early
        if (!new Date(dateStr)) return;

        // get events
        const datedEvents = this.events.getEventsFromDate(dateStr)

        // if no events on the date, return early
        if (!datedEvents) return;

        // clear events div
        div.innerHTML = ''

        // add events
        if (datedEvents.length <= this.maxEvents) {
            datedEvents.forEach((event, index) => {
                div.appendChild(this.createEventDiv(event, dateStr, index))
            })
        } else {
            datedEvents.slice(0, this.maxEvents - 1).forEach((event, index) => {
                div.appendChild(this.createEventDiv(event, dateStr, index))
            })
            div.appendChild(this.createEventOverflowDiv(datedEvents.length - 2))
        }

    }

    /** Creates HTML event div of given date, using the datestr to reference the position of the event in data */
    private createEventDiv(event: Event, dateStr: string, index: number): HTMLElement {
        const eventDiv = document.createElement('div')
        eventDiv.className = 'cal-event-div'
        eventDiv.setAttribute('data-event-id', [dateStr, index].join(','))
        eventDiv.onmouseup = this.calendarEventDivMouseUp
        eventDiv.innerHTML = `
    <p class="cal-event-time">${format12HourTime(event.startTime)}</p><p class="cal-event-title">${event.title}</p>
    `
        return eventDiv
    }

    /** Creates overflow div for any events that dont fit on the calendar view
     * @param o The number of events overflowing
     */
    private createEventOverflowDiv(o: number): HTMLElement {
        const div = document.createElement('div')
        div.className = 'cal-event-div cal-events-overflow'
        div.innerHTML = `<p class="cal-event-title">+ ${o}</p>`
        return div
    }


    /** On calendar date div mouse up, highlight date, and display in sidebar */
    private calendarDateDivMouseUp(ev: MouseEvent) {
        // get calendar date div
        const calDateDiv = ev.currentTarget as HTMLElement

        // // get date
        const date = new Date(calDateDiv.getAttribute('data-date'))

    }

    /** On calendar event div clicked */
    private calendarEventDivMouseUp = (ev: MouseEvent) => {
        // get event div
        const eventDiv = ev.currentTarget as HTMLElement

        // get event from the event id attribute
        const id = eventDiv.getAttribute('data-event-id').toString()
        const date = new Date(eventDiv.parentElement.parentElement.getAttribute('data-date'))

        const selectedEventDiv = document.querySelector('.event-selected')

        // stops event div click event from happening
        ev.stopPropagation()

        const event = this.events.getEventFromId(id)

        const eventDetailsDiv = this.showEventDetailsPopup(event, eventDiv)
        eventDetailsDiv.style.top = eventDiv.getBoundingClientRect().top - eventDetailsDiv.clientHeight / 2 + 'px'

        if (date.getDay() < 2) {
            eventDetailsDiv.style.left = eventDiv.getBoundingClientRect().left + eventDiv.clientWidth + 10 + 'px'
        } else {
            eventDetailsDiv.style.left = eventDiv.getBoundingClientRect().left - eventDetailsDiv.clientWidth - 10 + 'px'
        }
    }

    /** displays event details popup using the event parameter
 * @returns The popup div, so it can be adjusted as need.
 */
    private showEventDetailsPopup(event: Event, eventDiv: HTMLElement): HTMLElement {
        const eventDetailsDiv = document.getElementById('event-details-popup')

        // display div
        eventDetailsDiv.style.visibility = 'visible'

        // reset position of div
        eventDetailsDiv.style.removeProperty('left')
        eventDetailsDiv.style.removeProperty('top')
        eventDetailsDiv.style.removeProperty('right')
        eventDetailsDiv.style.removeProperty('bottom')

        // get content elements of event details pop-up
        const title = document.getElementById('event-details-title')
        const time = document.getElementById('event-details-time')
        const description = document.getElementById('event-details-description')

        // set content to display event
        title.textContent = event.title
        time.textContent = event.startTime.toLocaleString(this.locale, { dateStyle: 'short', timeStyle: 'short', hour12: true })

        if (event.endTime) {
            time.textContent += ' - ' + event.endTime.toLocaleString(this.locale, { timeStyle: 'short', hour12: true })
        }

        description.textContent = event.description

        // returns div so div can be placed accordingly
        return eventDetailsDiv
    }
}