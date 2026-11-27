import { validateUrlForSSRF } from './ssrf-validator';
import dns from 'dns';

jest.mock('dns', () => ({
  lookup: jest.fn(),
}));

describe('validateUrlForSSRF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects non-http/https protocols', async () => {
    await expect(validateUrlForSSRF('file:///etc/passwd')).rejects.toThrow(
      'Only http and https protocols are allowed'
    );
  });

  it('rejects localhost and loopback hostnames', async () => {
    await expect(validateUrlForSSRF('http://localhost:3000/test')).rejects.toThrow(
      'internal hostnames'
    );
    await expect(validateUrlForSSRF('http://127.0.0.1/test')).rejects.toThrow(
      'internal hostnames'
    );
  });

  it('rejects DNS resolution returning private IPv4 or IPv4-mapped hex IPv6', async () => {
    (dns.lookup as unknown as jest.Mock).mockImplementation((_host, _opts, cb) => {
      cb(null, [{ address: '::ffff:7f00:1', family: 6 }]);
    });

    await expect(validateUrlForSSRF('https://evil.example.com')).rejects.toThrow(
      'private/reserved'
    );
  });

  it('fails closed when hostname cannot be resolved', async () => {
    (dns.lookup as unknown as jest.Mock).mockImplementation((_host, _opts, cb) => {
      cb(new Error('ENOTFOUND'), []);
    });

    await expect(validateUrlForSSRF('https://nonexistent.invalid')).rejects.toThrow(
      'could not be safely resolved'
    );
  });

  it('allows public IP resolution', async () => {
    (dns.lookup as unknown as jest.Mock).mockImplementation((_host, _opts, cb) => {
      cb(null, [{ address: '93.184.216.34', family: 4 }]);
    });

    await expect(validateUrlForSSRF('https://example.com')).resolves.toBeUndefined();
  });
});
