import test from "node:test"
import assert from "node:assert"
console.log('running tests...')
import {Event, Events} from './events'


let events: Events
test.describe('Event Tests', () => {
    test.beforeEach(() => {
        events = new Events()
    })

    test.it("Event Equals: False 1", fn => {
        const a = new Event("Hello", new Date(2024))
        const b = new Event("Goodbye", new Date(2024))
        assert.ok(!a.equals(b))
    })

    test.it("Event Equals: False 2", fn => {
        const a = new Event("Hello", new Date(2024, 1, 2))
        const b = new Event("Hello", new Date(2024, 1, 1))
        assert.ok(!a.equals(b))
    })

    test.it("Event Equals: True 1", fn => {
        const a = new Event("Hello", new Date(2024))
        assert.ok(a.equals(a))
    })

    test.it("Event Equals: True 2", fn => {
        const a = new Event("Hello", new Date(2024))
        const b = new Event("Hello", new Date(2024))
        assert.ok(a.equals(b))
    })

    test.it('Count Events: Zero', fn => {
        assert.ok(events.count() === 0)
    })

    test.it('Count Events: Normal 1', fn => {
        events.addEvent(new Event("hello", new Date(2024, 1, 2)))
        assert.ok(events.count() === 1)
    })

    test.it('Count Events: Normal 2', fn => {
        events.addEvent(new Event("hello", new Date(2023, 1, 2)))
        events.addEvent(new Event("hello", new Date(2024, 1, 2)))

        assert.ok(events.count() === 2)
    })


    test.it('Events includes: False 1', fn => {
        const e = new Event("Hello", new Date())
        assert.ok(!events.includes(e))
    })

    test.it('Events includes: False null', fn => {
        assert.ok(!events.includes(null))
    })

    test.it('Events includes: True 1', fn => {
        const e = new Event("Hello", new Date())
        events.addEvent(e)
        assert.ok(events.includes(e))
    })

    test.it('Events includes: True 2', fn => {
        const a = new Event("Hello", new Date())
        const b = new Event("Hello", new Date())
        events.addEvent(a)
        assert.ok(events.includes(b))
    })

    test.it('Events includes: True 3', fn => {
        const a = new Event("Hello", new Date())
        const b = new Event("Hello", new Date())
        b.description = "Something something ...."
        events.addEvent(a)
        assert.ok(events.includes(b))
    })

    test.it('Events includes: True 4', fn => {
        const a = new Event("Hello", new Date())
        events.addEvent(a)
        a.title = "Something something ...."
        assert.ok(events.includes(a))
    })


    test.it('Add Event: Normal Add 1', fn => {
        const e = new Event("Hello", new Date(2024, 0, 12))
        events.addEvent(e)
    
        assert.ok(events.count() === 1)
    })

    test.it('Add Event: Normal Add 2', fn => {
        const a = new Event("Hello 1", new Date(2024, 0, 12))
        const b = new Event("Hello 2", new Date(2023, 0, 12))
        const c = new Event("Hello 3", new Date(2024, 1, 12))

        events.addEvent(a)
        events.addEvent(b)
        events.addEvent(c)
    
        assert.ok(events.count() === 3)
    })


    test.it('Add Event: Duplicate', fn => {
        const a = new Event("Hello", new Date(2024, 0, 12))
        const b = new Event("Hello", new Date(2024, 0, 12))
        events.addEvent(a)
        events.addEvent(b)
    
        assert.ok(events.count() === 1)
    })

    test.it('Add Event: Null', fn => {
        events.addEvent(null)
        

        assert.ok(events.count() === 0)
    })


    test.it('Remove Event: Invalid 1', fn => {
        const a = new Event("Hello 1", new Date(2024, 0, 12))

        assert.doesNotThrow(() => events.removeEvent(a))
    })


    test.it('Remove Event: Null', fn => {
        assert.doesNotThrow(() => events.removeEvent(null))
    })

    test.it('Replace Event', fn => {
        const a = new Event('Dinner', new Date(2024, 1, 20, 19))
        const b = new Event('Movie', new Date(2024, 1, 20, 19))
        events.addEvent(a)

        const id = events.getId(a)

        events.replaceEvent(id, b)

        assert.ok(!events.includes(a) && events.includes(b) && events.count() === 1)

    })

    test.it('Stringify and back', fn => {
        const a = new Event("Hello 1", new Date(2024, 0, 12))
        const b = new Event("Hello 2", new Date(2023, 0, 12))
        const c = new Event("Hello 3", new Date(2024, 1, 12))

        events.addEvent(a)
        events.addEvent(b)
        events.addEvent(c)

        const eventsStr = events.stringify()
        events = new Events()

        events.from(eventsStr)
        assert.ok(events.count() === 3 && events.includes(a) && events.includes(b) && events.includes(c))
    })

})


