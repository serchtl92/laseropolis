import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import CarritoCompras from "../components/CarritoCompras";
import { useOutletContext } from 'react-router-dom';
import { useCarrito } from "../context/CarritoContext";

const TiendaPage = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const navigate = useNavigate();
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
  const [comprasUsuario, setComprasUsuario] = useState([]); // IDs productos comprados

  useEffect(() => {
    const cargarDatos = async () => {
      // Carga categorías
      const { data: categoriasData } = await supabase.from('categorias').select('*');
      setCategorias(categoriasData || []);

      // Carga productos
      const { data: productosData } = await supabase
        .from('productos')
        .select('id, nombre, descripcion, precio, imagenes, categoria_id')
        .order('created_by', { ascending: false });
      setProductos(productosData || []);

      // Usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      setUsuario(user);

      if (user) {
        // Obtener membresía del usuario (igual que en galería)
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

        // Obtener productos ya comprados
        const { data: compras } = await supabase
          .from('compras_usuario')
          .select('producto_id')
          .eq('user_id', user.id);

        setComprasUsuario(compras ? compras.map(c => c.producto_id) : []);
      }
    };

    cargarDatos();
  }, []);

  // Filtrar productos por categoría y búsqueda
  const productosFiltrados = filtroCategoria
    ? productos.filter(p => p.categoria_id === filtroCategoria)
    : productos;

  const productosBuscados = searchTerm
    ? productosFiltrados.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : productosFiltrados;

  const productosPorCategoria = categorias.reduce((acc, categoria) => {
    acc[categoria.id] = productos.filter(p => p.categoria_id === categoria.id);
    return acc;
  }, {});

  // Si el usuario tiene acceso a la categoría o ya compró el producto
  const tieneAccesoCompra = (producto) => {
    if (!usuario || !producto) return false;
    if (producto.precio === 0 || comprasUsuario.includes(producto.id)) return true;
    if (allowedCategoryIds.includes(producto.categoria_id)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <CarritoCompras
        visible={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
      />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {(searchTerm || filtroCategoria) ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">
                {searchTerm ? `Buscando: "${searchTerm}"` : 'Productos filtrados'}
              </h1>
              <button
                onClick={() => { setSearchTerm(''); setFiltroCategoria(''); }}
                className="text-gray-600 hover:text-gray-900"
              >
                Limpiar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {productosBuscados.map((producto) => {
                const imageUrl = producto.imagenes?.[0]
                  ? supabase.storage.from('archivos-laser').getPublicUrl(producto.imagenes[0]).data.publicUrl
                  : 'https://via.placeholder.com/300x200';

                const yaEstaEnCarrito = carrito.some(item => item.producto_id === producto.id);
                const accesoCompra = tieneAccesoCompra(producto);

                return (
                  <div
                    key={producto.id}
                    className="block bg-white rounded shadow p-4 hover:shadow-lg transition-shadow duration-200"
                  >
                    <Link to={`/producto/${producto.id}`}>
                      <img
                        src={imageUrl}
                        alt={producto.nombre}
                        className="h-48 w-full object-cover rounded mb-2"
                      />
                    </Link>
                    <h2 className="text-xl font-bold">{producto.nombre}</h2>
                    <p className="text-sm text-gray-600">{producto.descripcion}</p>
                    <p className="text-blue-600 font-bold mt-2">${producto.precio}</p>

                    {accesoCompra ? (
                      <Link
                        to={`/producto/${producto.id}`}
                        className="mt-2 inline-block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold"
                      >
                        Ver detalles
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
                            producto_id: producto.id,
                            nombre: producto.nombre,
                            precio: producto.precio,
                            tipo_producto: producto.tipo || null,
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
              productosPorCategoria[categoria.id]?.length > 0 && (
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
                    {productosPorCategoria[categoria.id].map(producto => {
                      const imageUrl = producto.imagenes?.[0]
                        ? supabase.storage.from('archivos-laser').getPublicUrl(producto.imagenes[0]).data.publicUrl
                        : 'https://via.placeholder.com/300x200';

                      const yaEstaEnCarrito = carrito.some(item => item.producto_id === producto.id);
                      const accesoCompra = tieneAccesoCompra(producto);

                      return (
                        <div
                          key={producto.id}
                          className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md hover:shadow-lg transition"
                        >
                          <Link to={`/producto/${producto.id}`}>
                            <img
                              src={imageUrl}
                              alt={producto.nombre}
                              className="w-full h-36 object-cover rounded-t-lg"
                            />
                          </Link>
                          <div className="p-3">
                            <h3 className="font-semibold truncate">{producto.nombre}</h3>
                            <p className="text-purple-600 font-bold">${producto.precio}</p>

                            {accesoCompra ? (
                              <Link
                                to={`/producto/${producto.id}`}
                                className="mt-2 block text-center bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded font-semibold"
                              >
                                Ver detalles
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
                                    producto_id: producto.id,
                                    nombre: producto.nombre,
                                    precio: producto.precio,
                                    tipo_producto: producto.tipo || null,
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

export default TiendaPage;
