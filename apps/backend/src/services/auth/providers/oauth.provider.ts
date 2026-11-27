import { validateUrlForSSRF } from '@postpilot/helpers/utils/ssrf-validator';
import {
  AuthProvider,
  AuthProviderAbstract,
} from '@postpilot/backend/services/auth/providers.interface';

@AuthProvider({ provider: 'GENERIC' })
export class OauthProvider extends AuthProviderAbstract {
  private getConfig() {
    const {
      POSTPILOT_OAUTH_AUTH_URL,
      POSTPILOT_OAUTH_CLIENT_ID,
      POSTPILOT_OAUTH_CLIENT_SECRET,
      POSTPILOT_OAUTH_TOKEN_URL,
      POSTPILOT_OAUTH_USERINFO_URL,
      FRONTEND_URL,
    } = process.env;

    if (
      !POSTPILOT_OAUTH_USERINFO_URL ||
      !POSTPILOT_OAUTH_TOKEN_URL ||
      !POSTPILOT_OAUTH_CLIENT_ID ||
      !POSTPILOT_OAUTH_CLIENT_SECRET ||
      !POSTPILOT_OAUTH_AUTH_URL ||
      !FRONTEND_URL
    ) {
      throw new Error('POSTPILOT_OAUTH environment variables are not set');
    }

    return {
      authUrl: POSTPILOT_OAUTH_AUTH_URL,
      clientId: POSTPILOT_OAUTH_CLIENT_ID,
      clientSecret: POSTPILOT_OAUTH_CLIENT_SECRET,
      tokenUrl: POSTPILOT_OAUTH_TOKEN_URL,
      userInfoUrl: POSTPILOT_OAUTH_USERINFO_URL,
      frontendUrl: FRONTEND_URL,
    };
  }

  generateLink(): string {
    const { authUrl, clientId, frontendUrl } = this.getConfig();
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'openid profile email',
      response_type: 'code',
      redirect_uri: `${frontendUrl}/settings`,
    });

    return `${authUrl}?${params.toString()}`;
  }

  async getToken(code: string): Promise<string> {
    const { tokenUrl, clientId, clientSecret, frontendUrl } = this.getConfig();
    try { await validateUrlForSSRF(tokenUrl); } catch (e) { throw new Error('Invalid URL provided'); }
    const response = await fetch(`${tokenUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${frontendUrl}/settings`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token request failed: ${error}`);
    }

    const { access_token } = await response.json();
    return access_token;
  }

  async getUser(access_token: string): Promise<{ email: string; id: string }> {
    const { userInfoUrl } = this.getConfig();
    try { await validateUrlForSSRF(userInfoUrl); } catch (e) { throw new Error('Invalid URL provided'); }
    const response = await fetch(`${userInfoUrl}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`User info request failed: ${error}`);
    }

    const { email, sub: id } = await response.json();
    return { email, id };
  }
}
