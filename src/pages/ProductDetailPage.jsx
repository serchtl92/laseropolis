// File: src/pages/ProductDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useCarrito } from '../context/CarritoContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [descuento, setDescuento] = useState(0);
  const { agregarAlCarrito, carrito } = useCarrito();

  useEffect(() => {
    const fetchProducto = async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al obtener el producto:', error);
        return;
      }

      const imagenRuta = data.imagenes?.[0];
      const { data: publicUrlData } = supabase
        .storage
        .from('archivos-laser')
        .getPublicUrl(imagenRuta);

      setProducto({
        ...data,
        imagenUrl: publicUrlData?.publicUrl || '/placeholder.png',
      });

      // Cargar categoría
      const { data: cat } = await supabase
        .from('categorias')
        .select('*')
        .eq('id', data.categoria_id)
        .single();

      setCategoria(cat);
    };

    const fetchDescuento = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: userData } = await supabase
        .from('usuarios')
        .select('membresia_id')
        .eq('id', user.id)
        .single();

      if (userData?.membresia_id) {
        const { data: membresia } = await supabase
          .from('membresias')
          .select('porcentaje_descuento')
          .eq('id', userData.membresia_id)
          .single();

        if (membresia?.porcentaje_descuento) {
          setDescuento(membresia.porcentaje_descuento);
        }
      }
    };

    fetchProducto();
    fetchDescuento();
  }, [id]);

  if (!producto) {
    return <div className="p-4">Cargando producto...</div>;
  }

  const precioFinal = Math.max(
    0,
    producto.precio - (producto.precio * descuento) / 100
  ).toFixed(2);

  const enCarrito = carrito.some(item => item.producto_id === producto.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <img
          src={producto.imagenUrl}
          alt={producto.nombre}
          className="w-full h-96 object-cover rounded"
        />

        <div>
          <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
          {categoria && (
            <p className="text-sm text-gray-500 mb-4">{categoria.nombre}</p>
          )}
          <p className="text-gray-700 mb-4">{producto.descripcion}</p>

          <div className="mb-2">
            <span className="text-green-700 font-bold text-xl">${precioFinal}</span>
            {descuento > 0 && (
              <span className="text-gray-500 line-through ml-2">${producto.precio}</span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {producto.modo_produccion === 'stock'
              ? 'Producto disponible en inventario.'
              : 'Producto hecho a pedido. Tiempo de entrega adicional.'}
          </p>

          {enCarrito ? (
            <button
              disabled
              className="bg-gray-400 text-white py-2 px-4 rounded cursor-not-allowed"
            >
              Ya en el carrito
            </button>
          ) : (
            <button
              onClick={() =>
                agregarAlCarrito({
                  producto_id: producto.id,
                  nombre: producto.nombre,
                  precio: precioFinal,
                  tipo_producto: 'fisico',
                })
              }
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Agregar al carrito
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
