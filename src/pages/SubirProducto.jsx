import React, { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";

const SubirProducto = () => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [modoProduccion, setModoProduccion] = useState("stock");
  const [imagenes, setImagenes] = useState([]);

  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState("");

  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verificarAcceso = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/");

      const { data, error } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

      if (error || data?.rol !== "admin") navigate("/");
    };

    verificarAcceso();
    obtenerCategorias();
    obtenerSubcategorias();
  }, []);

  const obtenerCategorias = async () => {
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .order("nombre", { ascending: true });
    setCategorias(data || []);
  };

  const obtenerSubcategorias = async () => {
    const { data } = await supabase
      .from("subcategorias")
      .select("*")
      .order("nombre", { ascending: true });
    setSubcategorias(data || []);
  };

  const handleSubir = async () => {
    setError("");

    if (!nombre || !precio || !modoProduccion || !categoriaSeleccionada || !subcategoriaSeleccionada) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    const { data: session } = await supabase.auth.getUser();
    const userId = session?.user?.id;
    if (!userId) {
      setError("No autorizado.");
      return;
    }

    const urlsImagenes = [];
    for (const img of imagenes) {
      const nombreImg = `${Date.now()}-${img.name}`;
      const { error: errorImg } = await supabase.storage
        .from("archivos-laser")
        .upload(`imagenes/${nombreImg}`, img);
      if (errorImg) {
        setError("Error al subir una imagen.");
        return;
      }
      urlsImagenes.push(`imagenes/${nombreImg}`);
    }

    const { error: errorInsert } = await supabase.from("productos").insert({
      nombre,
      descripcion,
      precio: parseFloat(precio),
      modo_produccion: modoProduccion,
      imagenes: urlsImagenes,
      categoria_id: categoriaSeleccionada,
      subcategoria_id: subcategoriaSeleccionada,
      created_by: userId,
    });
if (errorInsert) {
  console.error(errorInsert);
  setError("Error al guardar el producto: " + errorInsert.message);
}

     else {
      alert("Producto subido correctamente.");
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setModoProduccion("stock");
      setImagenes([]);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Subir producto físico</h2>

      <input
        type="text"
        placeholder="Nombre del producto"
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
        value={modoProduccion}
        onChange={(e) => setModoProduccion(e.target.value)}
        className="border p-2 w-full mb-2"
      >
        <option value="stock">Stock</option>
        <option value="a_pedido">A pedido</option>
      </select>

      <select
        value={categoriaSeleccionada}
        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
        className="border p-2 w-full mb-2"
      >
        <option value="">Seleccionar categoría</option>
        {categorias.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
        ))}
      </select>

      <select
        value={subcategoriaSeleccionada}
        onChange={(e) => setSubcategoriaSeleccionada(e.target.value)}
        className="border p-2 w-full mb-2"
      >
        <option value="">Seleccionar subcategoría</option>
        {subcategorias.map((sub) => (
          <option key={sub.id} value={sub.id}>{sub.nombre}</option>
        ))}
      </select>

      <label className="block">Imágenes del producto</label>
      <input
        type="file"
        multiple
        onChange={(e) => setImagenes(Array.from(e.target.files))}
        className="border p-2 w-full mb-2"
      />

      {error && <p className="text-red-600">{error}</p>}

      <button
        onClick={handleSubir}
        className="bg-blue-600 text-white w-full py-2 mt-2"
      >
        Subir producto
      </button>
    </div>
  );
};

export default SubirProducto;
