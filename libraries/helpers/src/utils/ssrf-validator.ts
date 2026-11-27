import { promisify } from 'util';
import dns from 'dns';

const lookup = promisify(dns.lookup);

/**
 * Validates a URL to prevent Server-Side Request Forgery (SSRF).
 * It checks the protocol, hostname, and resolves the hostname to ensure it doesn't point to a private/reserved IP.
 */
export async function validateUrlForSSRF(url: string): Promise<void> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Only http and https protocols are allowed');
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Block common internal hostnames
  const blockedHostnames = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0'];
  if (blockedHostnames.includes(hostname)) {
    throw new Error('Access to internal hostnames is restricted');
  }

  // Also check if the hostname itself looks like an IPv6 private address
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    const ip = hostname.slice(1, -1);
    if (isPrivateIp(ip, 6)) {
        throw new Error('Access to private/reserved IP addresses is restricted');
    }
  }

  try {
    const records = await lookup(parsedUrl.hostname, { all: true });
    if (!records.length) {
      throw new Error('Failed to resolve hostname');
    }
    for (const record of records) {
      if (isPrivateIp(record.address, record.family)) {
        throw new Error('Access to private/reserved IP addresses is restricted');
      }
    }
  } catch (e: any) {
    if (e.message?.includes('restricted')) {
      throw e;
    }
    throw new Error('Access restricted: hostname could not be safely resolved');
  }
}

function isPrivateIp(address: string, family: number): boolean {
  if (family === 4) {
    return isPrivateIPv4(address);
  } else if (family === 6) {
    const addr = address.toLowerCase();

    // Check for IPv4-mapped IPv6 (e.g., ::ffff:127.0.0.1 or ::ffff:7f00:1)
    if (addr.startsWith('::ffff:')) {
      const ipv4Part = addr.substring(7);
      if (ipv4Part.includes('.')) {
        return isPrivateIPv4(ipv4Part);
      } else if (ipv4Part.includes(':')) {
        // Hexadecimal IPv4 mapping (e.g., 7f00:1 -> 127.0.0.1)
        const hexParts = ipv4Part.split(':');
        if (hexParts.length === 2) {
          const hi = parseInt(hexParts[0], 16);
          const lo = parseInt(hexParts[1], 16);
          if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
            const mappedIpv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
            return isPrivateIPv4(mappedIpv4);
          }
        }
        return true;
      }
    }

    // ::1/128 (Loopback)
    if (addr === '::1' || addr === '0:0:0:0:0:0:0:1' || addr === '::') return true;

    // fc00::/7 (Unique Local Address)
    if (addr.startsWith('fc') || addr.startsWith('fd')) return true;

    // fe80::/10 (Link-Local Address)
    if (addr.startsWith('fe8') || addr.startsWith('fe9') || addr.startsWith('fea') || addr.startsWith('feb')) return true;
  }
  return false;
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4) return false;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;

  // 10.0.0.0/8 (Private-Use)
  if (parts[0] === 10) return true;

  // 172.16.0.0/12 (Private-Use)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16 (Private-Use)
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 169.254.0.0/16 (Link-Local)
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 0.0.0.0/8 (Current network)
  if (parts[0] === 0) return true;

  // 100.64.0.0/10 (Shared Address Space)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true;

  // 198.18.0.0/15 (Network Interconnect Device Benchmark Testing)
  if (parts[0] === 198 && parts[1] >= 18 && parts[1] <= 19) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (parts[0] >= 224 && parts[0] <= 239) return true;

  // 240.0.0.0/4 (Reserved)
  if (parts[0] >= 240) return true;

  return false;
}
