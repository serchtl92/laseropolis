// PagoExitoso.jsx
import { useLocation } from "react-router-dom"; // Asegúrate de importar useLocation

const PagoExitoso = () => {
  const location = useLocation();
  const { metodo } = location.state || {};

  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold mb-4">¡Pago Exitoso!</h1>
      <p className="text-lg">
        Gracias por tu compra usando {metodo || 'el método seleccionado'}
      </p>
    </div>
  );
};

// ¡Agrega esta línea para exportar el componente!
export default PagoExitoso;