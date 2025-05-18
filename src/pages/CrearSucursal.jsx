import { useState, useEffect } from "react";
import { supabase } from '../supabase/client'; // ajusta la importación según tu proyecto

export default function CrearSucursal() {
  const [tiendas, setTiendas] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [nombreSucursal, setNombreSucursal] = useState("");
  const [direccionSucursal, setDireccionSucursal] = useState("");
  const [telefonoSucursal, setTelefonoSucursal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cargar tiendas del usuario para mostrar en el select
    const fetchTiendas = async () => {
      const user = supabase.auth.user();
      if (!user) return;
      const { data, error } = await supabase
        .from("tiendas")
        .select("id, nombre")
        .eq("user_id", user.id);
      if (!error) setTiendas(data);
    };
    fetchTiendas();
  }, []);

  const handleCrearSucursal = async () => {
    if (!tiendaSeleccionada) {
      setError("Debes seleccionar una tienda");
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.from("sucursales").insert({
      tienda_id: tiendaSeleccionada,
      nombre: nombreSucursal,
      direccion: direccionSucursal,
      telefono: telefonoSucursal,
    }).single();

    if (error) setError(error.message);
    else {
      alert("Sucursal creada con éxito");
      setNombreSucursal("");
      setDireccionSucursal("");
      setTelefonoSucursal("");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Crear Sucursal</h2>
      <select
        onChange={(e) => setTiendaSeleccionada(e.target.value)}
        value={tiendaSeleccionada || ""}
      >
        <option value="">Selecciona una tienda</option>
        {tiendas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Nombre de la sucursal"
        value={nombreSucursal}
        onChange={(e) => setNombreSucursal(e.target.value)}
      />
      <input
        type="text"
        placeholder="Dirección de la sucursal"
        value={direccionSucursal}
        onChange={(e) => setDireccionSucursal(e.target.value)}
      />
      <input
        type="text"
        placeholder="Teléfono de la sucursal"
        value={telefonoSucursal}
        onChange={(e) => setTelefonoSucursal(e.target.value)}
      />
      <button onClick={handleCrearSucursal} disabled={loading}>
        {loading ? "Creando..." : "Crear Sucursal"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
