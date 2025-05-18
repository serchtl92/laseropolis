import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

import Layout from "./components/Layout";
import SubirArchivo from "./pages/SubirArchivo";
import GaleriaPage from './pages/GaleriaPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import EditarArchivo from './pages/EditarArchivo';
import EditarMembresia from "./pages/EditarMembresia";
import FileDetailPage from './pages/FileDetailPage';
import MembresiasPage from './pages/MembresiasPage';
import CheckoutPage from './pages/CheckoutPage';
import PagoExitoso from './pages/PagoExitoso';
import PagoFallido from './pages/PagoFallido';
import UserDashboard from './pages/UserDashboard';
import PrivateRoute from "./components/PrivateRoute";
import Tienda from "./pages/TiendaPage";
import ProductoDetailPage from "./pages/ProductDetailPage";



// Configuración de PayPal
const paypalOptions = {
  "client-id": "ATL3ziduYUQwNxc9PZ7nAamAIu_N8Xa0e6GXSVSrQwYkaPhpGgFAI7fMId7TZ-wsN-qKajla8yigfUYA",
  currency: "MXN",
  intent: "capture"
};

function App() {
  return (
    <PayPalScriptProvider options={paypalOptions}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<GaleriaPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="archivo/:id" element={<FileDetailPage />} />
            <Route path="membresias" element={<MembresiasPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="pago-exitoso" element={<PagoExitoso />} />
            <Route path="pago-fallido" element={<PagoFallido />} />
            <Route path="tienda" element={<Tienda />} />
            <Route path="/producto/:id" element={<ProductoDetailPage />} />

            
            <Route
              path="profile"
              element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              }
            />
            <Route path="subir" element={<SubirArchivo />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/editar/:id" element={<EditarArchivo />} />
            <Route path="admin/editar-membresia/:id" element={<EditarMembresia />} />
          </Route>
        </Routes>
      </Router>
    </PayPalScriptProvider>
  );
}

export default App;
