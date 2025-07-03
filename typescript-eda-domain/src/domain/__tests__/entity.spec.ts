import { Entity } from '../entity'

class TestEntity extends Entity<{ id: string }> {
  constructor(props: { id: string }) {
    super(props)
  }
}

describe('Entity', () => {
  it('should be equal to another entity with the same props', () => {
    const entity1 = new TestEntity({ id: '1' })
    const entity2 = new TestEntity({ id: '1' })
    expect(entity1.equals(entity2)).toBe(true)
  })

  it('should not be equal to another entity with different props', () => {
    const entity1 = new TestEntity({ id: '1' })
    const entity2 = new TestEntity({ id: '2' })
    expect(entity1.equals(entity2)).toBe(false)
  })
})
