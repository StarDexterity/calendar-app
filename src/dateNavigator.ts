import { Observer, Subject } from "./observer";
import { monthYearString } from "./time";

export default class DateNavigator implements Subject {
    private _selectedDate: Date;

    public get selectedDate(): Date {
        return this._selectedDate;
    }

    private set selectedDate(val: Date) {
        // You can put breakpoints here
        this._selectedDate = val;
    }

    private offset: number

    private observers: Array<Observer>


    private datesDiv: HTMLElement
    private titleHeader: HTMLElement
    private upBtn: HTMLElement
    private downBtn: HTMLElement

    constructor() {
        this.datesDiv = document.querySelector('.datenav-dates-div')
        this.titleHeader = document.getElementById('datenav-title')
        this.upBtn = document.getElementById('datenav-up-btn')
        this.downBtn = document.getElementById('datenav-down-btn')

        this.upBtn.onmouseup = ev => {
            this.offset -= 1

            this.renderMonth()
        }


        this.downBtn.onmouseup = ev => {
            this.offset += 1

            this.renderMonth()
        }

        this.observers = new Array()
        this.selectedDate = new Date()
        this.offset = 0

        this.init()
    }

    private init() {
        this.datesDiv.innerHTML = ''

        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
        for (let i = 0; i < 7; i++) {
            const p = document.createElement('p')
            p.textContent = days[i]
            this.datesDiv.appendChild(p)
        }

        const dayOffset = this.selectedDate.getDay()

        for (let i = 0; i < 7 * 6; i++) {
            let cDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), i + 1 - dayOffset)
            const p = document.createElement('p')
            p.className = 'selector-date'
            p.onclick = ev => {
                this.selectedDate = new Date((ev.target as HTMLElement).getAttribute('data-date'))
                this.renderMonth()
                this.notify()
            }

            this.datesDiv.appendChild(p)
        }

        this.renderMonth()
    }

    private renderMonth() {
        const today = new Date()
        const offsetDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + this.offset, 1)
        const dayOffset = offsetDate.getDay()

        this.titleHeader.textContent = monthYearString(offsetDate.getFullYear(), offsetDate.getMonth())

        Array.from(this.datesDiv.children).slice(7).forEach((p, i) => {
            if (p.classList.contains('datenav-today')) {
                p.classList.remove('datenav-today')
            }

            if (p.classList.contains('datenav-selected')) {
                p.classList.remove('datenav-selected')
            }


            let cDate = new Date(offsetDate.getFullYear(), offsetDate.getMonth(), i + 1 - dayOffset)

            p.textContent = cDate.getDate().toString()
            p.setAttribute('data-date', cDate.toDateString())

            if (cDate.getMonth() !== offsetDate.getMonth()) {
                (p as HTMLElement).style.opacity = "70%"
            } else {
                (p as HTMLElement).style.opacity = "100%"
            }


            if (cDate.toDateString() === today.toDateString()) {
                p.classList.add('datenav-today')
            } else if (this.selectedDate.toDateString() === cDate.toDateString()) {
                p.classList.add('datenav-selected')
            }
        })
    }

    nextMonth() {
        this.offset += 1
        this.renderMonth()
    }

    prevMonth() {
        this.offset -= 1
        this.renderMonth()
    }

    gotoToday() {
        this.selectedDate = new Date()
        this.offset = 0
        this.renderMonth()
        this.notify()
    }

    attachEventsObserver(observer: Observer): void {
        if (this.observers.includes(observer)) {
            console.log('attempted to attach an already attached observer')
            return
        }

        this.observers.push(observer)
    }

    detach(observer: Observer): void {
        const observerIndex = this.observers.indexOf(observer)
        if (observerIndex == -1) {
            console.log('attempted to detach observer that has not been attached')
        }

        this.observers.splice(observerIndex, 1)
    }

    notify(): void {
        this.observers.forEach(ob => ob.update(this))
    }
}