import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useCarrito } from '../context/CarritoContext';

const Navbar = ({ setMostrarCarrito, setFiltroCategoria, setSearchTerm }) => {
  const [categorias, setCategorias] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { carrito } = useCarrito();
  const navigate = useNavigate();

  useEffect(() => {
    const cargarCategorias = async () => {
      const { data } = await supabase.from('categorias').select('*');
      if (data) setCategorias(data);
    };

    const verificarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUsuario(user);
    };

    cargarCategorias();
    verificarUsuario();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    navigate('/');
  };

  const manejarBusqueda = (e) => {
    setSearchTerm(e.target.value);
    setFiltroCategoria('');
  };

  return (
    <nav className="bg-gray-900 text-white p-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
        <button
          onClick={() => {
            setSearchTerm('');
            setFiltroCategoria('');
            navigate('/');
          }}
          className="text-2xl font-bold text-purple-400"
        >
          LaserOpolis
        </button>

        <div className="hidden md:flex space-x-6">
          <div className="group relative">
            <button className="flex items-center hover:text-purple-400">
              Categorías ▼
            </button>
            <div className="hidden group-hover:block absolute bg-gray-800 mt-2 py-2 w-48 rounded shadow-xl z-50">
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setFiltroCategoria(cat.id);
                    setSearchTerm('');
                    setMenuAbierto(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700"
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => navigate('/tienda')} className="hover:text-purple-400">Tienda</button>
          <button onClick={() => navigate('/membresias')} className="hover:text-purple-400">Membresías</button>
          <button onClick={() => setMostrarCarrito(true)}>🛒 Carrito ({carrito.length})</button>
          {usuario && (
            <button onClick={() => navigate('/profile')} className="hover:text-purple-400">Mi perfil</button>
          )}
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="text-white focus:outline-none"
          >
            ☰
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <input
            type="text"
            placeholder="Buscar archivos..."
            onChange={manejarBusqueda}
            className="bg-gray-700 text-white px-4 py-2 rounded text-sm w-full sm:w-auto"
          />
          {usuario ? (
            <div
              className="relative"
              onMouseEnter={() => setShowMenu(true)}
              onMouseLeave={() => setShowMenu(false)}
            >
              <button className="flex items-center space-x-1">
                <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  {usuario.email.charAt(0).toUpperCase()}
                </span>
              </button>
              {showMenu && (
                <div className="absolute right-0 bg-gray-800 mt-2 py-2 w-48 rounded shadow-xl z-50">
                  <button
                    onClick={cerrarSesion}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded w-full sm:w-auto"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>

      {menuAbierto && (
        <div className="md:hidden bg-gray-800 text-white px-4 py-2 space-y-2 shadow-lg">
          <div>
            <p className="font-semibold text-purple-400">Categorías</p>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setFiltroCategoria(cat.id);
                  setSearchTerm('');
                  setMenuAbierto(false);
                }}
                className="block w-full text-left px-2 py-1 hover:bg-gray-700 rounded"
              >
                {cat.nombre}
              </button>
            ))}
          </div>
          <button onClick={() => { navigate('/tienda'); setMenuAbierto(false); }} className="block px-2 py-1 hover:bg-gray-700 rounded">Tienda</button>
          <button onClick={() => { navigate('/membresias'); setMenuAbierto(false); }} className="block px-2 py-1 hover:bg-gray-700 rounded">Membresías</button>
          {usuario && (
            <button onClick={() => { navigate('/profile'); setMenuAbierto(false); }} className="block px-2 py-1 hover:bg-gray-700 rounded">Mi perfil</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
