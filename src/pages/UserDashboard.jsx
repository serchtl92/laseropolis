// src/pages/UserDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import CreditosTab from "../components/CreditosTab";
import ReferidosSection from "../components/ReferidosSection";
import EditarPerfilModal from "../components/EditarPerfilModal";

function UserDashboard() {
  const [tab, setTab] = useState("perfil");
  const [userData, setUserData] = useState(null);
  const [membresiaInfo, setMembresiaInfo] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();

  const refreshUser = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error) setUserData(data);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error al obtener datos del usuario:", error.message);
      } else {
        setUserData(data);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchMembresia = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from("membresias_usuarios")
        .select("*, membresia: membresias (*)")
        .eq("usuario_id", userId)
        .order("fecha_inicio", { ascending: false })
        .limit(1)
        .single();

      if (!error) {
        setMembresiaInfo(data);
      } else {
        console.error("Error al obtener membresía:", error.message);
      }
    };

    fetchMembresia();
  }, []);

  const tabs = [
    { key: "perfil", label: "Perfil" },
    { key: "membresia", label: "Membresía" },
    { key: "compras", label: "Compras/Descargas" },
    { key: "pagos", label: "Métodos de pago" },
    { key: "creditos", label: "Créditos" },
    { key: "actividad", label: "Actividad" },
    { key: "seguridad", label: "Privacidad/Seguridad" },
    { key: "recompensas", label: "Recompensas" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Usuario</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-blue-600 text-white shadow"
                : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {tab === "perfil" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Tu perfil</h2>
            {userData ? (
              <>
                <ul className="space-y-2 text-gray-800">
                  <li>
                    <strong>Nombre:</strong> {userData.nombre}
                  </li>
                  <li>
                    <strong>Email:</strong> {userData.email}
                  </li>
                  <li>
                    <strong>Rol:</strong> {userData.rol}
                  </li>
                  <li>
                    <strong>Créditos:</strong> {userData.creditos}
                  </li>
                  <li>
                    <strong>Registrado el:</strong>{" "}
                    {new Date(userData.fecha_registro).toLocaleDateString()}
                  </li>
                </ul>
                <button
                  onClick={() => setMostrarModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Editar
                </button>

                {mostrarModal && (
                  <EditarPerfilModal
                    userData={userData}
                    onClose={() => setMostrarModal(false)}
                    onUserUpdate={refreshUser}
                  />
                )}
              </>
            ) : (
              <p>Cargando datos...</p>
            )}
          </div>
        )}

        {tab === "membresia" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Membresía</h2>
            {membresiaInfo ? (
              <div className="space-y-2 text-gray-800">
                <p>
                  <strong>Tipo:</strong> {membresiaInfo.membresia.nombre}
                </p>
                <p>
                  <strong>Inicio:</strong>{" "}
                  {new Date(membresiaInfo.fecha_inicio).toLocaleDateString()}
                </p>
                <p>
                  <strong>Fin:</strong>{" "}
                  {new Date(membresiaInfo.fecha_vencimiento).toLocaleDateString()}
                </p>
                <p>
                  <strong>Días restantes:</strong>{" "}
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(membresiaInfo.fecha_vencimiento) - new Date()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}
                </p>
              </div>
            ) : (
              <div className="text-gray-700 space-y-2">
                <p>No tienes una membresía activa actualmente.</p>
                <a
                  href="/membresias"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Ver planes disponibles
                </a>
              </div>
            )}
          </div>
        )}

        {tab === "compras" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Compras y descargas</h2>
            <p>Lista de archivos adquiridos y opciones de descarga.</p>
          </div>
        )}
        {tab === "pagos" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Métodos de pago</h2>
            <p>Visualiza y gestiona tus métodos de pago.</p>
          </div>
        )}
        {tab === "creditos" && <CreditosTab />}

        {tab === "actividad" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Actividad</h2>
            <p>Revisa tu historial de actividad.</p>
          </div>
        )}
        {tab === "seguridad" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Privacidad y Seguridad
            </h2>
            <p>
              Administra sesiones activas, datos personales y opciones de
              seguridad.
            </p>
          </div>
        )}
        {tab === "recompensas" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Recompensas</h2>
            <ReferidosSection />
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
