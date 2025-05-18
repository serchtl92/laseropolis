// File: src/pages/FileDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useCarrito } from "../context/CarritoContext";

const FileDetailPage = () => {
  const { carrito, agregarAlCarrito } = useCarrito();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [archivo, setArchivo] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [allowedCategoryIds, setAllowedCategoryIds] = useState([]);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError(null);
      setArchivo(null);
      setUsuario(null);
      setAllowedCategoryIds([]);
      setHasDownloaded(false);

      const { data: { user } } = await supabase.auth.getUser();
      setUsuario(user);

      const { data: fileData, error: fileError } = await supabase
        .from('archivos')
        .select('id, nombre, descripcion, precio, imagenes, archivo_url, categoria_id, subcategoria_id')
        .eq('id', id)
        .single();

      if (fileError) {
        setError(fileError);
        setLoading(false);
        return;
      }

      setArchivo(fileData);

      if (user) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('membresia_id')
          .eq('id', user.id)
          .single();

        if (userData?.membresia_id) {
          const { data: allowedCatsData } = await supabase
            .from('membresia_categoria')
            .select('categoria_id')
            .eq('membresia_id', userData.membresia_id);

          const categoryIds = allowedCatsData.map(item => item.categoria_id);
          setAllowedCategoryIds(categoryIds);
        }

        const { data: downloadRecord } = await supabase
          .from('descargas_usuario')
          .select('id')
          .eq('user_id', user.id)
          .eq('archivo_id', id)
          .single();

        if (downloadRecord) {
          setHasDownloaded(true);
        }
      }

      setLoading(false);
    };

    if (id) {
      cargarDatos();
    }
  }, [id]);

  const tieneAccesoPorSuscripcion = () => {
    return usuario && archivo && archivo.precio > 0 && allowedCategoryIds.includes(archivo.categoria_id);
  };

  const tieneAccesoTotal = () => {
    return archivo && (archivo.precio === 0 || hasDownloaded || tieneAccesoPorSuscripcion());
  };

  const handleDownload = async () => {
    if (!archivo?.archivo_url) {
      alert('No se encontró la URL del archivo para descargar.');
      return;
    }

    setIsDownloading(true);

    try {
      const { data, error } = supabase.storage
        .from('archivos-laser')
        .getPublicUrl(archivo.archivo_url);

      if (error) {
        alert('Error al obtener la URL de descarga.');
        setIsDownloading(false);
        return;
      }

      const publicUrl = data.publicUrl;

      if (usuario) {
        await supabase
          .from('descargas_usuario')
          .insert([{ user_id: usuario.id, archivo_id: archivo.id }]);
        setHasDownloaded(true);
      }

      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = archivo.nombre || 'archivo_descarga';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      alert('Ocurrió un error durante la descarga.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderButton = () => {
    if (loading) {
      return <button className="mt-4 w-full bg-gray-400 text-white py-3 rounded text-xl font-semibold cursor-not-allowed">Cargando...</button>;
    }

    if (error) {
      return null;
    }

    if (!usuario) {
      const redirectTo = location.pathname;
      return (
        <button
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 text-xl font-semibold"
          onClick={() => navigate('/login', { state: { from: redirectTo } })}
        >
          Iniciar sesión para comprar/descargar
        </button>
      );
    } else {
      const yaEstaEnCarrito = archivo && carrito.some(item => item.producto_id === archivo.id);


      if (tieneAccesoTotal()) {
        return (
          <button
            className={`mt-4 w-full bg-purple-600 text-white py-3 rounded text-xl font-semibold ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Descargando...' : 'Descargar Archivo'}
          </button>
        );
      } else if (yaEstaEnCarrito) {
        return (
          <button
            className="mt-4 w-full bg-gray-400 text-white py-3 rounded text-xl font-semibold cursor-not-allowed"
            disabled
          >
            En el carrito
          </button>
        );
      } else {
        return (
          <button
  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded text-xl font-semibold"
  onClick={() => agregarAlCarrito({
    producto_id: archivo.id,  // cambio aquí
    nombre: archivo.nombre,
    precio: archivo.precio,
  })}
>
  Agregar al carrito
</button>

        );
      }
    }
  };

  if (!archivo && !loading && !error) {
    return <div className="text-center mt-8">Archivo no encontrado.</div>;
  }

  const imageUrl = archivo?.imagenes && archivo.imagenes.length > 0
    ? supabase.storage.from('archivos-laser').getPublicUrl(archivo.imagenes[0]).data.publicUrl
    : 'https://via.placeholder.com/600x400';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {loading && <div className="text-center mt-8">Cargando...</div>}
      {error && <div className="text-center mt-8 text-red-600">Error al cargar el archivo: {error.message}</div>}

      {!loading && !error && archivo && (
        <>
          <h1 className="text-3xl font-bold mb-4">{archivo.nombre}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <img
                src={imageUrl}
                alt={archivo.nombre}
                className="w-full h-auto object-cover rounded shadow"
              />
            </div>
            <div>
              <p className="text-lg text-gray-700 mb-4">{archivo.descripcion}</p>
              <p className="text-2xl font-bold text-blue-600 mb-4">${archivo.precio}</p>
              {renderButton()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FileDetailPage;
