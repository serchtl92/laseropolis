import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VendedorInfo() {
  const navigate = useNavigate();
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  const handleCrearTienda = () => {
    if (aceptoTerminos) {
      navigate("/CrearTienda");
    }
  };

  const terminosTexto = `
  Al registrarte como vendedor en LaserOpolis, aceptas las siguientes condiciones:
  
  1. Te comprometes a ofrecer productos originales, legales y en buen estado.
  2. Debes proporcionar información precisa y actualizada sobre tu tienda y productos.
  3. Te haces responsable de las entregas, devoluciones y atención al cliente de tus productos físicos.
  4. No se permite el uso de imágenes falsas o material que infrinja derechos de autor.
  5. LaserOpolis se reserva el derecho de suspender cuentas que incumplan las normas.
  6. Aceptas que LaserOpolis retenga una pequeña comisión por cada venta realizada.
  
  Te recomendamos leer los términos completos en nuestra página oficial.
  `;

  return (
    <div className="bg-gradient-to-br from-purple-100 to-white min-h-screen p-6 md:p-12 text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-purple-700 mb-4 text-center">
          ¡Conviértete en Vendedor en LaserOpolis!
        </h1>
        <p className="text-lg mb-8 text-center text-gray-600">
          Forma parte de nuestra comunidad de creadores y haz crecer tu negocio mostrando tus productos físicos en nuestra plataforma.
        </p>

        {/* Requisitos */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-600 mb-4">📋 Requisitos</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Tener una cuenta activa en LaserOpolis.</li>
            <li>Contar con productos físicos propios para vender.</li>
            <li>Subir imágenes reales y de buena calidad.</li>
            <li>Proporcionar información de contacto válida.</li>
            <li>Aceptar los términos y condiciones del marketplace.</li>
          </ul>
        </section>

        {/* Beneficios */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-600 mb-4">🎁 Beneficios de ser Vendedor</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Publica tus productos sin costos iniciales.</li>
            <li>Accede a una comunidad creciente de compradores.</li>
            <li>Recibe pagos seguros mediante PayPal.</li>
            <li>Gestión fácil de tu tienda y productos.</li>
            <li>Visibilidad y promoción en la plataforma.</li>
          </ul>
        </section>

        {/* Términos y condiciones */}
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-purple-600 mb-4">📄 Términos y Condiciones</h2>
          <textarea
            readOnly
            value={terminosTexto}
            className="w-full h-64 p-4 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-700 resize-none focus:outline-none"
          />
        </section>

        {/* Checkbox de aceptación */}
        <div className="mb-10 flex items-start gap-2">
          <input
            type="checkbox"
            id="acepto"
            checked={aceptoTerminos}
            onChange={(e) => setAceptoTerminos(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="acepto" className="text-gray-700 text-sm">
            He leído y acepto los <strong>términos y condiciones</strong> para ser vendedor en LaserOpolis.
          </label>
        </div>

        {/* Botón */}
        <section className="text-center">
          <button
            onClick={handleCrearTienda}
            disabled={!aceptoTerminos}
            className={`${
              aceptoTerminos
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-400 cursor-not-allowed"
            } text-white font-bold py-3 px-6 rounded-full transition-transform transform hover:scale-105 shadow-md`}
          >
            Crear mi Tienda Ahora
          </button>
        </section>
      </div>
    </div>
  );
}
