import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';

const CrearTienda = () => {
  const [nombreTienda, setNombreTienda] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [errorTerminos, setErrorTerminos] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!terminosAceptados) {
      setErrorTerminos(true);
      return;
    }

    setError('');
    try {
      const user = (await supabase.auth.getUser()).data.user;

      // 1) Buscar vendedor existente por user_id
      let { data: vendedor, error: errorVendedor } = await supabase
        .from('vendedores')
        .select('*')
        .eq('usuario_id', user.id)
        .single();

      if (errorVendedor && errorVendedor.code !== 'PGRST116') {
        throw errorVendedor;
      }

      // 2) Si no existe vendedor, crearlo
      if (!vendedor) {
        const { data: nuevoVendedor, error: errorCrearVendedor } = await supabase
          .from('vendedores')
          .insert([{ usuario_id: user.id, fecha_registro: new Date().toISOString() }])
          .select()
          .single();

        if (errorCrearVendedor) {
          throw errorCrearVendedor;
        }

        vendedor = nuevoVendedor;
      }

      // 3) Crear tienda con vendedor_id (NO user_id)
      const { error: errorCrearTienda } = await supabase.from('tiendas').insert([
        {
          nombre: nombreTienda,
          descripcion,
          vendedor_id: vendedor.id,
        },
      ]);

      if (errorCrearTienda) {
        throw errorCrearTienda;
      }

      navigate('/profile');
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al crear la tienda. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 text-center text-purple-700">Conviértete en Vendedor</h1>

      <div className="bg-purple-50 p-6 rounded-2xl shadow-md mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-purple-800">¿Qué necesitas?</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Tener una cuenta activa en LaserOpolis</li>
          <li>Contar con productos físicos o digitales originales</li>
          <li>Rellenar el formulario de solicitud de tienda</li>
        </ul>

        <h2 className="text-xl font-semibold text-purple-800 mt-6">Ventajas de ser vendedor</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Gana dinero con cada venta</li>
          <li>Acceso a panel exclusivo de vendedores</li>
          <li>Promoción de tus productos dentro de LaserOpolis</li>
          <li>Soporte técnico y acompañamiento</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4 border">
        <h2 className="text-2xl font-semibold mb-2 text-gray-800">Formulario para Crear Tienda</h2>

        {error && <p className="text-red-500">{error}</p>}

        <div>
          <label className="block text-gray-700">Nombre de la tienda:</label>
          <input
            type="text"
            value={nombreTienda}
            onChange={(e) => setNombreTienda(e.target.value)}
            required
            className="w-full border border-gray-300 p-2 rounded-lg mt-1"
          />
        </div>

        <div>
          <label className="block text-gray-700">Descripción:</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            className="w-full border border-gray-300 p-2 rounded-lg mt-1"
          ></textarea>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terminos"
            checked={terminosAceptados}
            onChange={(e) => {
              setTerminosAceptados(e.target.checked);
              setErrorTerminos(false);
            }}
            className="mt-1"
          />
          <label htmlFor="terminos" className="text-sm text-gray-700">
            He leído y acepto los{' '}
            <a href="/terminos-condiciones" target="_blank" className="text-blue-600 underline">
              Términos y Condiciones
            </a>
          </label>
        </div>
        {errorTerminos && (
          <p className="text-red-500 text-sm">Debes aceptar los términos y condiciones.</p>
        )}

        <button
          type="submit"
          className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
        >
          Crear mi Tienda
        </button>
      </form>
    </div>
  );
};

export default CrearTienda;
