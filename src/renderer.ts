import './index.css';
import Event from './event'
import { format12HourTime, monthString, format24HourTime, getTimeFromMidnight, monthStringShort } from './time'

// get date today
const now = new Date()

// preferences
const locale = 'en-GB'

// data
let year = now.getFullYear()
let month = now.getMonth()
let events = new Map<string, Array<Event>>()
let selectedEvent: Event = null
let selectedDate: Date = now

// set up buttons and calendar
setup()


/** Sets up functionality for the application. This function is responsible for adding all event listeners, loading data, and rendering the calendar. */
function setup() {
    // save events to storage
    // document.getElementById('save-events-btn').onclick = saveEvents

    // load events from storage
    // document.getElementById('load-events-btn').onclick = loadEvents

    // prev month button
    document.getElementById('prev-month-btn').onmouseup = prevMonthBtnMouseUp

    // next month button 
    document.getElementById('next-month-btn').onmouseup = nextMonthBtnMouseUp

    // current month button
    document.getElementById('current-month-btn').onmouseup = currentMonthBtnMouseUp

    // set up default dialog behavior
    document.querySelectorAll('.dialog').forEach((dialog) => {
        const display = dialog.parentElement
        const blanket = display.querySelector('.blanket') as HTMLElement
        const closeBtn = dialog.querySelector('.dialog-close-btn') as HTMLElement

        closeBtn.onclick = () => {
            display.style.visibility = 'hidden'
        }

        blanket.onclick = () => {
            display.style.visibility = 'hidden'
        }

        document.addEventListener('keyup', (ev) => {
            if (ev.key === 'Escape') {
                display.style.visibility = 'hidden'
            }
        })

    })

    // view event close button
    document.getElementById('event-details-close-btn').onmouseup = () => {
        document.getElementById('event-details-popup').style.visibility = 'hidden'
    }

    // connect view event delete button function
    document.getElementById('event-details-delete-btn').onmouseup = eventDetailsDeleteBtnMouseUp

    // connect event details edit button function
    document.getElementById('event-details-edit-btn').onmouseup = eventDetailsUpdateBtnMouseUp

    // add hide event details mousedown listener
    document.addEventListener('mousedown', hideEventDetails);

    // connect add event form on submit listener
    (document.getElementById('add-event-form') as HTMLFormElement).onsubmit = addEventFormOnSubmit;

    // connect update event form on submit listener
    (document.getElementById('update-event-form') as HTMLFormElement).onsubmit = updateEventFormOnSubmit

    // connect infobar add event button on click listener
    document.getElementById('infobar-add-event-btn').onclick = addEventBtnClick

    // load events
    loadEvents()

    // render calendar
    renderCalendar()
    renderSidebar()

    const selectorDates = document.querySelector('.selector-dates-div')
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    for (let i = 0; i < 7; i++) {
        const p = document.createElement('p')
        p.textContent = days[i]
        selectorDates.appendChild(p)
    }

    const dayOffset = new Date(year, month, 1).getDay();

    for (let i = 0; i < 7 * 6; i++) {
        let cDate = new Date(year, month, i + 1 - dayOffset)
        const p = document.createElement('p')
        p.className = 'selector-date'
        p.textContent = cDate.getDate().toString()
        if (cDate.getMonth() !== month) {
            p.style.opacity = "70%"
        }
        if (cDate.getDate() === now.getDate()) {
            p.style.backgroundColor = 'blue'
            p.style.borderRadius = '50%'
        }
        selectorDates.appendChild(p)
    }
}

// load and save functions
/** save events to a .json file, by using an ipc channel to send the stringified events to the main process */
function saveEvents() {
    (window as any).electronAPI.saveData(JSON.stringify(Array.from(events.entries())))
}

/** load events from a .json file, by using an ipc channel to receive the stringified events from the main process */
function loadEvents() {
    (window as any).electronAPI.loadData()
        .then((res: string) => {
            console.log(res)
            events = new Map(JSON.parse(res))
            events.forEach((eventList, date) => {
                eventList.forEach((event) => {
                    event.startTime = new Date(event.startTime)
                    event.endTime = new Date(event.endTime)
                })
            })
            // render events
            renderEvents()
        })

}


