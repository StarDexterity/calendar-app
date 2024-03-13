import './index.css';
import { format12HourTime, monthYearString, format24HourTime, getTimeFromMidnight, monthStringShort, combineDateWithTime } from './time'
import { Events, Event } from './events';
import DateNavigator from './dateNavigator';
import MonthView from './monthView';
import { CalendarViewType, CalendarView } from './calendarView'
import * as chrono from 'chrono-node'


// preferences
const locale = 'en-GB'
const viewContainerId = 'calendar'

// data
const events: Events = new Events()
let selectedEvent: Event = null


const dateNav = new DateNavigator()

let currentView: CalendarView

// set up buttons and calendar
setup()


/** Sets up functionality for the application. This function is responsible for adding all event listeners, loading data, and rendering the calendar. */
function setup() {
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

    // add event
    document.getElementById('sidebar-add-event-btn').onmouseup = addEventBtnClick

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


    // connect view buttons on click listener
    document.querySelectorAll('.view-btn').forEach(btn => {
        (btn as HTMLElement).onmouseup = viewBtnClicked
    })

    // select month view
    document.querySelector('.view-btn[data-view="0"]').classList.add('view-selected')

    // default view (default today)
    currentView = new MonthView(new Date(), events, viewContainerId)
    
    // load events from storage and render view when ready
    loadEvents().then(res => {
        events.from(res)
        currentView.render()
    })

    // set up save functionality
    events.attachEventsObserver({
        update(subject) {
            (window as any).electronAPI.saveData(events.stringify())
        }
    })

    // date nav listener
    dateNav.attachEventsObserver({
        update(subject) {
            currentView.renderDate((subject as DateNavigator).selectedDate)
        }
    })

}

function switchViewType(viewType: CalendarViewType): void {
    document.getElementById('calendar').innerHTML = ''
    currentView = null

    switch (viewType) {
        case CalendarViewType.Day:
            break
        case CalendarViewType.Week:
            break
        case CalendarViewType.Month:
            currentView = new MonthView(dateNav.selectedDate, events, viewContainerId)
    }

    currentView?.render()
}

function viewBtnClicked(ev: MouseEvent) {
    const btn = ev.currentTarget as HTMLElement
    const view = parseInt(btn.getAttribute('data-view')) as CalendarViewType

    document.querySelectorAll('.view-btn').forEach(btn => {
        if (btn.classList.contains('view-selected')) {
            btn.classList.remove('view-selected')
        }
    })

    btn.classList.add('view-selected')
    switchViewType(view)
}

/** load events from a .json file, by using an ipc channel to receive the stringified events from the main process */
function loadEvents(): Promise<string> {
    return (window as any).electronAPI.loadData()
}

/** Refreshes the calendar to show the previous month */
function prevMonthBtnMouseUp() {
    dateNav.prevMonth()
    currentView.renderScrollDate(-1)
}

/** Refreshes the calendar to show the next month */
function nextMonthBtnMouseUp() {
    dateNav.prevMonth()
    currentView.renderScrollDate(1)
}

/** Refreshes the calendar to show the current month. */
function currentMonthBtnMouseUp() {
    dateNav.gotoToday()
    currentView.renderDate(new Date())
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

document.getElementById('add-event-start-time').addEventListener('input', (ev) => {
    const preview = document.getElementById('add-event-time-preview')
    preview.textContent = chrono.parseDate((ev.target as HTMLElement).value)?.toLocaleString()
    if (!preview.textContent) preview.textContent = 'Preview'
})

document.getElementById('add-event-end-time').addEventListener('input', (ev) => {
    const preview = document.getElementById('add-event-time-preview2')
    preview.textContent = ' - ' + chrono.parseDate((ev.target as HTMLElement).value)?.toLocaleString()
})


/** On Add Event Form submit, add the new event created from the add event form fields to the events variable */
function addEventFormOnSubmit() {
    const addEventForm = (document.getElementById('add-event-form') as HTMLFormElement)
    const data = new FormData(addEventForm)

    // required
    const title = data.get('title').toString()
    const startTime = chrono.parseDate(data.get('startTime').toString(), new Date(), {forwardDate: true})

    // optional
    const endTimeStr = data.get('endTime').toString()
    const endTime =  endTimeStr ? chrono.parseDate(endTimeStr, startTime, {forwardDate: true}): null
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