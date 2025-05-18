// src/components/MiTienda.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Soluciona el error de iconos
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position && <Marker position={position}></Marker>;
};

const MiTienda = ({ usuario }) => {
  const [tienda, setTienda] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [ubicacion, setUbicacion] = useState([19.4326, -99.1332]); // Coordenadas iniciales CDMX
  const [archivoLogo, setArchivoLogo] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      // Cargar tienda
      const { data: tiendaData } = await supabase
        .from('tiendas')
        .select('*')
        .eq('vendedor_id', usuario.id)
        .single();

      if (tiendaData) {
        setTienda(tiendaData);
        if (tiendaData.direccion_coords) {
          setUbicacion([
            tiendaData.direccion_coords.latitude,
            tiendaData.direccion_coords.longitude
          ]);
        }
      }

      // Cargar relaciones
      const { data: sucursalesData } = await supabase
        .from('sucursales')
        .select('*')
        .eq('tienda_id', tiendaData?.id);

      const { data: productosData } = await supabase
        .from('productos')
        .select('*')
        .eq('tienda_id', tiendaData?.id);

      setSucursales(sucursalesData || []);
      setProductos(productosData || []);
    };

    if(usuario) cargarDatos();
  }, [usuario]);

  // Actualizar tienda
  const actualizarTienda = async (formData) => {
    let updates = {
      ...formData,
      direccion_coords: `POINT(${ubicacion[1]} ${ubicacion[0]})` // Formato para PostGIS
    };

    // Subir logo si existe
    if (archivoLogo) {
      const { data, error } = await supabase.storage
        .from('logos-tiendas')
        .upload(`${usuario.id}/${Date.now()}`, archivoLogo);

      if (!error) {
        const { publicURL } = supabase.storage
          .from('logos-tiendas')
          .getPublicUrl(data.path);
        updates.imagen_url = publicURL;
      }
    }

    const { data, error } = await supabase
      .from('tiendas')
      .update(updates)
      .eq('id', tienda.id)
      .select()
      .single();

    if (!error) {
      setTienda(data);
      setMostrarEditar(false);
    }
  };

  // Formulario de edición
  const FormularioEdicion = () => {
    const [formData, setFormData] = useState({
      nombre: tienda.nombre,
      descripcion: tienda.descripcion,
      imagen_url: tienda.imagen_url,
      telefono: tienda.telefono || '',
      whatsapp: tienda.whatsapp || '',
      facebook: tienda.facebook || ''
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg w-full max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Editar Tienda</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              <div>
                <label>Nombre de la Tienda</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </div>

              <div>
                <label>Descripción</label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                />
              </div>

              <div>
                <label>Teléfono</label>
                <input
                  type="tel"
                  className="w-full p-2 border rounded"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                />
              </div>

              <div>
                <label>WhatsApp</label>
                <input
                  type="tel"
                  className="w-full p-2 border rounded"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                />
              </div>

              <div>
                <label>Facebook</label>
                <input
                  type="url"
                  className="w-full p-2 border rounded"
                  value={formData.facebook}
                  onChange={(e) => setFormData({...formData, facebook: e.target.value})}
                />
              </div>

              <div>
                <label>Logo de la Tienda</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArchivoLogo(e.target.files[0])}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            {/* Columna Derecha - Mapa */}
            <div className="h-96">
              <MapContainer
                center={ubicacion}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker 
                  position={ubicacion} 
                  setPosition={setUbicacion} 
                />
              </MapContainer>
              <p className="mt-2 text-sm text-gray-600">
                Haz clic en el mapa para establecer la ubicación
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setMostrarEditar(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Cancelar
            </button>
            <button
              onClick={() => actualizarTienda(formData)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{tienda?.nombre}</h1>
          <p className="text-gray-600">{tienda?.descripcion}</p>
          {tienda?.imagen_url && (
            <img 
              src={tienda.imagen_url} 
              alt="Logo" 
              className="mt-2 w-32 h-32 object-cover rounded"
            />
          )}
        </div>
        <button
          onClick={() => setMostrarEditar(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Editar Tienda
        </button>
      </div>

      {/* Secciones de la tienda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Contacto</h3>
          <p>Teléfono: {tienda?.telefono || 'No registrado'}</p>
          <p>WhatsApp: {tienda?.whatsapp || 'No registrado'}</p>
          <p>Facebook: {tienda?.facebook || 'No registrado'}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Sucursales</h3>
          {sucursales.map(s => (
            <div key={s.id} className="border-b py-2">
              <p>{s.nombre}</p>
              <p className="text-sm text-gray-600">{s.direccion}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Productos Destacados</h3>
          {productos.slice(0,3).map(p => (
            <div key={p.id} className="border-b py-2">
              <p>{p.nombre}</p>
              <p className="text-sm text-gray-600">${p.precio}</p>
            </div>
          ))}
        </div>
      </div>

      {mostrarEditar && <FormularioEdicion />}
    </div>
  );
};

export default MiTienda;