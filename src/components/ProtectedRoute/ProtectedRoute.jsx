import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Obtener datos del usuario desde cookies
  const userCookie = Cookies.get('user');
  const token = Cookies.get('token');

  // Verificar si hay sesión activa
  if (!token || !userCookie) {
    console.log('🚫 No hay sesión activa, redirigiendo al login');
    return <Navigate to="/login" replace />;
  }

  try {
    // Parsear datos del usuario
    const user = JSON.parse(userCookie);
    const userRole = user.rol?.toLowerCase();

    console.log(`🔍 Verificando acceso - Usuario: ${user.email}, Rol: ${user.rol}, Roles permitidos: ${allowedRoles.join(', ')}`);

    // Verificar si el rol del usuario está en los roles permitidos
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      console.log(`🚫 Acceso denegado - Rol ${user.rol} no autorizado para esta ruta`);
      
      // Redirigir según el rol del usuario a su página correspondiente
      if (userRole === 'administrador') {
        return <Navigate to="/Administrador" replace />;
      } else if (userRole === 'residente') {
        return <Navigate to="/residente" replace />;
      } else if (userRole === 'empleado') {
        return <Navigate to="/empleado" replace />;
      } else {
        return <Navigate to="/login" replace />;
      }
    }

    // Si tiene permisos, mostrar el contenido
    console.log(`✅ Acceso permitido para ${user.email} con rol ${user.rol}`);
    return children;

  } catch (error) {
    console.error('❌ Error al verificar permisos:', error);
    // Si hay error parseando cookies, limpiar y redirigir
    Cookies.remove('token');
    Cookies.remove('user');
    Cookies.remove('rememberToken');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;