import { ValueObject } from '../value-object'

class TestValueObject extends ValueObject<string> {
  constructor(props: string) {
    super(props)
  }
}

describe('ValueObject', () => {
  it('should be equal to another value object with the same props', () => {
    const vo1 = new TestValueObject('test')
    const vo2 = new TestValueObject('test')
    expect(vo1.equals(vo2)).toBe(true)
  })

  it('should not be equal to another value object with different props', () => {
    const vo1 = new TestValueObject('test1')
    const vo2 = new TestValueObject('test2')
    expect(vo1.equals(vo2)).toBe(false)
  })

  it('should not be equal to null', () => {
    const vo1 = new TestValueObject('test');
    expect(vo1.equals(null as any)).toBe(false);
  });

  it('should not be equal to undefined', () => {
    const vo1 = new TestValueObject('test')
    expect(vo1.equals(undefined)).toBe(false)
  })
})
