import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import CarritoCompras from "../components/CarritoCompras";
import { useOutletContext } from 'react-router-dom';
import { useCarrito } from "../context/CarritoContext";

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
      }
    };

    cargarDatos();
  }, []);

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

                return (
                  <div
                    key={archivo.id}
                    className="block bg-white rounded shadow p-4 hover:shadow-lg transition-shadow duration-200"
                  >
                    <Link to={`/archivo/${archivo.id}`}>
                      <img
                        src={imageUrl}
                        alt={archivo.nombre}
                        className="h-48 w-full object-cover rounded mb-2"
                      />
                    </Link>
                    <h2 className="text-xl font-bold">{archivo.nombre}</h2>
                    <p className="text-sm text-gray-600">{archivo.descripcion}</p>
                    <p className="text-blue-600 font-bold mt-2">${archivo.precio}</p>

                    {accesoDescarga ? (
                      <Link
                        to={`/archivo/${archivo.id}`}
                        className="mt-2 inline-block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold"
                      >
                        Descargar
                      </Link>
                    ) : yaEstaEnCarrito ? (
                      <button
                        disabled
                        className="mt-2 bg-gray-400 text-white py-2 rounded w-full cursor-not-allowed"
                      >
                        Ya en el carrito
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          agregarAlCarrito({
                            producto_id: archivo.id,
                            nombre: archivo.nombre,
                            precio: archivo.precio,
                            tipo_producto: archivo.tipo || null,
                          })
                        }
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded w-full"
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
                    <h2 className="text-2xl font-bold">{categoria.nombre}</h2>
                    <button
                      onClick={() => setFiltroCategoria(categoria.id)}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      Ver todos →
                    </button>
                  </div>

                  <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
                    {archivosPorCategoria[categoria.id].map(archivo => {
                      const imageUrl = archivo.imagenes?.[0]
                        ? supabase.storage.from('archivos-laser').getPublicUrl(archivo.imagenes[0]).data.publicUrl
                        : 'https://via.placeholder.com/300x200';

                      const yaEstaEnCarrito = carrito.some(item => item.producto_id === archivo.id);
                      const accesoDescarga = tieneAccesoDescarga(archivo);

                      return (
                        <div
                          key={archivo.id}
                          className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md hover:shadow-lg transition"
                        >
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

                            {accesoDescarga ? (
                              <Link
                                to={`/archivo/${archivo.id}`}
                                className="mt-2 block text-center bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded font-semibold"
                              >
                                Descargar
                              </Link>
                            ) : yaEstaEnCarrito ? (
                              <button
                                disabled
                                className="mt-2 bg-gray-400 text-white py-1 px-2 rounded w-full cursor-not-allowed"
                              >
                                Ya en el carrito
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  agregarAlCarrito({
                                    producto_id: archivo.id,
                                    nombre: archivo.nombre,
                                    precio: archivo.precio,
                                    tipo_producto: archivo.tipo || null,
                                  })
                                }
                                className="mt-2 bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded w-full"
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