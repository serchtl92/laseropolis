import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

const MembresiasPage = () => {
  const [membresias, setMembresias] = useState([]);
  const [userMembership, setUserMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [selectedMembresia, setSelectedMembresia] = useState(null);
  const navigate = useNavigate();

  // Inicializar Mercado Pago (REEMPLAZA TU_PUBLIC_KEY_MERCADO_PAGO)
  useEffect(() => {
    initMercadoPago('TU_PUBLIC_KEY_MERCADO_PAGO');
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: membresiasData } = await supabase
          .from('membresias')
          .select('*')
          .order('precio', { ascending: true });

        const { data: membershipData } = await supabase
          .from('membresias_usuarios')
          .select(`
            id,
            membresia_id,
            fecha_inicio,
            fecha_vencimiento,
            activa,
            membresias: membresia_id (nombre, precio, descripcion, duracion_dias, limite_descargas)
          `)
          .eq('usuario_id', user.id)
          .eq('activa', true)
          .single();

        const { data: pagosData } = await supabase
          .from('pagos')
          .select('id, monto, fecha, estado, metodo_pago')
          .eq('usuario_id', user.id);

        setMembresias(membresiasData || []);
        setUserMembership(membershipData || null);
        setPagos(pagosData || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { state: { returnTo: '/membresias' } });
  }, [loading, user, navigate]);

  const createMercadoPagoPreference = async (membresiaId) => {
    try {
      const { data: membresia } = await supabase
        .from('membresias')
        .select('precio')
        .eq('id', membresiaId)
        .single();

      // Necesitarás implementar este endpoint en tu backend
      const response = await fetch('TU_ENDPOINT_BACKEND', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Membresía ${membresiaId}`,
          unit_price: membresia.precio,
          quantity: 1
        })
      });
      
      return (await response.json()).id;
    } catch (error) {
      console.error('Error creando preferencia:', error);
      throw error;
    }
  };

  const handlePaymentSuccess = async (membresiaId, metodoPago) => {
    try {
      const membresia = membresias.find(m => m.id === membresiaId);
      
      // Registrar pago
      await supabase.from('pagos').insert([{
        usuario_id: user.id,
        membresia_id: membresiaId,
        monto: membresia.precio,
        metodo_pago: metodoPago,
        estado: 'completado'
      }]);

      // Calcular nueva fecha de vencimiento
      let fechaVencimiento = new Date();
      if (userMembership?.fecha_vencimiento > new Date()) {
        fechaVencimiento = new Date(userMembership.fecha_vencimiento);
      }
      fechaVencimiento.setDate(fechaVencimiento.getDate() + membresia.duracion_dias);

      // Actualizar membresía
      const { data } = await supabase
        .from('membresias_usuarios')
        .upsert({
          usuario_id: user.id,
          membresia_id: membresiaId,
          fecha_vencimiento: fechaVencimiento.toISOString(),
          activa: true
        }, { onConflict: 'usuario_id' })
        .select('*')
        .single();

      setUserMembership(data);
      navigate('/pago-exitoso');

    } catch (error) {
      console.error('Error procesando pago:', error);
      navigate('/pago-fallido');
    }
  };

  const cancelarMembresia = async () => {
    if (!userMembership?.id || !confirm('¿Cancelar membresía?')) return;
    
    try {
      await supabase
        .from('membresias_usuarios')
        .update({ activa: false })
        .eq('id', userMembership.id);
      
      setUserMembership(null);
      alert('Membresía cancelada exitosamente');
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div className="text-center py-12">Cargando...</div>;
  if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Membresías Disponibles</h1>

      {userMembership && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg">{userMembership.membresias?.nombre}</h2>
              <p className="text-sm text-gray-600 mt-2">
                Vence el {new Date(userMembership.fecha_vencimiento).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={cancelarMembresia}
              className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200"
            >
              Cancelar membresía
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {membresias.map(membresia => (
          <div key={membresia.id} className="border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold mb-2">{membresia.nombre}</h3>
            <p className="text-gray-600 mb-4">{membresia.descripcion}</p>
            
            <div className="mb-4">
              <p className="text-2xl font-bold">${membresia.precio}</p>
              <div className="text-sm space-y-1 mt-2">
                <p><span className="font-medium">Duración:</span> {membresia.duracion_dias} días</p>
                <p><span className="font-medium">Descargas:</span> {membresia.limite_descargas || 'Ilimitadas'}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedMembresia(membresia.id)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded mb-2"
            >
              Contratar ahora
            </button>

            {selectedMembresia === membresia.id && (
              <div className="mt-4 space-y-2">
                <PayPalButtons
                  style={{ layout: 'horizontal' }}
                  createOrder={(data, actions) => actions.order.create({
                    purchase_units: [{
                      amount: {
                        value: membresia.precio,
                        currency_code: "MXN"
                      }
                    }]
                  })}
                  onApprove={async (data, actions) => {
                    await actions.order.capture();
                    handlePaymentSuccess(membresia.id, 'paypal');
                  }}
                  onError={() => {
                    setError('Error en el pago con PayPal');
                    navigate('/pago-fallido');
                  }}
                />

                <Wallet 
                  initialization={{ 
                    preferenceId: createMercadoPagoPreference(membresia.id) 
                  }}
                  onSubmit={() => handlePaymentSuccess(membresia.id, 'mercado_pago')}
                  onError={() => {
                    setError('Error en el pago con Mercado Pago');
                    navigate('/pago-fallido');
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Historial de Pagos</h3>
        {pagos.map(pago => (
          <div key={pago.id} className="bg-white p-3 rounded mb-2 shadow-sm">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">${pago.monto}</p>
                <p className="text-sm text-gray-500">{pago.metodo_pago}</p>
              </div>
              <div>
                <p className="text-sm">{new Date(pago.fecha).toLocaleDateString()}</p>
                <p className={`text-sm ${pago.estado === 'completado' ? 'text-green-600' : 'text-red-600'}`}>
                  {pago.estado}
                </p>
              </div>
            </div>
          </div>
        ))}
        {pagos.length === 0 && <p className="text-gray-600">No hay pagos registrados</p>}
      </div>
    </div>
  );
};

export default MembresiasPage;