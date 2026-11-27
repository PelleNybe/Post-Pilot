import { AuthMiddleware } from '@postpilot/backend/services/auth/auth.middleware';
import { AuthService } from '@postpilot/helpers/auth/auth.service';
import { HttpForbiddenException } from '@postpilot/nestjs-libraries/services/exception.filter';

describe('AuthMiddleware', () => {
  const mockOrgService = {
    getUserOrg: jest.fn(),
    getOrgsByUserId: jest.fn(),
    updateApiKey: jest.fn(),
  };
  const mockUserService = {};

  let middleware: AuthMiddleware;

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new AuthMiddleware(mockOrgService as any, mockUserService as any);
  });

  it('throws HttpForbiddenException when auth token is missing', async () => {
    const req: any = { headers: {}, cookies: {} };
    const res: any = {};
    const next = jest.fn();

    await expect(middleware.use(req, res, next)).rejects.toThrow(HttpForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws HttpForbiddenException when user is not activated', async () => {
    jest.spyOn(AuthService, 'verifyJWT').mockReturnValue({
      id: 'user-1',
      activated: false,
    } as any);

    const req: any = { headers: { auth: 'token' }, cookies: {} };
    const res: any = {};
    const next = jest.fn();

    await expect(middleware.use(req, res, next)).rejects.toThrow(HttpForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user and selected organization matching showorg header', async () => {
    jest.spyOn(AuthService, 'verifyJWT').mockReturnValue({
      id: 'user-1',
      activated: true,
      password: 'secret',
    } as any);

    mockOrgService.getOrgsByUserId.mockResolvedValue([
      { id: 'org-1', apiKey: 'key-1', users: [{ disabled: false }] },
      { id: 'org-2', apiKey: 'key-2', users: [{ disabled: false }] },
    ]);

    const req: any = {
      headers: { auth: 'valid-jwt', showorg: 'org-2' },
      cookies: {},
    };
    const res: any = {};
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.user.password).toBeUndefined();
    expect(req.org.id).toBe('org-2');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
