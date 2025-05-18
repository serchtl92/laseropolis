import React, { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";

const SubirArchivo = () => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagenes, setImagenes] = useState([]);
  const [archivo, setArchivo] = useState(null);

  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState("");

  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState("");
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [mostrarNuevaSubcategoria, setMostrarNuevaSubcategoria] = useState(false);

  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verificarAcceso = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
  
      const { data, error } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();
  
      if (error || !data || data.rol !== "admin") {
        navigate("/");
      }
    };
  
    verificarAcceso();
  }, []);
  

  useEffect(() => {
    obtenerCategorias();
    obtenerSubcategorias();
  }, []);

  const obtenerCategorias = async () => {
    const { data } = await supabase.from("categorias").select("*").order("nombre", { ascending: true });
    if (data) setCategorias(data);
  };

  const obtenerSubcategorias = async () => {
    const { data } = await supabase.from("subcategorias").select("*").order("nombre", { ascending: true });
    if (data) setSubcategorias(data);
  };

  const handleCrearCategoria = async (e) => {
    if (e.key === "Enter" && nuevaCategoria.trim()) {
      const { data, error } = await supabase
        .from("categorias")
        .insert({ nombre: nuevaCategoria })
        .select()
        .single();

      if (!error) {
        setCategoriaSeleccionada(data.id);
        setNuevaCategoria("");
        setMostrarNuevaCategoria(false);
        obtenerCategorias();
      }
    }
  };

  const handleCrearSubcategoria = async (e) => {
    if (e.key === "Enter" && nuevaSubcategoria.trim() && categoriaSeleccionada) {
      const { data: sub, error: errorSub } = await supabase
        .from("subcategorias")
        .insert({ nombre: nuevaSubcategoria })
        .select()
        .single();

      if (!errorSub && sub) {
        await supabase.from("categoria_subcategoria").insert({
          categoria_id: categoriaSeleccionada,
          subcategoria_id: sub.id,
        });

        setSubcategoriaSeleccionada(sub.id);
        setNuevaSubcategoria("");
        setMostrarNuevaSubcategoria(false);
        obtenerSubcategorias();
      }
    }
  };

  const handleSubir = async () => {
    setError("");

    if (!nombre || !precio || !archivo || !subcategoriaSeleccionada) {
      setError("Completa todos los campos.");
      return;
    }

    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;

    if (!userId) {
      setError("No autorizado.");
      return;
    }

    const archivoNombre = `${Date.now()}-${archivo.name}`;
    const { error: errorArchivo } = await supabase.storage
      .from("archivos-laser")
      .upload(`archivos/${archivoNombre}`, archivo);

    if (errorArchivo) {
      setError("Error al subir archivo.");
      return;
    }

    const urlsImagenes = [];
    for (const img of imagenes) {
      const nombreImg = `${Date.now()}-${img.name}`;
      const { error: errorImg } = await supabase.storage
        .from("archivos-laser")
        .upload(`imagenes/${nombreImg}`, img);

      if (errorImg) {
        setError("Error al subir imágenes.");
        return;
      }

      urlsImagenes.push(`imagenes/${nombreImg}`);
    }

    const { error: errorInsert } = await supabase.from("archivos").insert({
      nombre,
      descripcion,
      precio: parseFloat(precio),
      archivo_url: `archivos/${archivoNombre}`,
      imagenes: urlsImagenes,
      categoria_id: categoriaSeleccionada,
      subcategoria_id: subcategoriaSeleccionada,
      created_by: userId,
    });

    if (errorInsert) {
      setError("Error al guardar en la base de datos.");
    } else {
      alert("Archivo subido correctamente.");
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setArchivo(null);
      setImagenes([]);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Subir nuevo archivo</h2>

      <input
        type="text"
        placeholder="Nombre del archivo"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="border p-2 w-full mb-2"
      />
      <textarea
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        className="border p-2 w-full mb-2"
      />
      <input
        type="number"
        placeholder="Precio"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        className="border p-2 w-full mb-2"
      />

      <select
        className="border p-2 w-full mb-2"
        onChange={(e) => {
          const val = e.target.value;
          if (val === "nueva") {
            setMostrarNuevaCategoria(true);
          } else {
            setCategoriaSeleccionada(val);
            setMostrarNuevaCategoria(false);
          }
        }}
      >
        <option value="">Seleccionar categoría principal</option>
        {categorias.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
        ))}
        <option value="nueva">+ Nueva categoría</option>
      </select>

      {mostrarNuevaCategoria && (
        <input
          type="text"
          placeholder="Nombre nueva categoría"
          value={nuevaCategoria}
          onChange={(e) => setNuevaCategoria(e.target.value)}
          onKeyDown={handleCrearCategoria}
          className="border p-2 w-full mb-2"
        />
      )}

      <select
        className="border p-2 w-full mb-2"
        onChange={(e) => {
          const val = e.target.value;
          if (val === "nueva") {
            setMostrarNuevaSubcategoria(true);
          } else {
            setSubcategoriaSeleccionada(val);
            setMostrarNuevaSubcategoria(false);
          }
        }}
      >
        <option value="">Seleccionar subcategoría</option>
        {subcategorias.map((sub) => (
          <option key={sub.id} value={sub.id}>{sub.nombre}</option>
        ))}
        <option value="nueva">+ Nueva subcategoría</option>
      </select>

      {mostrarNuevaSubcategoria && (
        <input
          type="text"
          placeholder="Nombre nueva subcategoría"
          value={nuevaSubcategoria}
          onChange={(e) => setNuevaSubcategoria(e.target.value)}
          onKeyDown={handleCrearSubcategoria}
          className="border p-2 w-full mb-2"
        />
      )}

      <label>Imágenes de referencia</label>
      <input
        type="file"
        multiple
        onChange={(e) => setImagenes(Array.from(e.target.files))}
        className="border p-2 w-full mb-2"
      />

      <label>Archivo real (.zip o .svg)</label>
      <input
        type="file"
        accept=".zip,.svg"
        onChange={(e) => setArchivo(e.target.files[0])}
        className="border p-2 w-full mb-2"
      />

      {error && <p className="text-red-600">{error}</p>}

      <button onClick={handleSubir} className="bg-blue-600 text-white w-full py-2 mt-2">
        Subir archivo
      </button>
    </div>
  );
};

export default SubirArchivo;
