/**
 * @jest-environment ./test/jsdom-no-canvas.env.js
 */
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { SafeHtml } from './safe.html';

describe('SafeHtml', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders plain text and strips unsafe tags like <script>', () => {
    const { container } = render(
      React.createElement(SafeHtml, {
        html: 'Hello <script>alert(1)</script> world',
      })
    );

    expect(container.innerHTML).not.toContain('<script>');
    expect(container.textContent).toContain('Hello');
    expect(container.textContent).toContain('world');
  });

  it('blocks javascript: anchor hrefs while rendering plain link text', () => {
    const { container } = render(
      React.createElement(SafeHtml, {
        html: '<a href="javascript:alert(1)">Click me</a>',
      })
    );

    expect(container.innerHTML).not.toContain('javascript:');
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('Click me');
  });

  it('preserves safe https links with noopener noreferrer and allowed formatting', () => {
    const { container } = render(
      React.createElement(SafeHtml, {
        html: '<strong>Bold</strong> <a href="https://example.com/docs">Docs</a>',
      })
    );

    expect(container.querySelector('strong')?.textContent).toBe('Bold');
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.com/docs');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('handles null and undefined html gracefully', () => {
    const { container } = render(React.createElement(SafeHtml, { html: null }));
    expect(container.innerHTML).toBe('<div></div>');
  });
});
