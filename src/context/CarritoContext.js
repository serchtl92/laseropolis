import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from '../supabase/client';

const CarritoContext = createContext();

export const CarritoProvider = ({ children }) => {
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    const cargarCarritoDesdeDB = async (user) => {
      const { data, error } = await supabase
        .from('carrito_compras')
        .select('*')
        .eq('usuario_id', user.id);

      if (!error) setCarrito(data || []);
    };

    const getSessionAndLoadCarrito = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await cargarCarritoDesdeDB(session.user);
      }
    };

    getSessionAndLoadCarrito();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        cargarCarritoDesdeDB(session.user);
      } else {
        setCarrito([]);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const agregarAlCarrito = async (producto) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert y obtener el registro completo para tener el id
    const { data, error } = await supabase
      .from('carrito_compras')
      .upsert({
        usuario_id: user.id,
        producto_id: producto.producto_id,
        nombre: producto.nombre,
        precio: producto.precio,
        tipo_producto: producto.tipo_producto || null,
        cantidad: 1,
      })
      .select()
      .single();

    if (!error && data) {
      setCarrito((prev) => {
        if (prev.some(item => item.producto_id === data.producto_id)) return prev;
        return [...prev, data];
      });
    }
  };

  const eliminarDelCarrito = async (itemId) => {
    const { error } = await supabase
      .from('carrito_compras')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error eliminando del carrito:', error);
    } else {
      setCarrito(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const limpiarCarrito = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('carrito_compras')
      .delete()
      .eq('usuario_id', user.id);

    setCarrito([]);
  };

  return (
    <CarritoContext.Provider
      value={{ carrito, agregarAlCarrito, eliminarDelCarrito, limpiarCarrito }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => useContext(CarritoContext);
