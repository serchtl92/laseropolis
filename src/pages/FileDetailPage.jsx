// File: src/pages/FileDetailPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useCarrito } from "../context/CarritoContext";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';


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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const thumbnailsRef = useRef(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError(null);
      setArchivo(null);
      setUsuario(null);
      setAllowedCategoryIds([]);
      setHasDownloaded(false);
      setIsFavorite(false);

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
      setCurrentImageIndex(0);

      if (user) {
        const { data: favoriteData, error: favoriteError } = await supabase
          .from('favoritos_usuario')
          .select('id')
          .eq('user_id', user.id)
          .eq('archivo_id', id)
          .single();

        if (favoriteError && favoriteError.code !== 'PGRST116') {
          console.error('Error al verificar favoritos:', favoriteError);
        } else if (favoriteData) {
          setIsFavorite(true);
        }


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

  useEffect(() => {
    if (thumbnailsRef.current && archivo?.imagenes?.length > 0 && currentImageIndex >= 0 && currentImageIndex < archivo.imagenes.length) {
      const currentThumbnail = thumbnailsRef.current.children[currentImageIndex];
      if (currentThumbnail) {
        currentThumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentImageIndex, archivo]);


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

  const handleFavoriteToggle = async () => {
    if (!usuario || !archivo) return;

    setLoading(true);

    if (isFavorite) {
      const { error } = await supabase
        .from('favoritos_usuario')
        .delete()
        .eq('user_id', usuario.id)
        .eq('archivo_id', archivo.id);

      if (error) {
        console.error('Error al eliminar de favoritos:', error);
      } else {
        setIsFavorite(false);
      }
    } else {
      const { error } = await supabase
        .from('favoritos_usuario')
        .insert([{ user_id: usuario.id, archivo_id: archivo.id }]);

      if (error) {
        console.error('Error al agregar a favoritos:', error);
      } else {
        setIsFavorite(true);
      }
    }
    setLoading(false);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === (archivo.imagenes.length || 0) - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? (archivo.imagenes.length || 0) - 1 : prevIndex - 1
    );
  };

  const renderButton = () => {
    if (loading) {
      return <button className="mt-6 w-full bg-gray-400 text-white py-3 rounded text-xl font-semibold cursor-not-allowed">Cargando...</button>;
    }

    if (error) {
      return null;
    }

    if (!usuario) {
      const redirectTo = location.pathname;
      return (
        <button
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 text-xl font-semibold transition duration-300 ease-in-out transform hover:scale-105"
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
            className={`mt-6 w-full bg-purple-600 text-white py-3 rounded text-xl font-semibold transition duration-300 ease-in-out transform hover:scale-105 ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Descargando...' : 'Descargar Archivo'}
          </button>
        );
      } else if (yaEstaEnCarrito) {
        return (
          <button
            className="mt-6 w-full bg-gray-400 text-white py-3 rounded text-xl font-semibold cursor-not-allowed"
            disabled
          >
            En el carrito
          </button>
        );
      } else {
        return (
          <button
  className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded text-xl font-semibold transition duration-300 ease-in-out transform hover:scale-105"
  onClick={() => agregarAlCarrito({
    producto_id: archivo.id,
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

  const currentImageUrl = archivo?.imagenes && archivo.imagenes.length > 0
    ? supabase.storage.from('archivos-laser').getPublicUrl(archivo.imagenes[currentImageIndex]).data.publicUrl
    : 'https://via.placeholder.com/600x400';


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {loading && <div className="text-center mt-8">Cargando...</div>}
      {error && <div className="text-center mt-8 text-red-600">Error al cargar el archivo: {error.message}</div>}

      {!loading && !error && archivo && (
        <>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">{archivo.nombre}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Sección del Carrusel e Miniaturas */}
            <div>
              <div className="relative mb-4 rounded-lg shadow-lg overflow-hidden">
                <img
                  src={currentImageUrl}
                  alt={archivo.nombre}
                  className="w-full h-96 object-cover"
                />
                {/* Botones de navegación del carrusel */}
                {archivo.imagenes && archivo.imagenes.length > 1 && (
                  <>
                    <button
                      className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full opacity-70 hover:opacity-100 transition"
                      onClick={handlePreviousImage}
                    >
                      <ChevronLeftIcon className="h-7 w-7" />
                    </button>
                    <button
                      className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full opacity-70 hover:opacity-100 transition"
                      onClick={handleNextImage}
                    >
                      <ChevronRightIcon className="h-7 w-7" />
                    </button>
                  </>
                )}
              </div>
              {/* Miniaturas */}
              {archivo.imagenes && archivo.imagenes.length > 0 && (
                <div ref={thumbnailsRef} className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-200">
                  {archivo.imagenes.map((imagenUrl, index) => (
                    <img
                      key={index}
                      src={supabase.storage.from('archivos-laser').getPublicUrl(imagenUrl).data.publicUrl}
                      alt={`Miniatura ${index + 1}`}
                      className={`w-24 h-24 object-cover rounded-md cursor-pointer transition transform hover:scale-105 ${index === currentImageIndex ? 'border-4 border-blue-600 shadow-md' : 'border border-gray-300'}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Sección de Información del Archivo */}
            <div>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">{archivo.descripcion}</p>

              <div className="flex items-center mb-6">
                <p className="text-3xl font-bold text-blue-700 mr-4">${archivo.precio}</p>
                {usuario ? (
                  <button
                    className="p-2 rounded-full text-gray-500 hover:text-red-600 transition duration-300"
                    onClick={handleFavoriteToggle}
                    aria-label={isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                  >
                    {isFavorite ? (
                      <HeartIconSolid className="h-9 w-9 text-red-600" />
                    ) : (
                      <HeartIconOutline className="h-9 w-9 text-gray-500" />
                    )}
                  </button>
                ) : null}
              </div>
              {renderButton()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FileDetailPage;
