import { Switch, Route } from "wouter";
import DashboardWelcome from "./DashboardWelcome";
import DashboardLogin from "./DashboardLogin";
import DashboardPanel from "./DashboardPanel";
import KitsAdminPage from "./kits/KitsAdminPage";
import ProtectedRoute from "../auth/ProtectedRoute";

export default function DashboardMain() {
  return (
    <Switch>
      {/* Las rutas aquí son relativas al dominio, ya que en App.tsx capturamos todo lo que empiece por /admin */}
      <Route path="/admin">
        <ProtectedRoute>
          <DashboardPanel />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/login" component={DashboardLogin} />
      <Route path="/admin/kits">
        <ProtectedRoute allowedRoles={['admin', 'ceo', 'proyectista', 'comercial', 'designado', 'almacenero']}>
          <KitsAdminPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/panel">
        <ProtectedRoute>
          <DashboardPanel />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback interno del dashboard */}
      <Route>
        <ProtectedRoute>
          <DashboardPanel />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}
