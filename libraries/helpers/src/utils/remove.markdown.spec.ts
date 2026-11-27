import { removeMarkdown } from './remove.markdown';

describe('removeMarkdown', () => {
  it('should remove basic markdown', () => {
    const text = '**bold** _italic_ [link](https://example.com)';
    const result = removeMarkdown({ text });
    expect(result).toBe('bold italic link');
  });

  it('should preserve text matching "except" regex', () => {
    const text = 'Hello **world**, keep [[THIS]] but remove **that**';
    const result = removeMarkdown({
      text,
      except: [/\[\[.*?\]\]/g]
    });
    expect(result).toContain('[[THIS]]');
    expect(result).not.toContain('**world**');
    expect(result).not.toContain('**that**');
    // It should be 'Hello world, keep [[THIS]] but remove that'
    // Note: some markdown parsers might handle [[]] specially, but remove-markdown
    // usually removes single brackets if they look like links.
    expect(result.toLowerCase()).toContain('hello world');
    expect(result).toContain('[[THIS]]');
  });

  it('should handle multiple exceptions', () => {
    const text = 'Keep {1} and {2}, but remove **markdown**';
    const result = removeMarkdown({
      text,
      except: [/\{1\}/g, /\{2\}/g]
    });
    expect(result).toBe('Keep {1} and {2}, but remove markdown');
  });

  it('should return empty string for empty input', () => {
    expect(removeMarkdown({ text: '' })).toBe('');
  });

  it('should return same string if no markdown is present', () => {
    const text = 'Plain text here';
    expect(removeMarkdown({ text })).toBe(text);
  });

  it('should handle complex markdown', () => {
    const text = '# Header\n\n- List item 1\n- List item 2\n\n> Quote';
    const result = removeMarkdown({ text });
    expect(result).toContain('Header');
    expect(result).toContain('List item 1');
    expect(result).toContain('List item 2');
    expect(result).toContain('Quote');
    expect(result).not.toContain('#');
    expect(result).not.toContain('- ');
    expect(result).not.toContain('> ');
  });
});
