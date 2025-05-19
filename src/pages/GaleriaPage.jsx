// File: src/pages/GaleriaPage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import CarritoCompras from "../components/CarritoCompras";
import { useOutletContext } from 'react-router-dom';
import { useCarrito } from "../context/CarritoContext";
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline'; // Importamos icono de corazón vacío
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'; // Importamos icono de corazón lleno


const GaleriaPage = () => {
  const [archivos, setArchivos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  const {
    filtroCategoria,
    setFiltroCategoria,
    searchTerm,
    setSearchTerm
  } = useOutletContext();

  const { carrito, agregarAlCarrito } = useCarrito();

  const [usuario, setUsuario] = useState(null);
  const [allowedCategoryIds, setAllowedCategoryIds] = useState([]);
  const [descargasUsuario, setDescargasUsuario] = useState([]); // IDs de archivos descargados/comprados
  const [favoritosUsuario, setFavoritosUsuario] = useState([]); // IDs de archivos favoritos

  useEffect(() => {
    const cargarDatos = async () => {
      // Carga categorías
      const { data: categorias } = await supabase.from('categorias').select('*');
      setCategorias(categorias || []);

      // Carga archivos
      const { data: archivos } = await supabase
        .from('archivos')
        .select('id, nombre, descripcion, precio, imagenes, archivo_url, categoria_id')
        .order('creado_en', { ascending: false });
      setArchivos(archivos || []);

      // Carga usuario actual y sus datos de membresía
      const { data: { user } } = await supabase.auth.getUser();
      setUsuario(user);

      if (user) {
        // Obtener membresía del usuario
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

        // Obtener archivos que usuario ya descargó/compró
        const { data: descargas } = await supabase
          .from('descargas_usuario')
          .select('archivo_id')
          .eq('user_id', user.id);

        setDescargasUsuario(descargas ? descargas.map(d => d.archivo_id) : []);

        // Obtener archivos favoritos del usuario
        const { data: favoritos } = await supabase
          .from('favoritos_usuario')
          .select('archivo_id')
          .eq('user_id', user.id);

        setFavoritosUsuario(favoritos ? favoritos.map(f => f.archivo_id) : []);
      }
    };

    cargarDatos();
  }, []);

  // Función para manejar el toggle de favoritos
  const handleFavoriteToggle = async (archivoId) => {
    if (!usuario) {
      // Si no hay usuario logueado, podrías redirigir al login
      alert("Por favor, inicia sesión para agregar a favoritos.");
      return;
    }

    const isCurrentlyFavorite = favoritosUsuario.some(fav => fav.archivo_id === archivoId);

    if (isCurrentlyFavorite) {
      // Eliminar de favoritos
      const { error } = await supabase
        .from('favoritos_usuario')
        .delete()
        .eq('user_id', usuario.id)
        .eq('archivo_id', archivoId);

      if (error) {
        console.error('Error al eliminar de favoritos:', error);
      } else {
        setFavoritosUsuario(favoritosUsuario.filter(fav => fav.archivo_id !== archivoId));
      }
    } else {
      // Agregar a favoritos
      const { error } = await supabase
        .from('favoritos_usuario')
        .insert([{ user_id: usuario.id, archivo_id: archivoId }]);

      if (error) {
        console.error('Error al agregar a favoritos:', error);
      } else {
        setFavoritosUsuario([...favoritosUsuario, { archivo_id: archivoId }]);
      }
    }
  };


  const archivosFiltrados = filtroCategoria
    ? archivos.filter(a => a.categoria_id === filtroCategoria)
    : archivos;

  const archivosBuscados = searchTerm
    ? archivosFiltrados.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : archivosFiltrados;

  const archivosPorCategoria = categorias.reduce((acc, categoria) => {
    acc[categoria.id] = archivos.filter(a => a.categoria_id === categoria.id);
    return acc;
  }, {});

  // Función que determina si usuario tiene acceso para descargar
  const tieneAccesoDescarga = (archivo) => {
    if (!usuario || !archivo) return false;
    // Si archivo es gratis o ya descargado/comprado
    if (archivo.precio === 0 || descargasUsuario.includes(archivo.id)) return true;
    // Si usuario tiene membresía que da acceso a la categoría
    if (allowedCategoryIds.includes(archivo.categoria_id)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Carrito */}
      <CarritoCompras
        visible={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
      />

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {searchTerm || filtroCategoria ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">
                {searchTerm ? `Buscando: "${searchTerm}"` : 'Archivos filtrados'}
              </h1>
              <button
                onClick={() => { setSearchTerm(''); setFiltroCategoria(''); }}
                className="text-gray-600 hover:text-gray-900"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {archivosBuscados.map((archivo) => {
                const imageUrl = archivo.imagenes?.[0]
                  ? supabase.storage.from('archivos-laser').getPublicUrl(archivo.imagenes[0]).data.publicUrl
                  : 'https://via.placeholder.com/300x200';

                const yaEstaEnCarrito = carrito.some(item => item.producto_id === archivo.id);
                const accesoDescarga = tieneAccesoDescarga(archivo);
                const isFavorite = favoritosUsuario.some(fav => fav.archivo_id === archivo.id); // Verificar si es favorito

                return (
                  <div
                    key={archivo.id}
                    className="relative block bg-white rounded shadow p-4 hover:shadow-lg transition-shadow duration-200" // Añadimos relative para posicionar el botón de favorito
                  >
                    {/* Botón de favoritos en miniatura */}
                    {usuario && (
                      <button
                        className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-red-600 transition z-10" // Posicionamiento absoluto y estilos
                        onClick={() => handleFavoriteToggle(archivo.id)}
                        aria-label={isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                      >
                        {isFavorite ? (
                          <HeartIconSolid className="h-6 w-6 text-red-600" /> // Icono lleno si es favorito
                        ) : (
                          <HeartIconOutline className="h-6 w-6" /> // Icono vacío si no es favorito
                        )}
                      </button>
                    )}

                    <Link to={`/archivo/${archivo.id}`}>
                      <img
                        src={imageUrl}
                        alt={archivo.nombre}
                        className="h-48 w-full object-cover rounded mb-2"
                      />
                    </Link>
                    <h2 className="text-xl font-bold truncate">{archivo.nombre}</h2> {/* Truncamos el nombre si es muy largo */}
                    <p className="text-sm text-gray-600 line-clamp-2">{archivo.descripcion}</p> {/* Limitamos la descripción a 2 líneas */}
                    <p className="text-blue-600 font-bold mt-2">${archivo.precio}</p>

                    {!usuario ? ( // Si no hay usuario logueado
                      <button
                        onClick={() => navigate('/login', { state: { from: `/archivo/${archivo.id}` } })}
                        className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-xl font-semibold transition duration-300 ease-in-out transform hover:scale-105"
                      >
                        Iniciar sesión
                      </button>
                    ) : yaEstaEnCarrito ? (
                      // Si ya está en el carrito (y usuario logueado)
                      <button
                        disabled
                        className="mt-4 bg-gray-400 text-white py-2 rounded w-full cursor-not-allowed font-semibold"
                      >
                        Ya en el carrito
                      </button>
                    ) : accesoDescarga ? (
                      // Si tiene acceso de descarga (y usuario logueado, y no está en carrito)
                      <Link
                        to={`/archivo/${archivo.id}`}
                        className="mt-4 inline-block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold transition duration-300 ease-in-out transform hover:scale-105"
                      >
                        Descargar
                      </Link>
                    ) : (
                      // Si no tiene acceso de descarga ni está en carrito (y usuario logueado)
                      <button
                        onClick={() =>
                          agregarAlCarrito({
                            producto_id: archivo.id,
                            nombre: archivo.nombre,
                            precio: archivo.precio,
                            tipo_producto: archivo.tipo || null,
                          })
                        }
                        className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded w-full font-semibold transition duration-300 ease-in-out transform hover:scale-105"
                      >
                        Agregar al carrito
                      </button>
                     )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            {categorias.map(categoria => (
              archivosPorCategoria[categoria.id]?.length > 0 && (
                <div key={categoria.id} className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{categoria.nombre}</h2> {/* Estilo para el título de la categoría */}
                    <button
                      onClick={() => setFiltroCategoria(categoria.id)}
                      className="text-sm text-purple-600 hover:text-purple-800 font-semibold" // Estilo para el botón "Ver todos"
                    >
                      Ver todos →
                    </button>
                  </div>

                  <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide"> {/* scrollbar-hide para ocultar la barra de scroll si es necesario */}
                    {archivosPorCategoria[categoria.id].map(archivo => {
                      const imageUrl = archivo.imagenes?.[0]
                        ? supabase.storage.from('archivos-laser').getPublicUrl(archivo.imagenes[0]).data.publicUrl
                        : 'https://via.placeholder.com/300x200';

                      const yaEstaEnCarrito = carrito.some(item => item.producto_id === archivo.id);
                      const accesoDescarga = tieneAccesoDescarga(archivo);
                      const isFavorite = favoritosUsuario.some(fav => fav.archivo_id === archivo.id); // Verificar si es favorito

                      return (
                        <div
                          key={archivo.id}
                          className="relative flex-shrink-0 w-64 bg-white rounded-lg shadow-md hover:shadow-lg transition" // Añadimos relative
                        >
                           {/* Botón de favoritos en miniatura */}
                          {usuario && (
                            <button
                              className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-red-600 transition z-10" // Posicionamiento absoluto y estilos
                              onClick={() => handleFavoriteToggle(archivo.id)}
                              aria-label={isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                            >
                              {isFavorite ? (
                                <HeartIconSolid className="h-6 w-6 text-red-600" /> // Icono lleno si es favorito
                              ) : (
                                <HeartIconOutline className="h-6 w-6" /> // Icono vacío si no es favorito
                              )}
                            </button>
                          )}
                          <Link to={`/archivo/${archivo.id}`}>
                            <img
                              src={imageUrl}
                              alt={archivo.nombre}
                              className="w-full h-36 object-cover rounded-t-lg"
                            />
                          </Link>
                          <div className="p-3">
                            <h3 className="font-semibold truncate">{archivo.nombre}</h3>
                            <p className="text-purple-600 font-bold">${archivo.precio}</p>

                            {!usuario ? ( // Si no hay usuario logueado
                              <button
                                onClick={() => navigate('/login', { state: { from: `/archivo/${archivo.id}` } })}
                                className="mt-2 w-full bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 font-semibold transition duration-300 ease-in-out transform hover:scale-105"
                              >
                                Iniciar sesión
                              </button>
                            ) : yaEstaEnCarrito ? (
                              // Si ya está en el carrito (y usuario logueado)
                              <button
                                disabled
                                className="mt-2 bg-gray-400 text-white py-1 px-2 rounded w-full cursor-not-allowed font-semibold"
                              >
                                Ya en el carrito
                              </button>
                            ) : accesoDescarga ? (
                              // Si tiene acceso de descarga (y usuario logueado, y no está en carrito)
                              <Link
                                to={`/archivo/${archivo.id}`}
                                className="mt-2 block text-center bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded font-semibold transition duration-300 ease-in-out transform hover:scale-105"
                              >
                                Descargar
                              </Link>
                            ) : (
                              // Si no tiene acceso de descarga ni está en carrito (y usuario logueado)
                              <button
                                onClick={() =>
                                  agregarAlCarrito({
                                    producto_id: archivo.id,
                                    nombre: archivo.nombre,
                                    precio: archivo.precio,
                                    tipo_producto: archivo.tipo || null,
                                  })
                                }
                                className="mt-2 bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded w-full font-semibold transition duration-300 ease-in-out transform hover:scale-105"
                              >
                                Agregar al carrito
                              </button>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
  </main>
</div>
);
};

export default GaleriaPage;