/** Add event to the calendar, then save events
 * @param eventDate Date to add the event to
 * @param event  Event to be added to the calendar
  */
function addEvent(event: Event): void {
    const dateStr = event.startTime.toDateString()
    if (!events.get(dateStr)) {
        events.set(dateStr, [event])
    } else {
        events.get(dateStr).push(event)
    }
    sortEvents(events.get(dateStr))

    renderEventsOnDate(dateStr)

    // save data
    saveEvents()
}

/** Sorts events by time from midnight ascending
 * @param events events array is sorted in place
 */
function sortEvents(events: Array<Event>): void {
    events.sort((a, b) => getTimeFromMidnight(a.startTime) - getTimeFromMidnight(b.startTime))
}

/**Gets events from a specified date
 * @param dateStr Date string from calling date.toDateString(). Example 'Fri 1 March 2024'
 */
function getEventsFromDate(dateStr: string): Array<Event> {
    return events.get(dateStr)
}

// sidebar resize code
// const sidebar = document.getElementById('sidebar')
// const resizeHandle = document.getElementById('resize-handle')
// let resizing = false


// resizeHandle.addEventListener('mousedown', (ev) => {
//     resizing = true
//     window.addEventListener('mousemove', resize)
//     window.addEventListener('mouseup', stopResize)
// })


// function resize(ev: MouseEvent) {
//     if (resizing) {
//         const min = 360
//         const max = 360
//         const size = Math.min(Math.max(window.innerWidth - ev.clientX, min), max)
//         sidebar.style.width = size + 'px'
//         // document.getElementById("main").style.marginR = size + 'px'
//         document.body.style.cursor = 'ew-resize'
//     }
// }

// function stopResize(ev: MouseEvent) {
//     resizing = false
//     window.removeEventListener('mousemove', resize)
//     document.body.style.removeProperty('cursor')
// }


/** Refreshes the calendar to show the previous month */
function prevMonthBtnMouseUp() {
    month -= 1
    if (month < 0) {
        month = 11
        year -= 1
    }

    setSelectedDate(null)
    renderCalendar()
    renderSidebar()
}

/** Refreshes the calendar to show the next month */
function nextMonthBtnMouseUp() {
    month += 1
    if (month > 11) {
        month = 0
        year += 1
    }

    setSelectedDate(null)
    renderCalendar()
    renderSidebar()
}

/** Refreshes the calendar to show the current month. */
function currentMonthBtnMouseUp() {
    const curDate = new Date()
    month = curDate.getMonth()
    year = curDate.getFullYear()


    renderCalendar()
    renderSidebar()
    setSelectedDate(curDate)
}

/** Combines a date with a time
 * @param dateString Example: 'Fri Feb 02 2024'
 * @param timeString Example: '15:35'
 * @returns A date object based on the date and time of the inputs
 */
function combineDateWithTime(dateString: string, timeString: string): Date {
    console.log(timeString)
    const date = new Date(dateString).setHours(0, 0, 0, 0)
    const time = new Date('1970-01-01 ' + timeString + 'Z').getTime()

    return new Date(date + time)
}



/** On calendar date div mouse up, highlight date, and display in sidebar */
function calendarDateDivMouseUp(ev: MouseEvent) {
    // get calendar date div
    const calDateDiv = ev.currentTarget as HTMLElement

    // if div isnt an actual date, do nothing
    if (!calDateDiv.getAttribute('data-date')) return;

    // get date
    const date = new Date(calDateDiv.getAttribute('data-date'))

    // if event is selected, tr

    // if date is already selected display add event dialog else select the date
    if (selectedDate && date.getTime() === selectedDate.getTime() && !selectedEvent) {
        displayAddEventDialog()
    } else {
        setSelectedDate(date)
        setSelectedEvent(null)
    }

}


