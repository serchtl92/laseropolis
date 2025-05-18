import React, { useEffect, useState } from "react";
import { obtenerCreditosYMovimientos } from "../lib/creditos.js";
import { supabase } from "../supabase/client";


function CreditosTab() {
  const [creditos, setCreditos] = useState(0);
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    async function cargarDatos() {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;

      if (userId) {
        const { creditos, movimientos } = await obtenerCreditosYMovimientos(userId);
        setCreditos(creditos);
        setMovimientos(movimientos);
      }
    }

    cargarDatos();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Tus Créditos</h2>
      <p className="text-gray-700 mb-4">Saldo actual: <span className="font-bold text-blue-600">{creditos}</span> créditos</p>

      <h3 className="font-semibold text-lg mb-2">Historial de Movimientos</h3>
      {movimientos.length === 0 ? (
        <p className="text-gray-500">Aún no tienes movimientos registrados.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {movimientos.map((mov) => (
            <li key={mov.id} className="py-2 flex justify-between">
              <div>
                <p className="font-medium">{mov.descripcion}</p>
                <span className="text-sm text-gray-500">{new Date(mov.fecha).toLocaleString()}</span>
              </div>
              <div className={`font-bold ${mov.cantidad >= 0 ? "text-green-600" : "text-red-600"}`}>
                {mov.cantidad > 0 ? "+" : ""}
                {mov.cantidad}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CreditosTab;
