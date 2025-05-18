import React, { useState } from "react";
import { supabase } from "../supabase/client";

const EditarPerfilModal = ({ userData, onClose, onUserUpdate }) => {
  const [nombre, setNombre] = useState(userData.nombre || "");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const tienePassword = !!userData.password; // Si en tu tabla guardas la password (aunque no es recomendable)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setCargando(true);

    if (nuevaPassword && nuevaPassword !== confirmPassword) {
      setMensaje("Las contraseñas no coinciden.");
      setCargando(false);
      return;
    }

    try {
      // Actualiza el nombre en la tabla usuarios
      const { error: errorUpdate } = await supabase
        .from("usuarios")
        .update({ nombre })
        .eq("id", userData.id);

      if (errorUpdate) throw errorUpdate;

      // Cambiar contraseña si fue ingresada
      if (nuevaPassword) {
        const { error: passError } = await supabase.auth.updateUser({
          password: nuevaPassword,
        });
        if (passError) throw passError;
      }

      setMensaje("Perfil actualizado correctamente.");
      onUserUpdate(); // Refresca datos en el dashboard
      setTimeout(onClose, 1000); // Cierra el modal luego de un segundo
    } catch (error) {
      setMensaje("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Editar Perfil</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          {userData?.app_metadata?.provider === "email" && (
            <>
              <div>
                <label className="block text-sm font-medium">Nueva contraseña</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {userData?.app_metadata?.provider !== "email" && (
            <p className="text-sm text-gray-600">
              Iniciaste sesión con <strong>{userData?.app_metadata?.provider}</strong>, por lo que no puedes cambiar la contraseña aquí.
            </p>
          )}

          {mensaje && <p className="text-sm text-red-600">{mensaje}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {cargando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarPerfilModal;
