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
    
    console.log('🔐 LicenseAuth inicializado:', {
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
        console.error('❌ Erro ao fazer parse da resposta:', text);
        return { success: false, message: 'Erro ao processar resposta do servidor' };
      }
    } catch (err) {
      console.error('❌ Erro na requisição:', err);
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
      console.log('✅ LicenseAuth inicializado com sucesso');
      return true;
    } else {
      console.error('❌ Erro ao inicializar LicenseAuth:', response.message);
      return false;
    }
  }

  // ===== LOGIN COM CHAVE DE LICENÇA =====
  async login(licenseKey, callback) {
    if (!this.sessionid) {
      console.error('❌ Sessão não inicializada');
      if (callback) {
        callback({ success: false, message: 'Sessão não inicializada' });
      }
      return;
    }

    const data = {
      type: 'license',
      key: licenseKey,
      sessionid: this.sessionid,
      name: this.appName,
      ownerid: this.ownerid
    };

    console.log('🔑 Tentando login com chave:', licenseKey);

    const response = await this.request(data);

    console.log('📨 Resposta do LicenseAuth:', response);

    if (response.success) {
      console.log('✅ Login bem-sucedido!');
      if (callback) {
        callback({
          success: true,
          token: licenseKey,
          user: response.info || {}
        });
      }
    } else {
      console.error('❌ Erro no login:', response.message);
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
      console.error('❌ Sessão não inicializada');
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
      console.error('❌ Sessão não inicializada');
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
      console.error('❌ Sessão não inicializada');
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
      console.error('❌ Sessão não inicializada');
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
}

console.log('✅ Biblioteca LicenseAuth carregada');
