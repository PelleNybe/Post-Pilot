import { AutopostActivity } from './autopost.activity';

describe('AutopostActivity', () => {
  const autopostService = {
    startAutopost: jest.fn(),
  };

  let activity: AutopostActivity;

  beforeEach(() => {
    jest.clearAllMocks();
    activity = new AutopostActivity(autopostService as any);
  });

  it('delegates autoPost(id) to AutopostService.startAutopost', async () => {
    autopostService.startAutopost.mockResolvedValue({ started: true });

    const result = await activity.autoPost('auto-123');

    expect(autopostService.startAutopost).toHaveBeenCalledWith('auto-123');
    expect(result).toEqual({ started: true });
  });
});
