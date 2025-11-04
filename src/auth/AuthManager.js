/**
 * AuthManager - Sistema de autenticação OAuth2
 * Suporta LinkedIn e Google
 */

export default class AuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.provider = null; // 'linkedin' | 'google'
    
    // Configurações OAuth (substitua com suas credenciais)
    this.config = {
      linkedin: {
        clientId: 'SEU_LINKEDIN_CLIENT_ID',
        redirectUri: window.location.origin + '/auth/callback',
        scope: 'r_liteprofile r_emailaddress',
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization'
      },
      google: {
        clientId: 'SEU_GOOGLE_CLIENT_ID',
        redirectUri: window.location.origin + '/auth/callback',
        scope: 'profile email',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
      }
    };
  }

  /**
   * Inicia fluxo de login com LinkedIn
   */
  loginWithLinkedIn() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.linkedin.clientId,
      redirect_uri: this.config.linkedin.redirectUri,
      scope: this.config.linkedin.scope,
      state: this.generateState()
    });

    window.location.href = `${this.config.linkedin.authUrl}?${params.toString()}`;
  }

  /**
   * Inicia fluxo de login com Google
   */
  loginWithGoogle() {
    const params = new URLSearchParams({
      client_id: this.config.google.clientId,
      redirect_uri: this.config.google.redirectUri,
      response_type: 'code',
      scope: this.config.google.scope,
      state: this.generateState(),
      access_type: 'offline',
      prompt: 'consent'
    });

    window.location.href = `${this.config.google.authUrl}?${params.toString()}`;
  }

  /**
   * Processa callback do OAuth
   */
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      console.error('[AuthManager] OAuth error:', error);
      return { success: false, error };
    }

    if (!code || !this.validateState(state)) {
      console.error('[AuthManager] Invalid callback parameters');
      return { success: false, error: 'Invalid parameters' };
    }

    // Aqui você deve trocar o code por um access_token no seu backend
    // NUNCA faça isso no frontend com client_secret
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, provider: this.provider })
      });

      const data = await response.json();
      
      if (data.success) {
        this.token = data.access_token;
        this.user = data.user;
        this.saveSession();
        return { success: true, user: this.user };
      }
      
      return { success: false, error: data.error };
    } catch (err) {
      console.error('[AuthManager] Token exchange failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Verifica se há sessão salva
   */
  checkSession() {
    const sessionData = localStorage.getItem('janus_session');
    if (!sessionData) return false;

    try {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      // Verificar se token não expirou (24h)
      if (now - session.timestamp > 24 * 60 * 60 * 1000) {
        this.logout();
        return false;
      }

      this.user = session.user;
      this.token = session.token;
      this.provider = session.provider;
      return true;
    } catch (err) {
      console.error('[AuthManager] Invalid session data:', err);
      this.logout();
      return false;
    }
  }

  /**
   * Salva sessão no localStorage
   */
  saveSession() {
    const sessionData = {
      user: this.user,
      token: this.token,
      provider: this.provider,
      timestamp: Date.now()
    };
    localStorage.setItem('janus_session', JSON.stringify(sessionData));
  }

  /**
   * Faz logout e limpa sessão
   */
  logout() {
    this.user = null;
    this.token = null;
    this.provider = null;
    localStorage.removeItem('janus_session');
    localStorage.removeItem('janus_oauth_state');
  }

  /**
   * Retorna usuário logado
   */
  getUser() {
    return this.user;
  }

  /**
   * Verifica se está autenticado
   */
  isAuthenticated() {
    return this.user !== null && this.token !== null;
  }

  /**
   * Gera estado aleatório para CSRF protection
   */
  generateState() {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('janus_oauth_state', state);
    return state;
  }

  /**
   * Valida estado do OAuth
   */
  validateState(state) {
    const savedState = localStorage.getItem('janus_oauth_state');
    localStorage.removeItem('janus_oauth_state');
    return state === savedState;
  }

  /**
   * Login de desenvolvimento (bypass OAuth)
   */
  devLogin(username = 'Developer') {
    this.user = {
      id: 'dev_' + Date.now(),
      name: username,
      email: 'dev@janusprotocol.com',
      picture: null
    };
    this.token = 'dev_token_' + Math.random().toString(36);
    this.provider = 'dev';
    this.saveSession();
    return { success: true, user: this.user };
  }
}
