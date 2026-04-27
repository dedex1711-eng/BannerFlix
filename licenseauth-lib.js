// =====================================================
// LICENSEAUTH JAVASCRIPT LIBRARY
// =====================================================
// This is a JavaScript wrapper for the LicenseAuth API
// It communicates directly with https://licenseauth.help/api/1.2/

class LicenseAuth {
  constructor(appName, ownerid, secret, version) {
    this.appName = appName;
    this.ownerid = ownerid;
    this.secret = secret;
    this.version = version;
    this.sessionid = null;
    this.apiUrl = 'https://licenseauth.help/api/1.2/';
    
      appName: this.appName,
      ownerid: this.ownerid,
      version: this.version
    });
    
    // Inicializa automaticamente
    this.init();
  }

  // ===== FAZER REQUISIÇÃO =====
  async request(data) {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Erro ao processar resposta do servidor' };
      }
    } catch (err) {
      return { success: false, message: 'Erro de conexão: ' + err.message };
    }
  }

  // ===== INICIALIZAR =====
  async init() {
    const data = {
      type: 'init',
      name: this.appName,
      ownerid: this.ownerid
    };

    const response = await this.request(data);

    if (response.success) {
      this.sessionid = response.sessionid;
      return true;
    } else {
      return false;
    }
  }

  // ===== LOGIN COM CHAVE DE LICENÇA =====
  async login(licenseKey, callback) {
    if (!this.sessionid) {
      if (callback) {
        callback({ success: false, message: 'Sessão não inicializada' });
      }
      return;
    }

    // Gerar HWID do dispositivo
    const hwid = await this.gerarHWID();

    const data = {
      type: 'license',
      key: licenseKey,
      sessionid: this.sessionid,
      name: this.appName,
      ownerid: this.ownerid,
      hwid: hwid  // Envia HWID para o LicenseAuth
    };


    const response = await this.request(data);


    if (response.success) {
      
      // Detecta o nível baseado na chave
      let nivel = 'level1'; // padrão
      if (licenseKey.toLowerCase().includes('premium') || 
          licenseKey.toLowerCase().includes('anual') ||
          licenseKey.toLowerCase().includes('vitalicio')) {
        nivel = 'level2';
      }
      
      if (callback) {
        callback({
          success: true,
          token: licenseKey,
          user: {
            ...response.info,
            nivel: nivel
          }
        });
      }
    } else {
      if (callback) {
        callback({
          success: false,
          message: response.message || 'Chave de licença inválida'
        });
      }
    }
  }

  // ===== REGISTRAR COM CHAVE =====
  async register(username, password, licenseKey, callback) {
    if (!this.sessionid) {
      if (callback) {
        callback({ success: false, message: 'Sessão não inicializada' });
      }
      return;
    }

    const data = {
      type: 'register',
      username: username,
      pass: password,
      key: licenseKey,
      sessionid: this.sessionid,
      name: this.appName,
      ownerid: this.ownerid
    };

    const response = await this.request(data);

    if (response.success) {
      if (callback) {
        callback({
          success: true,
          token: licenseKey,
          user: response.info || {}
        });
      }
    } else {
      if (callback) {
        callback({
          success: false,
          message: response.message || 'Erro ao registrar'
        });
      }
    }
  }

  // ===== FAZER LOGIN COM USUÁRIO/SENHA =====
  async loginUser(username, password, callback) {
    if (!this.sessionid) {
      if (callback) {
        callback({ success: false, message: 'Sessão não inicializada' });
      }
      return;
    }

    const data = {
      type: 'login',
      username: username,
      pass: password,
      sessionid: this.sessionid,
      name: this.appName,
      ownerid: this.ownerid
    };

    const response = await this.request(data);

    if (response.success) {
      if (callback) {
        callback({
          success: true,
          token: username,
          user: response.info || {}
        });
      }
    } else {
      if (callback) {
        callback({
          success: false,
          message: response.message || 'Usuário ou senha inválidos'
        });
      }
    }
  }

  // ===== OBTER VARIÁVEL =====
  async getvar(varname) {
    if (!this.sessionid) {
      return null;
    }

    const data = {
      type: 'getvar',
      var: varname,
      sessionid: this.sessionid,
      name: this.appName,
      ownerid: this.ownerid
    };

    const response = await this.request(data);

    if (response.success) {
      return response.response;
    } else {
      return null;
    }
  }

  // ===== DEFINIR VARIÁVEL =====
  async setvar(varname, vardata) {
    if (!this.sessionid) {
      return false;
    }

    const data = {
      type: 'setvar',
      var: varname,
      data: vardata,
      sessionid: this.sessionid,
      name: this.appName,
      ownerid: this.ownerid
    };

    const response = await this.request(data);

    return response.success;
  }

  // ===== GERAR HWID (Device Fingerprint) =====
  async gerarHWID() {
    // Verifica se já tem um HWID salvo
    const saved = localStorage.getItem('bannerflix_hwid');
    if (saved) return saved;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      const partes = [
        navigator.userAgent,
        navigator.language,
        `${screen.width}x${screen.height}x${screen.colorDepth}`,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 0,
        navigator.deviceMemory || 0,
        // Canvas fingerprint
        (() => {
          const c = document.createElement('canvas');
          const ctx = c.getContext('2d');
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('BannerFlix🎬⚽', 2, 15);
          return c.toDataURL().slice(-60);
        })(),
        // WebGL fingerprint
        gl ? `${gl.getParameter(gl.RENDERER)}|${gl.getParameter(gl.VENDOR)}` : 'no-webgl',
      ].join('||');

      // SHA-256
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(partes));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hwid = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32).toUpperCase();

      // Salva para não recalcular
      localStorage.setItem('bannerflix_hwid', hwid);
      return hwid;

    } catch (e) {
      // Fallback simples
      const raw = navigator.userAgent + screen.width + screen.height;
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
      }
      const hwid = Math.abs(hash).toString(16).toUpperCase().padStart(32, '0');
      localStorage.setItem('bannerflix_hwid', hwid);
      return hwid;
    }
  }
}

