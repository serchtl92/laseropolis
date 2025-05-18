
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";

const EditarArchivo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarArchivo = async () => {
      const { data, error } = await supabase
        .from("archivos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError("Error al cargar archivo.");
        console.error(error);
      } else {
        setArchivo(data);
      }

      setLoading(false);
    };

    const cargarCategorias = async () => {
      const { data, error } = await supabase.from("categorias").select("*");
      if (!error) setCategorias(data);
    };

    const cargarSubcategorias = async () => {
      const { data, error } = await supabase.from("subcategorias").select("*");
      if (!error) setSubcategorias(data);
    };

    cargarArchivo();
    cargarCategorias();
    cargarSubcategorias();
  }, [id]);

  const handleGuardarCambios = async () => {
    setError("");

    // 1. Reemplazar imágenes si se cargaron nuevas
    let nuevasImagenesPaths = archivo.imagenes;

    if (archivo.nuevas_imagenes?.length > 0) {
      await supabase.storage.from("archivos-laser").remove(archivo.imagenes);

      nuevasImagenesPaths = [];
      for (const img of archivo.nuevas_imagenes) {
        const nombre = `${Date.now()}-${img.name}`;
        const { error: err } = await supabase.storage
          .from("archivos-laser")
          .upload(`imagenes/${nombre}`, img);
        if (!err) nuevasImagenesPaths.push(`imagenes/${nombre}`);
      }
    }

    let nuevoArchivoPath = archivo.archivo_url;
    if (archivo.nuevo_archivo) {
      await supabase.storage.from("archivos-laser").remove([archivo.archivo_url]);

      const nuevoNombre = `${Date.now()}-${archivo.nuevo_archivo.name}`;
      const { error: err } = await supabase.storage
        .from("archivos-laser")
        .upload(`archivos/${nuevoNombre}`, archivo.nuevo_archivo);

      if (!err) nuevoArchivoPath = `archivos/${nuevoNombre}`;
    }

    const { error } = await supabase
      .from("archivos")
      .update({
        nombre: archivo.nombre,
        descripcion: archivo.descripcion,
        precio: parseFloat(archivo.precio),
        categoria_id: archivo.categoria_id,
        subcategoria_id: archivo.subcategoria_id,
        imagenes: nuevasImagenesPaths,
        archivo_url: nuevoArchivoPath,
      })
      .eq("id", archivo.id);

    if (error) {
      console.error(error);
      setError("Error al actualizar el archivo.");
    } else {
      alert("Archivo actualizado correctamente");
    }
  };

  const handleEliminarArchivo = async () => {
    const confirmacion = confirm("¿Estás seguro de que quieres eliminar este archivo? Esta acción no se puede deshacer.");
    if (!confirmacion) return;

    const archivosAEliminar = [...(archivo.imagenes || []), archivo.archivo_url];
    await supabase.storage.from("archivos-laser").remove(archivosAEliminar);

    const { error } = await supabase.from("archivos").delete().eq("id", archivo.id);

    if (error) {
      console.error(error);
      alert("Error al eliminar el archivo.");
    } else {
      alert("Archivo eliminado correctamente.");
      navigate("/admin");
    }
  };

  if (loading) return <p className="p-4">Cargando archivo...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!archivo) return <p className="p-4">Archivo no encontrado</p>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Editar Archivo</h2>

      <input
        type="text"
        value={archivo.nombre}
        onChange={(e) => setArchivo({ ...archivo, nombre: e.target.value })}
        placeholder="Nombre"
        className="border p-2 w-full mb-3"
      />

      <textarea
        value={archivo.descripcion}
        onChange={(e) => setArchivo({ ...archivo, descripcion: e.target.value })}
        placeholder="Descripción"
        className="border p-2 w-full mb-3"
      />

      <input
        type="number"
        value={archivo.precio}
        onChange={(e) => setArchivo({ ...archivo, precio: e.target.value })}
        placeholder="Precio"
        className="border p-2 w-full mb-3"
      />

      <label className="font-semibold block mb-1">Categoría</label>
      <select
        value={archivo.categoria_id}
        onChange={(e) => setArchivo({ ...archivo, categoria_id: e.target.value })}
        className="border p-2 w-full mb-3"
      >
        <option value="">Selecciona una categoría</option>
        {categorias.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.nombre}
          </option>
        ))}
      </select>

      <label className="font-semibold block mb-1">Subcategoría</label>
      <select
        value={archivo.subcategoria_id}
        onChange={(e) => setArchivo({ ...archivo, subcategoria_id: e.target.value })}
        className="border p-2 w-full mb-3"
      >
        <option value="">Selecciona una subcategoría</option>
        {subcategorias.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.nombre}
          </option>
        ))}
      </select>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Imágenes actuales</label>
        <div className="grid grid-cols-2 gap-2">
          {archivo.imagenes?.map((img, i) => (
            <img
              key={i}
              src={`https://vzxfiipofyprfsgortbw.supabase.co/storage/v1/object/public/archivos-laser/${img}`}
              alt={`imagen-${i}`}
              className="h-32 w-full object-cover border rounded"
            />
          ))}
        </div>
      </div>

      <label className="block font-semibold mt-4 mb-1">Reemplazar imágenes</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setArchivo({ ...archivo, nuevas_imagenes: Array.from(e.target.files) })}
        className="border p-2 w-full mb-3"
      />

      <div className="mb-4">
        <label className="block font-semibold mb-1">Archivo actual</label>
        <a
          href={`https://vzxfiipofyprfsgortbw.supabase.co/storage/v1/object/public/archivos-laser/${archivo.archivo_url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Descargar archivo
        </a>
      </div>

      <label className="block font-semibold mb-1">Reemplazar archivo (.zip o .svg)</label>
      <input
        type="file"
        accept=".zip,.svg"
        onChange={(e) => setArchivo({ ...archivo, nuevo_archivo: e.target.files[0] })}
        className="border p-2 w-full mb-4"
      />

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <button
        onClick={handleGuardarCambios}
        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
      >
        Guardar cambios
      </button>

      <button
        onClick={handleEliminarArchivo}
        className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
      >
        Eliminar archivo
      </button>
    </div>
  );
};

export default EditarArchivo;
