// Archivo: js/api.js (NUEVO)
// Propósito: Centralizar todas las llamadas fetch a la API (Netlify Functions).

const API_BASE_URL = '/.netlify/functions/';

// --- Función de Ayuda para las Peticiones ---

// Esta función genérica manejará el token, los errores y la conversión a JSON.
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sts-token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        // Si la respuesta no es OK, lanzamos un error con la info del backend.
        // Esto es crucial para manejar baneos u otros errores específicos.
        const error = new Error(data.message || 'An API error occurred.');
        error.data = data; // Adjuntamos todos los datos del error
        error.status = response.status;
        throw error;
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    // Re-lanzamos el error para que el código que llamó a la función pueda manejarlo.
    throw error;
  }
}


// --- Endpoints de Autenticación ---

export const auth = {
  login: (username, password) => {
    return request('login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  register: (username, password, verificationCode) => {
    return request('verify-and-register', {
        method: 'POST',
        body: JSON.stringify({ username, password, verificationCode })
    });
  }
};

// --- Endpoints de Perfil de Usuario y Títulos ---
export const user = {
    getTitles: () => request('get-titles'),
    updateProfile: (payload) => {
        return request('update-user-profile', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }
};


// --- Endpoints de Sorteos ---
export const giveaways = {
    get: () => request('giveaways-manager'),
    create: (giveawayData) => {
        return request('giveaways-manager', {
            method: 'POST',
            body: JSON.stringify(giveawayData),
        });
    },
    join: (giveawayId) => {
        return request('giveaways-manager', {
            method: 'PUT',
            body: JSON.stringify({ giveawayId }),
        });
    }
};

// --- Endpoints de Administrador ---
export const admin = {
    grantTitle: (targetUsername, titleKey) => {
        return request('admin-tools', {
            method: 'POST',
            body: JSON.stringify({ action: 'grantTitle', targetUsername, titleKey }),
        });
    },
    warnUser: (targetUsername, reason) => {
        return request('admin-tools', {
            method: 'POST',
            body: JSON.stringify({ action: 'warnUser', targetUsername, reason }),
        });
    },
    banUser: (targetUsername, reason, durationHours) => {
        return request('admin-tools', {
            method: 'POST',
            body: JSON.stringify({ action: 'banUser', targetUsername, reason, durationHours }),
        });
    }
};

// --- Endpoints de Notificaciones ---
export const notifications = {
    get: () => request('notifications') // Asumiendo que crearás este endpoint
};