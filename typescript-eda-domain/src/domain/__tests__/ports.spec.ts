import { Ports } from '../ports'
import { Port } from '../port'

class TestPort implements Port {}

class TestPortImpl implements TestPort {}

describe('Ports', () => {
  beforeEach(() => {
    Ports.clear();
  });

  it('should set and get a port', () => {
    Ports.set(TestPort, new TestPortImpl());
    const port = Ports.get(TestPort);
    expect(port).toBeInstanceOf(TestPortImpl);
  });

  it('should throw an error if the port is not found', () => {
    expect(() => Ports.get(TestPort)).toThrow('Port TestPort not found');
  });
});
