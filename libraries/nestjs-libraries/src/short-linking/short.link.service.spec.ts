import { ShortLinkService } from '@postpilot/nestjs-libraries/short-linking/short.link.service';
import { Empty } from '@postpilot/nestjs-libraries/short-linking/providers/empty';

describe('ShortLinkService', () => {
  const originalProvider = ShortLinkService.provider;

  afterEach(() => {
    ShortLinkService.provider = originalProvider;
    jest.restoreAllMocks();
  });

  it('returns false for askShortLinkedin when provider is Empty', () => {
    ShortLinkService.provider = new Empty();
    const service = new ShortLinkService();

    expect(service.askShortLinkedin(['Check https://example.com'])).toBe(false);
  });

  it('detects unshortened URLs when a short-link domain is configured', () => {
    const mockProvider = new Empty();
    mockProvider.shortLinkDomain = 'dub.sh';
    ShortLinkService.provider = mockProvider;
    const service = new ShortLinkService();

    expect(service.askShortLinkedin(['Visit https://example.com/post'])).toBe(true);
    expect(service.askShortLinkedin(['Visit https://dub.sh/abc'])).toBe(false);
    expect(service.askShortLinkedin(['No links here'])).toBe(false);
  });

  it('leaves messages unchanged when provider is Empty', async () => {
    ShortLinkService.provider = new Empty();
    const service = new ShortLinkService();

    const input = ['Hello https://example.com'];
    await expect(service.convertTextToShortLinks('id-1', input)).resolves.toEqual(input);
  });

  it('converts URLs using the configured short-link provider', async () => {
    const mockProvider = new Empty();
    mockProvider.shortLinkDomain = 'dub.sh';
    jest
      .spyOn(mockProvider, 'convertLinkToShortLink')
      .mockResolvedValue('https://dub.sh/xyz');
    ShortLinkService.provider = mockProvider;
    const service = new ShortLinkService();

    const result = await service.convertTextToShortLinks('post-1', [
      'Read https://example.com?a=1&amp;b=2 now',
    ]);

    expect(mockProvider.convertLinkToShortLink).toHaveBeenCalledWith(
      'post-1',
      'https://example.com?a=1&b=2'
    );
    expect(result).toEqual(['Read https://dub.sh/xyz now']);
  });
});
