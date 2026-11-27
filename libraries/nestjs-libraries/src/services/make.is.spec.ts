import { makeId } from './make.is';

describe('makeId', () => {
  it('should generate a string of the correct length', () => {
    const lengths = [1, 10, 32, 100];
    lengths.forEach((len) => {
      const id = makeId(len);
      expect(id).toHaveLength(len);
    });
  });

  it('should only contain characters from the expected character set', () => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const id = makeId(1000);
    for (const char of id) {
      expect(possible).toContain(char);
    }
  });

  it('should generate different IDs on subsequent calls', () => {
    const id1 = makeId(32);
    const id2 = makeId(32);
    expect(id1).not.toBe(id2);
  });
});
