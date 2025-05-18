// src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { PayPalButtons } from "@paypal/react-paypal-js";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { membresia } = location.state || {};
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!membresia) navigate('/membresias');
  }, [membresia, navigate]); // Añadir dependencias para useEffect

  // Función para activar la membresía después del pago
  const activarMembresiaUsuario = async (userId, membresiaData) => {
    const fechaInicio = new Date();
    const fechaVencimiento = new Date(fechaInicio);
    // Sumar los días de duración a la fecha de inicio
    fechaVencimiento.setDate(fechaInicio.getDate() + membresiaData.duracion_dias);

    // Convertir a formato ISO para Supabase
    const fechaInicioISO = fechaInicio.toISOString();
    const fechaVencimientoISO = fechaVencimiento.toISOString();

    // 1. Actualizar la tabla 'usuarios'
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ membresia_id: membresiaData.id })
      .eq('id', userId); // Asegúrate de que la tabla 'usuarios' tiene una columna 'id' que coincide con auth.users.id

    if (updateError) {
      console.error("Error al actualizar usuario con membresía:", updateError);
      throw updateError; // Lanza el error para que el catch lo maneje
    }

    // 2. Insertar en la tabla 'membresias_usuarios'
    const { error: insertError } = await supabase
      .from('membresias_usuarios')
      .insert([{
        usuario_id: userId,
        membresia_id: membresiaData.id,
        fecha_inicio: fechaInicioISO,
        fecha_vencimiento: fechaVencimientoISO,
        activa: true // Marcar como activa al momento de la compra
        // 'creado_en' debería ser manejado automáticamente por Supabase si es un timestamp con default now()
      }]);

    if (insertError) {
      console.error("Error al insertar en membresias_usuarios:", insertError);
      throw insertError; // Lanza el error para que el catch lo maneje
    }

    console.log(`Membresía ${membresiaData.nombre} activada para el usuario ${userId}`);
  };


  const handlePayPalSuccess = async (paymentID) => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error("Usuario no autenticado.");
      }
      const userId = user.id;

      // 1. Registrar pago con PayPal
      const { error: pagoError } = await supabase
        .from('pagos')
        .insert([{
          usuario_id: userId,
          membresia_id: membresia.id,
          monto: membresia.precio,
          metodo_pago: 'paypal',
          estado: 'completado',
          transaccion_id: paymentID // Guardar el ID de transacción de PayPal
        }]);

      if (pagoError) throw pagoError;

      // 2. Activar la membresía para el usuario
      await activarMembresiaUsuario(userId, membresia);

      // 3. Redirigir a éxito
      navigate('/pago-exitoso', { state: { metodo: 'PayPal' } });

    } catch (error) {
      console.error("Error en el proceso de pago PayPal:", error);
      navigate('/pago-fallido');
    } finally {
      setLoading(false);
    }
  };

  const handleMercadoPagoSuccess = async (paymentData) => {
     setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error("Usuario no autenticado.");
      }
      const userId = user.id;

      // NOTA: Esta función actualmente SIMULA un pago exitoso de Mercado Pago.
      // Una integración real requeriría pasos adicionales con la API de Mercado Pago.

      // 1. Registrar pago con Mercado Pago (simulado)
      const { error: pagoError } = await supabase
        .from('pagos')
        .insert([{
          usuario_id: userId,
          membresia_id: membresia.id,
          monto: membresia.precio,
          metodo_pago: 'mercado_pago',
          estado: 'completado',
          // transaction_id: paymentData.id // Si tuvieras un ID real de Mercado Pago
        }]);

      if (pagoError) throw pagoError;

      // 2. Activar la membresía para el usuario
      await activarMembresiaUsuario(userId, membresia);

      // 3. Redirigir a éxito
      navigate('/pago-exitoso', { state: { metodo: 'Mercado Pago' } });

    } catch (error) {
      console.error("Error en el proceso de pago Mercado Pago (simulado):", error);
      navigate('/pago-fallido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Confirmar Compra</h1>

      {membresia && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{membresia.nombre}</h2>
          <div className="space-y-2 mb-6">
            <p><span className="font-medium">Precio:</span> ${membresia.precio}</p>
            <p><span className="font-medium">Duración:</span> {membresia.duracion_dias} días</p>
            <p><span className="font-medium">Descargas:</span> {membresia.limite_descargas || 'Ilimitadas'}</p>
          </div>

          <div className="space-y-4">
            {/* Botón PayPal */}
            <PayPalButtons
              createOrder={(data, actions) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: membresia.precio,
                      currency_code: "MXN" // Asegúrate de que esta moneda sea aceptada por tu cuenta PayPal
                    }
                  }]
                });
              }}
              onApprove={async (data, actions) => {
                try {
                   const details = await actions.order.capture();
                   handlePayPalSuccess(details.id);
                } catch (error) {
                   console.error("Error al capturar orden de PayPal:", error);
                   navigate('/pago-fallido');
                }
              }}
              onError={(err) => {
                console.error("Error en PayPal Buttons:", err);
                navigate('/pago-fallido');
              }}
              // Opcional: Personalizar estilo del botón
              style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal' }}
            />

                        {/* Botón Mercado Pago (Simulado) */}
            <button
              onClick={handleMercadoPagoSuccess}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 flex items-center justify-center"
            >
              {loading ? 'Procesando...' : 'Pagar con Mercado Pago (Simulado)'}
            </button>
             {/* Mensaje de advertencia para Mercado Pago */}
            <p className="text-sm text-gray-600 text-center">
              Nota: El pago con Mercado Pago es actualmente una simulación para propósitos de demostración.
            </p>

          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
