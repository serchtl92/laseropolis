
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

const FormularioMembresia = ({ onMembresiaCreada }) => {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracionDias, setDuracionDias] = useState("");
  const [limiteDescargas, setLimiteDescargas] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarCategorias = async () => {
      const { data, error } = await supabase.from("categorias").select("*");
      if (!error) setCategorias(data);
    };
    cargarCategorias();
  }, []);

  const toggleCategoria = (id) => {
    if (categoriasSeleccionadas.includes(id)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter(cid => cid !== id));
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, id]);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!nombre || !precio || !duracionDias || categoriasSeleccionadas.length === 0) {
      setError("Completa todos los campos requeridos.");
      return;
    }

    const { data: usuario } = await supabase.auth.getUser();
    const created_by = usuario?.user?.id;

    const { data, error: err } = await supabase.from("membresias").insert({
      nombre,
      precio: parseFloat(precio),
      descripcion,
      duracion_dias: parseInt(duracionDias),
      limite_descargas: parseInt(limiteDescargas),
      created_by
    }).select().single();

    if (err) {
      setError("Error al guardar la membresía.");
      return;
    }

    const inserts = categoriasSeleccionadas.map(categoria_id => ({
      membresia_id: data.id,
      categoria_id
    }));

    await supabase.from("membresia_categoria").insert(inserts);

    alert("Membresía creada correctamente");
    setNombre(""); setPrecio(""); setDescripcion(""); setDuracionDias(""); setLimiteDescargas("");
    setCategoriasSeleccionadas([]);
    if (onMembresiaCreada) onMembresiaCreada();
  };

  return (
    <div className="p-4 border rounded max-w-xl mx-auto bg-white">
      <h2 className="text-xl font-bold mb-4">Crear nueva membresía</h2>
      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="border p-2 w-full mb-2" />
      <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio" className="border p-2 w-full mb-2" />
      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" className="border p-2 w-full mb-2" />
      <input type="number" value={duracionDias} onChange={(e) => setDuracionDias(e.target.value)} placeholder="Duración (días)" className="border p-2 w-full mb-2" />
      <input type="number" value={limiteDescargas} onChange={(e) => setLimiteDescargas(e.target.value)} placeholder="Límite de descargas por mes" className="border p-2 w-full mb-2" />

      <label className="block font-semibold mb-1">Categorías permitidas:</label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {categorias.map(cat => (
          <label key={cat.id} className="flex items-center space-x-2">
            <input type="checkbox" checked={categoriasSeleccionadas.includes(cat.id)} onChange={() => toggleCategoria(cat.id)} />
            <span>{cat.nombre}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      <button onClick={handleSubmit} className="bg-blue-600 text-white w-full py-2 rounded">Crear membresía</button>
    </div>
  );
};

export default FormularioMembresia;
