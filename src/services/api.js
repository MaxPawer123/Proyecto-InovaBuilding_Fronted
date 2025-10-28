import Cookies from 'js-cookie';

// Configuración base de la API
const API_BASE_URL = 'http://localhost:8000/api';

// Utilidad para hacer peticiones
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = Cookies.get('token');
  
  console.log('🔍 API Request:', { endpoint, hasToken: !!token, tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN' });

  // Merge options first, then build headers to include both default and provided
  const isFormData = options && options.body && typeof FormData !== 'undefined' && options.body instanceof FormData;
  const config = {
    ...options,
    credentials: 'include', // enviar cookies
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // No es JSON, devolver texto plano
      data = text;
    }

    if (!response.ok) {
      const err = new Error((data && data.message) ? data.message : `Request failed with status ${response.status}`);
      err.status = response.status;
      err.body = data;
      console.error('API Error:', err);
      throw err;
    }

    return data;
  } catch (error) {
    // If it's a TypeError from fetch (network error), normalize the message
    if (error instanceof TypeError) {
      const netErr = new Error('Network error or server unreachable');
      netErr.original = error;
      console.error('Network/API Error:', error);
      throw netErr;
    }
    throw error;
  }
};

// Servicios de autenticación
export const authAPI = {
  // Login
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Registro
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Verificar token (cuando implementemos JWT completo)
  verifyToken: async (token) => {
    return apiRequest('/auth/verify-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
  // Obtener perfil del usuario autenticado
  profile: async () => {
    return apiRequest('/auth/profile');
  },
};

// Servicios de usuarios
export const userAPI = {
  // Obtener todos los usuarios
  getUsers: async () => {
    return apiRequest('/users');
  },
};

// Servicios de empleados (internos)
export const empleadosAPI = {
  list: async () => {
    return apiRequest('/empleados');
  }
};

// Servicios de comunicación
export const comunicacionAPI = {
  listAnuncios: async (token, params = {}) => {
    const q = params.search ? `?search=${encodeURIComponent(params.search)}` : '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest(`/comunicacion/anuncios${q}`, { headers });
  },
  createAnuncio: async (token, body) => {
    return apiRequest('/comunicacion/anuncios', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  },
  patchAnuncio: async (token, id, body) => {
    return apiRequest(`/comunicacion/anuncios/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  },
  deleteAnuncio: async (token, id) => {
    return apiRequest(`/comunicacion/anuncios/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  },

  listQuejas: async (token, queryParams = {}) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // Admin puede listar todas las quejas, residente solo las suyas
    const params = new URLSearchParams(queryParams);
    return apiRequest(`/comunicacion/quejas?${params.toString()}`, { headers });
  },
  listMisQuejas: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // Usar user_only=true para filtrar por usuario autenticado
    return apiRequest(`/comunicacion/quejas?user_only=true`, { headers });
  },
  createQueja: async (token, body) => {
    return apiRequest('/comunicacion/quejas', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  },
  updateQuejaEstado: async (token, id, body) => {
    return apiRequest(`/comunicacion/quejas/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  },

  // Salas
  listSalas: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest('/comunicacion/salas', { headers });
  },
  createSala: async (token, body) => {
    return apiRequest('/comunicacion/salas', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  },
  updateSala: async (token, id, body) => {
    return apiRequest(`/comunicacion/salas/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  },
  deleteSala: async (token, id) => {
    return apiRequest(`/comunicacion/salas/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  }
};
 
// Mensajes
comunicacionAPI.listMensajes = async (token, id_sala) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiRequest(`/comunicacion/salas/${id_sala}/mensajes`, { headers });
};

comunicacionAPI.createMensaje = async (token, id_sala, body) => {
  return apiRequest(`/comunicacion/salas/${id_sala}/mensajes`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
};

// Votaciones
comunicacionAPI.listVotaciones = async (token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiRequest('/comunicacion/votaciones', { headers });
};

comunicacionAPI.createVotacion = async (token, body) => {
  return apiRequest('/comunicacion/votaciones', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
};

comunicacionAPI.getVotacion = async (token, id) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiRequest(`/comunicacion/votaciones/${id}`, { headers });
};

// Obtener departamentos
userAPI.listDepartamentos = async () => {
  return apiRequest('/users/departamentos');
};

// Obtener departamento del residente actual
userAPI.getMiDepartamento = async (userId) => {
  return apiRequest(`/users/mi-departamento/${userId}`);
};

// Servicios de consumos
export const consumosAPI = {
  list: async (token, filters = {}) => {
    const params = new URLSearchParams(filters);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest(`/consumos?${params.toString()}`, { headers });
  },
  create: async (token, body) => {
    return apiRequest('/consumos', { 
      method: 'POST', 
      headers: { Authorization: `Bearer ${token}` }, 
      body: JSON.stringify(body) 
    });
  },
  update: async (token, id, body) => {
    return apiRequest(`/consumos/${id}`, { 
      method: 'PATCH', 
      headers: { Authorization: `Bearer ${token}` }, 
      body: JSON.stringify(body) 
    });
  },
  delete: async (token, id) => {
    return apiRequest(`/consumos/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${token}` } 
    });
  }
};

// Servicios de alertas
export const alertasAPI = {
  list: async (token, filters = {}) => {
    const params = new URLSearchParams(filters);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest(`/alertas?${params.toString()}`, { headers });
  },
  create: async (token, body) => {
    return apiRequest('/alertas', { 
      method: 'POST', 
      headers: { Authorization: `Bearer ${token}` }, 
      body: JSON.stringify(body) 
    });
  },
  updateEstado: async (token, id, estado) => {
    return apiRequest(`/alertas/${id}`, { 
      method: 'PATCH', 
      headers: { Authorization: `Bearer ${token}` }, 
      body: JSON.stringify({ estado }) 
    });
  },
  delete: async (token, id) => {
    return apiRequest(`/alertas/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${token}` } 
    });
  }
};

// Servicios de tickets
export const ticketsAPI = {
  // Obtener categorías de tickets
  getCategorias: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest('/tickets/categorias', { headers });
  },
  
  // Listar tickets con filtros
  list: async (token, filters = {}) => {
    const params = new URLSearchParams(filters);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest(`/tickets?${params.toString()}`, { headers });
  },
  
  // Obtener ticket por ID
  getById: async (token, id) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest(`/tickets/${id}`, { headers });
  },
  
    // Agregar seguimiento a un ticket
    addSeguimiento: async (token, id_ticket, body) => {
      return apiRequest(`/tickets/${id_ticket}/seguimiento`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
    },
  
    // Obtener historial de seguimiento (todos los tickets)
    getHistorialSeguimiento: async (token) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      return apiRequest('/tickets/historial-seguimiento', { headers });
    },
  
  // Crear nuevo ticket
  create: async (token, body) => {
    return apiRequest('/tickets', { 
      method: 'POST', 
      headers: { Authorization: `Bearer ${token}` }, 
      body: JSON.stringify(body) 
    });
  },
  
  // Subir adjunto a ticket
  uploadAdjunto: async (token, id_ticket, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest(`/tickets/${id_ticket}/adjuntos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  },
  
  // Actualizar estado del ticket
  updateEstado: async (token, id, estado) => {
    return apiRequest(`/tickets/${id}/estado`, { 
      method: 'PATCH', 
      headers: { Authorization: `Bearer ${token}` }, 
      body: JSON.stringify({ estado }) 
    });
  },
  
  // Actualizar ticket completo (solo admin)
  update: async (token, id, body) => {
    return apiRequest(`/tickets/${id}`, { 
      method: 'PUT', 
      headers: { Authorization: `Bearer ${token}` }, 
      body: JSON.stringify(body) 
    });
  },
  
  // Eliminar ticket (solo admin)
  delete: async (token, id) => {
    return apiRequest(`/tickets/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${token}` } 
    });
  },
  
  // Crear asignación de técnico
  assign: async (token, id_ticket, body) => {
    return apiRequest(`/tickets/${id_ticket}/asignaciones`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  },
  
  // Obtener estadísticas (solo admin)
  getStats: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest('/tickets/stats/general', { headers });
  },

  // Obtener tickets asignados (solo admin)
  getAsignados: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest('/tickets/asignados', { headers });
  },

  // Obtener mis tickets asignados (empleado actual)
  getMisAsignados: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest('/tickets/mis-asignados', { headers });
  },

  // Obtener tickets asignados (con técnico) para el residente autenticado
  getAsignadosResidente: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest('/tickets/mis-asignados-residente', { headers });
  }
};