/** On calendar event div clicked */
function calendarEventDivMouseUp(ev: MouseEvent) {
    // get event div
    const eventDiv = ev.currentTarget as HTMLElement

    // get event from the event id attribute
    const id = eventDiv.getAttribute('data-event-id')
    const [dateStr, i] = id.split(',')

    const selectedEventDiv = document.querySelector('.event-selected')

    // if event is already selected, return early
    if (selectedEventDiv && selectedEventDiv !== eventDiv) return;

    // stops event div click event from happening
    ev.stopPropagation()

    const event = events.get(dateStr)[Number(i)]

    const eventDetailsDiv = showEventDetailsPopup(event, eventDiv)
    eventDetailsDiv.style.top = eventDiv.getBoundingClientRect().top - eventDetailsDiv.clientHeight / 2 + 'px'
    eventDetailsDiv.style.left = eventDiv.getBoundingClientRect().left + eventDiv.clientWidth + 10 + 'px'

    // set selected event as event
    setSelectedEvent(event)


    renderSidebar()
}

/** Call updateCalendar() and updateSidebar() sometime after this call. */
function setSelectedDate(date: Date) {
    // clear selected-date
    document.querySelectorAll('.date-selected').forEach((div) => {
        div.classList.remove('date-selected')
    })

    // set new selected date
    selectedDate = date

    // skip the rest if selected date is null (no date selected)
    if (!selectedDate) return

    // get date string
    const dateStr = date.toDateString()

    // select date
    document.querySelector(`[data-date='${dateStr}']`).classList.add('date-selected')

    renderSidebar()
}

function setSelectedEvent(event: Event): void {
    document.querySelectorAll('.event-selected').forEach(div => {
        div.classList.remove('event-selected')
    })

    if (!event) return;

    const dateStr = event.startTime.toDateString()
    const index = getEventsFromDate(event.startTime.toDateString()).indexOf(event, 0)

    const id = [dateStr, index.toString()].join(',')
    const eventDiv = document.querySelector(`[data-event-id='${id}']`)

    eventDiv.classList.add('event-selected')
}

function renderSidebar() {
    if (!selectedDate) return

    // format date text
    const dateText = selectedDate.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })

    // set date header
    document.getElementById('infobar-header-date').textContent = dateText

    // get and clear events div
    const infobarEventsDiv = document.getElementById('infobar-events-div')
    infobarEventsDiv.innerHTML = ''

    // draw events
    const events = getEventsFromDate(selectedDate.toDateString())
    if (events) {
        events.forEach((event) => {
            // create event info from template
            const eventDiv = document.createElement('div')

            // event div on mouse up event
            eventDiv.onmouseup = (ev) => {
                const eventDetails = showEventDetailsPopup(event, eventDiv)
                eventDetails.style.top = eventDiv.offsetTop + 'px'
                eventDetails.style.right = `calc(1vw + ${window.innerWidth - document.getElementById('sidebar').offsetLeft}px)`

            }

            const dur = Math.abs(getTimeFromMidnight(event.startTime) - getTimeFromMidnight(event.endTime)) / 3600000

            // set div classname
            eventDiv.className = 'infobar-event-div'
            // event div blueprint
            eventDiv.innerHTML = `
            <div class="infobar-flex">
                <p class="infobar-time">${event.startTime.toLocaleTimeString(locale, { timeStyle: 'short', hour12: true })}</p>
                <p class="infobar-title">${event.title}</p>
            </div>
            <p class="infobar-duration">${event.endTime ? Math.round(dur * 4) / 4 + 'hrs' : '‎'}</p>
            `
            infobarEventsDiv.appendChild(eventDiv)
        })
    }


}

