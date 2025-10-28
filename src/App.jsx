import { Route, Routes } from "react-router-dom"
import LoginPage from "./paginas/LoginPage"
import ResidentePage from "./paginas/ResidentePage"
import AdminComunicacionPage from "./paginas/AdminComunicacionPage"
import ResidentComunicacionPage from "./paginas/ResidentComunicacionPage"
import MainVista from "./vista/MainVista"
import ResidenteVista from "./vista/ResidenteVista"
import AdminVsita from "./vista/AdminVista"
import AdmiPage from "./paginas/AdmiPage"
import { RecPasswordPage } from "./paginas/RecPasswordPage"
import EmpleadoVista from "./vista/EmpleadoVista"
import RegisterPage from "./paginas/RegisterPage"
import ResetPasswordPage from "./paginas/ResetPasswordPage"
import GestionDeUsuariosPage from "./paginas/GestionDeUsuariosPage"
import EmpleadoDashboard from "./paginas/EmpleadoDashboard"
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute"
import VerifyPinPage from "./paginas/VerifyPinPage"
import MiCuentaPage from  "./paginas/MiCuentaPage"
import AdminConsumosPage from "./paginas/AdminConsumosPage"
import ResidenteConsumosPage from "./paginas/ResidenteConsumosPage"
//import AdminTicketsPage from "./paginas/AdminTicketsMantenimietoPage"
import ResidenteTicketsMantenimiento from "./paginas/ResidenteTicketsMantenimiento"
import EmpleadoTicketsMantenimiento from "./paginas/EmpleadoTicketsMantenimiento"
import AdminTicketsMantenimiento from "./paginas/AdminTicketsPage"
import AdminReservasPage from "./paginas/AdminReservasPage"
import ResidenteReservasPage from "./paginas/ResidentReservasPage"


function App() {
  return (

    <Routes>
      <Route element={<MainVista />}>
        <Route path="/" element={   <LoginPage />  } />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperarPassword" element={<RecPasswordPage/>} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-pin" element={<VerifyPinPage />} />
      </Route>
      {/* RUTAS PROTEGIDAS PARA RESIDENTES */}
      <Route element={<ResidenteVista />}>
        <Route 
          path="/residente" 
          element={
            <ProtectedRoute allowedRoles={['residente']}>
              <ResidentePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mi-cuenta" 
          element={
            <ProtectedRoute allowedRoles={['residente']}>
              <MiCuentaPage />
            </ProtectedRoute>
          } 
        />
          <Route 
          path="/residente/comunicacion" 
          element={
            <ProtectedRoute allowedRoles={['residente']}>
              <ResidentComunicacionPage  />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/residente/consumo" 
          element={
            <ProtectedRoute allowedRoles={['residente']}>
              <ResidenteConsumosPage  />
            </ProtectedRoute>
          } 
        />

      <Route 
          path="/residente/reservas" 
          element={
            <ProtectedRoute allowedRoles={['residente']}>
              <ResidenteReservasPage  />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/residente/ticketsMantenimiento" 
          element={
            <ProtectedRoute allowedRoles={['residente']}>
              <ResidenteTicketsMantenimiento />
            </ProtectedRoute>
          } 
        />
      
      </Route>
      {/* RUTAS PROTEGIDAS PARA ADMINISTRADORES */}
      <Route element={<AdminVsita />}>
        <Route 
          path="/Administrador" 
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdmiPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/GestionDeUsuarios" 
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <GestionDeUsuariosPage />
             
            </ProtectedRoute>
          } 
        />
       <Route 
          path="/Administrador/comunicacion" 
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminComunicacionPage  />
            </ProtectedRoute>
          } 
        />
    <Route 
          path="/Administrador/consumos" 
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminConsumosPage  />
            </ProtectedRoute>
          } 
        />
          <Route 
          path="/Administrador/reservas" 
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminReservasPage />
            </ProtectedRoute>
          } 
        />
           <Route 
          path="/Administrador/ticketsMantenimiento" 
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminTicketsMantenimiento />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/*  RUTAS PROTEGIDAS PARA EMPLEADOS */}
      <Route element={<EmpleadoVista />}>
        <Route 
          path="/empleado" 
          element={
            <ProtectedRoute allowedRoles={['empleado']}>
              <EmpleadoDashboard />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/empleado/ticketsMantenimiento" 
          element={
            <ProtectedRoute allowedRoles={['empleado']}>
              <EmpleadoTicketsMantenimiento />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  )   
}

export default App
