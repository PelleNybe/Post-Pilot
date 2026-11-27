/**
 * @jest-environment ./test/jsdom-no-canvas.env.js
 */
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { useCustomProviderFunction } from './use.custom.provider.function';

const mockFetch = jest.fn();

jest.mock('@postpilot/frontend/components/launches/helpers/use.integration', () => ({
  useIntegration: () => ({ integration: { id: 'int-1' } }),
}));

jest.mock('@postpilot/helpers/utils/custom.fetch', () => ({
  useFetch: () => mockFetch,
}));

describe('useCustomProviderFunction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('returns parsed JSON on 2xx responses and throws on non-2xx responses', async () => {
    let getter: ((funcName: string, data?: any) => Promise<any>) | undefined;

    const Harness = () => {
      const { get } = useCustomProviderFunction();
      getter = get;
      return null;
    };

    render(React.createElement(Harness));
    expect(getter).toBeDefined();

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue([{ id: 'board-1' }]),
    });
    await expect(getter!('boards', { q: 'test' })).resolves.toEqual([
      { id: 'board-1' },
    ]);

    mockFetch.mockResolvedValueOnce({ status: 400 });
    await expect(getter!('boards')).rejects.toThrow('Failed to fetch');

    mockFetch.mockResolvedValueOnce({ status: 199 });
    await expect(getter!('boards')).rejects.toThrow('Failed to fetch');
  });
});
