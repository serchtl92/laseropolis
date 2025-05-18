import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabase/client';
import SubirArchivo from './SubirArchivo';
import FormularioMembresia from './FormularioMembresia';
import SubirProducto from "./SubirProducto"; // Ajusta la ruta si está en otra carpeta



const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('resumen');
  const [usuarios, setUsuarios] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [membresias, setMembresias] = useState([]);
  
  

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    const { data: users } = await supabase.from('usuarios').select('*');
    const { data: files } = await supabase.from('archivos').select('*');
    const { data: subs } = await supabase.from('membresias').select('*');

    setUsuarios(users || []);
    setArchivos(files || []);
    setMembresias(subs || []);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Panel del Administrador</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-lg font-bold">{usuarios.length}</p>
          <p className="text-sm text-gray-600">Usuarios registrados</p>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-lg font-bold">{archivos.length}</p>
          <p className="text-sm text-gray-600">Archivos subidos</p>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-lg font-bold">{membresias.length}</p>
          <p className="text-sm text-gray-600">Tipos de membresía</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTab('subir')} className={`px-4 py-2 rounded ${tab === 'subir' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Subir archivo</button>
        <button onClick={() => setTab('subir_producto')} className={`px-4 py-2 rounded ${tab === 'subir_producto' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Subir Productos</button>
        <button onClick={() => setTab('usuarios')} className={`px-4 py-2 rounded ${tab === 'usuarios' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Usuarios</button>
        <button onClick={() => setTab('archivos')} className={`px-4 py-2 rounded ${tab === 'archivos' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Archivos</button>
        <button onClick={() => setTab('membresias')} className={`px-4 py-2 rounded ${tab === 'membresias' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Membresías</button>
        <button onClick={() => setTab('actividad')} className={`px-4 py-2 rounded ${tab === 'actividad' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Actividad</button>
        <button onClick={() => setTab('Finanzas')} className={`px-4 py-2 rounded ${tab === 'Finanzas' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Finanzas</button>
      </div>

      {tab === 'subir' && <SubirArchivo />}
      {tab === 'subir_producto' && <SubirProducto />}
      {tab === 'usuarios' && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Usuarios</h2>
          <ul>
            {usuarios.map(u => (
              <li key={u.id} className="mb-2">
                <strong>{u.nombre || u.email}</strong> - {u.rol} ({u.estado})
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'archivos' && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Archivos</h2>
          <ul>
            {archivos.map(a => (
              <li 
                key={a.id} 
                className="mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded border"
                onClick={() => navigate(`/admin/editar/${a.id}`)}
              >
                <span className="font-semibold">{a.nombre}</span> – ${a.precio}
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'membresias' && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Membresías</h2>
          <FormularioMembresia onMembresiaCreada={fetchDatos} />
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Lista de membresías</h3>
          <ul>
            {membresias.map(m => (
              <li 
                key={m.id} 
                className="mb-2 text-blue-600 hover:underline cursor-pointer"
                onClick={() => navigate(`/admin/editar-membresia/${m.id}`)}
              >
                <strong>{m.nombre}</strong> - ${m.precio} 
                <br />
                <small>{m.descripcion}</small><br />
                <span className="text-sm text-gray-500">
                  {m.duracion_dias} días · {m.limite_descargas} descargas/mes
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'actividad' && (
        <div className="bg-white p-4 rounded shadow text-gray-500 italic">
          Aquí irá la actividad reciente... (pendiente de integrar)
        </div>
      )}
      {tab === 'Finanzas' && (
        <div className="bg-white p-4 rounded shadow text-gray-500 italic">
          Aquí irá la Informacion de Ganancias (pendiente de integrar)
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