/** Creates all the content within the calendar dates div, only call on setup, prevMonth, nextMonth, currentMonth, or when the vast majority of the content gets changed. Do not call for minor changes. */
function renderCalendar() {
    const dayOffset = new Date(year, month, 1).getDay();
    const calendarDatesDiv = document.querySelector('.cal-dates-div')

    // set calendar title
    document.getElementById('calendar-title').textContent = monthString(year, month)

    // clear calendar dates div content
    calendarDatesDiv.innerHTML = ''

    for (let i = 0; i < 6 * 7; i++) {
        const calDateDiv = document.createElement('div')
        calDateDiv.className = 'cal-date-div'

        // mousedown calendar date
        calDateDiv.addEventListener('mouseup', calendarDateDivMouseUp)

        let cDate = new Date(year, month, i + 1 - dayOffset)



        let fDate = cDate.getDate().toString()
        if (i == 0 || fDate === '1') {
            fDate = monthStringShort(cDate.getMonth()) + ' ' + fDate
        }


        calDateDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <p class="cal-date-title">${fDate}</p>
                <div class="current-date-icon"></div>
            </div>
            <div class="cal-events-div"></div>
            `

        

        // can retrieve data value from div in the future
        calDateDiv.setAttribute('data-date', `${cDate.toDateString()}`)

        calendarDatesDiv.appendChild(calDateDiv)
    }

    // add events
    renderEvents()


    // highlight current day
    const curDay = document.querySelector(`[data-date="${new Date().toDateString()}"]`)
    if (curDay) {
        const c = (curDay as HTMLElement)
        c.classList.add('current-date')
    }

    // selected date
    if (selectedDate) {
        const selectedDateDiv = document.querySelector(`[data-date="${selectedDate.toDateString()}"]`);
        (selectedDateDiv as HTMLElement).classList.add('date-selected')
    }
}

/** Creates HTML event div of given date, using the datestr to reference the position of the event in data */
function createEventDiv(event: Event, dateStr: string, index: number): HTMLElement {
    const eventDiv = document.createElement('div')
    eventDiv.className = 'cal-event-div'
    eventDiv.setAttribute('data-event-id', [dateStr, index].join(','))
    eventDiv.onmouseup = calendarEventDivMouseUp
    eventDiv.innerHTML = `
    <p class="cal-event-time">${format12HourTime(event.startTime)}</p><p class="cal-event-title">${event.title}</p>
    `
    return eventDiv
}

/** Creates overflow div for any events that dont fit on the calendar view
 * @param o The number of events overflowing
 */
function createEventOverflowDiv(o: number): HTMLElement {
    const div = document.createElement('div')
    div.className = 'cal-event-div cal-events-overflow'
    div.innerHTML = `<p class="cal-event-title">+ ${o}</p>`
    return div
}


/** Displays dialog when events btn is clicked */
function addEventBtnClick(ev: MouseEvent) {
    displayAddEventDialog()
}

function displayAddEventDialog() {
    const popup = document.getElementById('add-event-display')
    const addEventForm: HTMLFormElement = document.getElementById('add-event-form') as HTMLFormElement
    addEventForm.reset()
    popup.style.visibility = 'visible'
    document.getElementById('add-event-title').focus()
}

/** On Add Event Form submit, add the new event created from the add event form fields to the events variable */
function addEventFormOnSubmit() {
    const addEventForm = (document.getElementById('add-event-form') as HTMLFormElement)
    const data = new FormData(addEventForm)

    // required
    const title = data.get('title').toString()
    const startTime = combineDateWithTime(selectedDate.toDateString(), data.get('startTime').toString())

    // optional
    const endTimeStr = data.get('endTime').toString()
    const endTime = endTimeStr ? combineDateWithTime(selectedDate.toDateString(), endTimeStr) : null
    const description = data.get('description').toString()

    // create event using fields
    const event = new Event()
    event.title = title
    event.startTime = startTime
    event.endTime = endTime
    event.description = description


    addEvent(event)
    renderSidebar()

    // hide dialog
    document.getElementById('add-event-display').style.visibility = 'hidden'

    // prevent default behavior
    return false
}


/** On Update Event Form submit, use the input fields to update the event stored in the events variable */
function updateEventFormOnSubmit() {
    const updateEventForm = document.getElementById('update-event-form') as HTMLFormElement
    const data = new FormData(updateEventForm)

    // required
    const title = data.get('title').toString()
    const startTime = combineDateWithTime(selectedDate.toDateString(), data.get('startTime').toString())

    // optional
    const endTimeStr = data.get('endTime').toString()
    const endTime = endTimeStr ? combineDateWithTime(selectedDate.toDateString(), endTimeStr) : null
    const description = data.get('description').toString()


    selectedEvent.title = title
    selectedEvent.startTime = startTime
    selectedEvent.endTime = endTime
    selectedEvent.description = description

    document.getElementById('update-event-display').style.visibility = 'hidden'

    // refresh ui
    renderEventsOnDate(selectedEvent.startTime.toDateString())
    renderSidebar()

    // prevent default behavior
    return false
}

// view event functions


/** displays event details popup using the event parameter
 * @returns The popup div, so it can be adjusted as need.
 */
function showEventDetailsPopup(event: Event, eventDiv: HTMLElement): HTMLElement {
    selectedEvent = event
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
    time.textContent = event.startTime.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short', hour12: true })

    if (event.endTime) {
        time.textContent += ' - ' + event.endTime.toLocaleString(locale, { timeStyle: 'short', hour12: true })
    }

    description.textContent = event.description

    // returns div so div can be placed accordingly
    return eventDetailsDiv
}


function hideEventDetails(ev: MouseEvent) {
    const viewEventPopup = document.getElementById('event-details-popup');

    setSelectedEvent(null)

    if (!viewEventPopup.contains(ev.target as Node)) {
        // Hide the menus if visible
        viewEventPopup.style.visibility = 'hidden'
    }
}

/** Deletes the event displayed on the event details pop-up */
function eventDetailsDeleteBtnMouseUp() {
    const viewEventPopup = document.getElementById('event-details-popup');

    const eventsInDate = getEventsFromDate(selectedEvent.startTime.toDateString())

    // delete event
    eventsInDate.splice(eventsInDate.indexOf(selectedEvent, 0), 1)

    // refresh ui
    renderEventsOnDate(selectedEvent.startTime.toDateString())
    renderSidebar()

    // hide event details pop-up
    viewEventPopup.style.visibility = 'hidden'
}

/** Displays the edit details dialog for the event being displayed on the event details pop-up */
function eventDetailsUpdateBtnMouseUp(ev: MouseEvent) {
    const viewEventPopup = document.getElementById('event-details-popup');

    console.log('displaying update event dialog')

    // hide view event details popup
    viewEventPopup.style.visibility = 'hidden'

    // get input fields of update event form
    const updateEventDialog = document.getElementById('update-event-display')
    const title = document.getElementById('update-event-title')
    const startTime = document.getElementById('update-event-start-time')
    const endTime = document.getElementById('update-event-end-time')
    const description = document.getElementById('update-event-description')

    // required fields pre-fill
    title.setAttribute('value', selectedEvent.title)
    startTime.setAttribute('value', format24HourTime(selectedEvent.startTime))

    // optional fields pre-fill
    if (selectedEvent.endTime) {
        endTime.setAttribute('value', format24HourTime(selectedEvent.endTime))
    }

    if (selectedEvent.description) {
        description.setAttribute('value', selectedEvent.description)
    }

    // show update dialog and focus on the title input
    updateEventDialog.style.visibility = 'visible'
    title.focus()
}

/** Renders all events. Clears current events, adds all events from event data. Only call if all events are likely to change. For example: if loading event data. */
function renderEvents() {
    document.querySelectorAll('.cal-events-div').forEach((eventsDiv) => {
        // get date str
        const dateStr = eventsDiv.parentElement.getAttribute('data-date')

        renderEventsOnDate(dateStr)
    })
}

/** Renders events on a date. */
function renderEventsOnDate(dateStr: string): void {
    // if date is not valid return early
    if (!new Date(dateStr)) return;

    // get events div   
    const eventsDiv = document.querySelector(`[data-date='${dateStr}']`).querySelector('.cal-events-div')

    // get events
    const events = getEventsFromDate(dateStr)

    const maxEvents = 3

    // if no events on the date, return early
    if (!events) return;

    // clear events div
    eventsDiv.innerHTML = ''

    // add events
    if (events.length < 4) {
        events.forEach((event, index) => {
            eventsDiv.appendChild(createEventDiv(event, dateStr, index))
        })
    } else {
        events.slice(0, 2).forEach((event, index) => {
            eventsDiv.appendChild(createEventDiv(event, dateStr, index))
        })
        eventsDiv.appendChild(createEventOverflowDiv(events.length - 2))
    }

}