// Servicios de técnicos externos
export const tecnicosAPI = {
  // Listar técnicos externos
  list: async (token, filters = {}) => {
    const params = new URLSearchParams(filters);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest(`/tecnicos?${params.toString()}`, { headers });
  },
  
  // Obtener técnico por ID
  getById: async (token, id) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiRequest(`/tecnicos/${id}`, { headers });
  },
  
  // Crear nuevo técnico
  create: async (token, body) => {
    return apiRequest('/tecnicos', { 
      method: 'POST', 
      headers: { Authorization: `Bearer ${token}` }, 
      body: JSON.stringify(body) 
    });
  },
  
  // Actualizar técnico
  update: async (token, id, body) => {
    return apiRequest(`/tecnicos/${id}`, { 
      method: 'PUT', 
      headers: { Authorization: `Bearer ${token}` }, 
      body: JSON.stringify(body) 
    });
  },
  
  // Eliminar técnico (soft delete)
  delete: async (token, id) => {
    return apiRequest(`/tecnicos/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${token}` } 
    });
  }
};

// API de Notificaciones
export const notificacionesAPI = {
  // Obtener notificaciones del usuario autenticado
  list: (token, soloNoLeidas = false) => {
    const params = soloNoLeidas ? '?solo_no_leidas=true' : '';
    return apiRequest(`/notificaciones${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Marcar notificación como leída
  marcarLeida: (token, id_notificacion) => {
    return apiRequest(`/notificaciones/${id_notificacion}/leer`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Marcar todas como leídas
  marcarTodasLeidas: (token) => {
    return apiRequest('/notificaciones/leer-todas', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Eliminar notificación
  delete: (token, id_notificacion) => {
    return apiRequest(`/notificaciones/${id_notificacion}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  }


  
};
// Servicios de áreas comunes
export const areasAPI = {
  // Obtener todas las áreas
  getAreas: async (id_persona = null) => {
    const query = id_persona ? `?id_persona=${id_persona}` : '';
    return apiRequest(`/areas${query}`, {
      credentials: 'include',
    });
  },

  // Obtener un área específica
  getArea: async (id) => {
    return apiRequest(`/areas/${id}`, {
      credentials: 'include',
    });
  },

  // Crear nueva área
  createArea: async (areaData) => {
    return apiRequest('/areas', {
      method: 'POST',
      body: JSON.stringify(areaData),
      credentials: 'include',
    });
  },

  // Actualizar área
  updateArea: async (id, areaData) => {
    return apiRequest(`/areas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(areaData),
      credentials: 'include',
    });
  },

  // Eliminar área
  deleteArea: async (id) => {
    return apiRequest(`/areas/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  // Obtener reservas de un área
  getReservasArea: async (id, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const query = queryParams ? `?${queryParams}` : '';
    return apiRequest(`/areas/${id}/reservas${query}`, {
      credentials: 'include',
    });
  },
};

// Servicios de reservas
export const reservasAPI = {
  createReserva: async (id_area_comun, reservaData) => {
    return apiRequest(`/areas/${id_area_comun}/reservas`, {
      method: 'POST',
      body: JSON.stringify(reservaData),
      credentials: 'include'
    });
  },
  updateEstado: async (id_reserva, estado) => {
    return apiRequest(`/reservas/${id_reserva}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
      credentials: 'include'
    });
  },
  getMisReservas: async () => {
    return apiRequest('/mis-reservas', { credentials: 'include' });
  }
};


export default {
  authAPI,
  userAPI,
  consumosAPI,
  alertasAPI,
  ticketsAPI,
  tecnicosAPI,
  notificacionesAPI,
  areasAPI,
  reservasAPI,
  comunicacionAPI,
  empleadosAPI  
};