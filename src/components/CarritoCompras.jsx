import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCarrito } from "../context/CarritoContext";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { supabase } from "../supabase/client";

const CarritoCompras = ({ visible, onClose }) => {
  const { carrito, eliminarDelCarrito, vaciarCarrito } = useCarrito();
  const [user, setUser] = useState(null);
  const [preferenceId, setPreferenceId] = useState(null);
  const total = carrito.reduce((acc, item) => acc + item.precio, 0);

  // Inicializar Mercado Pago
  useEffect(() => {
    initMercadoPago("TU_PUBLIC_KEY_MERCADO_PAGO"); // Reemplaza con tu key real
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (carrito.length > 0) {
      crearPreferencia();
    }
  }, [carrito]);

  const crearPreferencia = async () => {
    try {
      const response = await fetch("TU_ENDPOINT_BACKEND", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Compra en carrito",
          unit_price: total,
          quantity: 1
        })
      });
      const data = await response.json();
      setPreferenceId(data.id);
    } catch (error) {
      console.error("Error creando preferencia de Mercado Pago:", error);
    }
  };

  const handlePagoExitoso = async (metodo_pago) => {
    try {
      if (!user) return;

      // Registrar el pago
      await supabase.from("pagos").insert([{
        usuario_id: user.id,
        monto: total,
        metodo_pago,
        estado: "completado",
        productos: carrito.map(p => p.id) // puedes agregar columna 'productos' si quieres
      }]);

      // Opcional: limpiar el carrito después del pago
      vaciarCarrito();
      alert("Pago completado exitosamente");
      onClose();
    } catch (error) {
      console.error("Error al registrar pago:", error);
      alert("Error al procesar el pago");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed right-0 top-0 w-full max-w-sm h-full bg-white shadow-lg p-4 z-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tu Carrito</h2>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {carrito.length === 0 ? (
        <p className="text-gray-500">No hay productos en el carrito.</p>
      ) : (
        <>
          <ul className="divide-y">
            {carrito.map((item) => (
              <li key={item.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.nombre}</p>
                  <p className="text-sm text-gray-500">${item.precio.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => eliminarDelCarrito(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <p className="text-lg font-bold">Total: ${total.toFixed(2)}</p>

            <div className="mt-4 space-y-2">
              <PayPalButtons
                style={{ layout: "horizontal" }}
                createOrder={(data, actions) =>
                  actions.order.create({
                    purchase_units: [{
                      amount: {
                        value: total.toFixed(2),
                        currency_code: "MXN"
                      }
                    }]
                  })
                }
                onApprove={async (data, actions) => {
                  await actions.order.capture();
                  handlePagoExitoso("paypal");
                }}
                onError={() => alert("Error en el pago con PayPal")}
              />

              {preferenceId && (
                <Wallet
                  initialization={{ preferenceId }}
                  onSubmit={() => handlePagoExitoso("mercado_pago")}
                  onError={() => alert("Error en el pago con Mercado Pago")}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CarritoCompras;
