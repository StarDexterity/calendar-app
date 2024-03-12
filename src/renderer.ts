import './index.css';
import { format12HourTime, monthYearString, format24HourTime, getTimeFromMidnight, monthStringShort, combineDateWithTime } from './time'
import Calendar from './calendar';
import { Events, Event } from './events';
import DateNavigator from './dateNavigator';

// preferences
const locale = 'en-GB'

// data
const events: Events = new Events()
let selectedEvent: Event = null


let viewLevel: string = 'month' // options: ['month', 'week', 'day']

const cal = new Calendar(events)
const dateNav = new DateNavigator()

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
    // document.getElementById('infobar-add-event-btn').onclick = addEventBtnClick

    // load events and render when ready
    loadEvents()

    // set up save functionality
    events.attachEventsObserver({
        update(subject) {
            (window as any).electronAPI.saveData(events.stringify())
        }
    })

    // date nav listener
    dateNav.attachEventsObserver({
        update(subject) {
            cal.renderMonth((subject as DateNavigator).selectedDate)
        }
    })

}

/** load events from a .json file, by using an ipc channel to receive the stringified events from the main process */
function loadEvents() {
    (window as any).electronAPI.loadData()
        .then((res: string) => {
            events.from(res)
            cal.renderMonth(new Date())
        })
}

/** Offset by month */
function getOffsetDate(date: Date, offsetMonth: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + offsetMonth, date.getDate())
}

/** Refreshes the calendar to show the previous month */
function prevMonthBtnMouseUp() {
    dateNav.prevMonth()
    cal.renderMonth(getOffsetDate(cal.monthViewed, -1))
}

/** Refreshes the calendar to show the next month */
function nextMonthBtnMouseUp() {
    dateNav.nextMonth()
    cal.renderMonth(getOffsetDate(cal.monthViewed, 1))
}

/** Refreshes the calendar to show the current month. */
function currentMonthBtnMouseUp() {
    dateNav.gotoToday()
}


function setSelectedEvent(event: Event): void {
    document.querySelectorAll('.event-selected').forEach(div => {
        div.classList.remove('event-selected')
    })

    if (!event) return;

    const dateStr = event.startTime.toDateString()
    const index = events.getEventsFromDate(event.startTime.toDateString()).indexOf(event, 0)

    const id = [dateStr, index.toString()].join(',')
    const eventDiv = document.querySelector(`[data-event-id='${id}']`)

    eventDiv.classList.add('event-selected')
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
    const event = new Event(title, startTime)
    event.endTime = endTime
    event.description = description

    events.addEvent(event)

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
    const e = new Event(title, startTime)

    // optional
    const endTimeStr = data.get('endTime').toString()
    e.endTime = endTimeStr ? combineDateWithTime(selectedDate.toDateString(), endTimeStr) : null
    e.description = data.get('description').toString()



    document.getElementById('update-event-display').style.visibility = 'hidden'

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

    // delete event
    events.removeEvent(selectedEvent)

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