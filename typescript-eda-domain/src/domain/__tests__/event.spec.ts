import { Event } from '../event'

describe('Event', () => {
  it('should have a payload', () => {
    const event = new Event({ test: 'test' })
    expect(event.payload).toEqual({ test: 'test' })
  })
})
