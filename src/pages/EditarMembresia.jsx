import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";

const EditarMembresia = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [membresia, setMembresia] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarMembresia = async () => {
      const { data, error } = await supabase
        .from("membresias")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError("No se pudo cargar la membresía");
        console.error(error);
      } else {
        setMembresia(data);
      }
    };

    cargarMembresia();
  }, [id]);

  const handleGuardar = async () => {
    if (!membresia.nombre || !membresia.precio || !membresia.duracion_dias) {
      setError("Todos los campos son obligatorios");
      return;
    }

    const { error } = await supabase
      .from("membresias")
      .update({
        nombre: membresia.nombre,
        precio: parseFloat(membresia.precio),
        descripcion: membresia.descripcion,
        duracion_dias: parseInt(membresia.duracion_dias),
        limite_descargas: parseInt(membresia.limite_descargas),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      setError("Error al guardar los cambios");
    } else {
      alert("Membresía actualizada correctamente");
      navigate("/admin");
    }
  };

  const handleEliminar = async () => {
    const confirmar = confirm("¿Estás seguro de que deseas eliminar esta membresía?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("membresias")
      .delete()
      .eq("id", membresia.id);

    if (error) {
      alert("Error al eliminar membresía");
      console.error(error);
    } else {
      alert("Membresía eliminada correctamente");
      navigate("/admin");
    }
  };

  if (!membresia) return <p className="p-4">Cargando membresía...</p>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Editar Membresía</h2>

      <input
        type="text"
        value={membresia.nombre}
        onChange={(e) => setMembresia({ ...membresia, nombre: e.target.value })}
        placeholder="Nombre"
        className="border p-2 w-full mb-2"
      />

      <input
        type="number"
        value={membresia.precio}
        onChange={(e) => setMembresia({ ...membresia, precio: e.target.value })}
        placeholder="Precio"
        className="border p-2 w-full mb-2"
      />

      <textarea
        value={membresia.descripcion}
        onChange={(e) => setMembresia({ ...membresia, descripcion: e.target.value })}
        placeholder="Descripción"
        className="border p-2 w-full mb-2"
      />

      <input
        type="number"
        value={membresia.duracion_dias}
        onChange={(e) => setMembresia({ ...membresia, duracion_dias: e.target.value })}
        placeholder="Duración (días)"
        className="border p-2 w-full mb-2"
      />

      <input
        type="number"
        value={membresia.limite_descargas}
        onChange={(e) => setMembresia({ ...membresia, limite_descargas: e.target.value })}
        placeholder="Límite de descargas"
        className="border p-2 w-full mb-4"
      />

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <button
        onClick={handleGuardar}
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 mr-2"
      >
        Guardar cambios
      </button>

      <button
        onClick={handleEliminar}
        className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
      >
        Eliminar membresía
      </button>
    </div>
  );
};

export default EditarMembresia;
