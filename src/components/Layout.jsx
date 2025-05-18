import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CarritoCompras from './CarritoCompras';

const Layout = () => {
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        setMostrarCarrito={setMostrarCarrito}
        setFiltroCategoria={setFiltroCategoria}
        setSearchTerm={setSearchTerm}
      />
      <CarritoCompras
        visible={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
      />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet context={{
          filtroCategoria,
          setFiltroCategoria,
          searchTerm,
          setSearchTerm
        }} />
      </main>
    </div>
  );
};

export default Layout;
