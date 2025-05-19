import React, { useState,
 useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import { supabase } from '../supabase/client';

const MiTienda = ({ usuario }) => {
  const navigate = useNavigate(); // Hook para navegar

  const [tienda, setTienda] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [activeTab, setActiveTab] = useState('informacion'); // Estado para la pestaña activa
  // const [mostrarEditar, setMostrarEditar] = useState(false); // CAMBIOS PARA EDICION EN PAGINA SEPARADA: Ya no se usa modal
  // const [ubicacion, setUbicacion] = useState([19.4326, -99.1332]); // CAMBIOS PARA EDICION EN PAGINA SEPARADA: Ubicación ahora en EditarTienda.jsx
  // const [archivoLogo, setArchivoLogo] = useState(null); // CAMBIOS PARA EDICION EN PAGINA SEPARADA: Logo ahora en EditarTienda.jsx

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario) return; // Asegúrate de que el usuario esté definido

      // Cargar tienda a través de la relación con vendedores
      const { data: tiendaData, error: tiendaError } = await supabase
        .from('tiendas')
        .select('*, vendedores!inner(usuario_id)') // Selecciona la tienda y relaciona con vendedores
        .eq('vendedores.usuario_id', usuario.id) // Filtra por el usuario_id en la tabla vendedores
        .single();


      if (tiendaError) {
        console.error('Error fetching tienda:', tiendaError);
        if (tiendaError.code !== 'PGRST116') {
           console.error('Error al cargar la tienda:', tiendaError);
        } else {
            console.log('No tienda found for this user.');
        }
        setTienda(null);
        setSucursales([]);
        setProductos([]);
        return;
      }

      if (tiendaData) {
        setTienda(tiendaData);
        // CAMBIOS PARA EDICION EN PAGINA SEPARADA: Ya no necesitamos setUbicacion aquí
        // if (tiendaData.direccion_coords) {
        //   setUbicacion([
        //     tiendaData.direccion_coords.latitude,
        //     tiendaData.direccion_coords.longitude
        //   ]);
        // }

        // Cargar relaciones SOLO si se encontró una tienda
        const { data: sucursalesData, error: sucursalesError } = await supabase
          .from('sucursales')
          .select('*')
          .eq('tienda_id', tiendaData.id);

        if (sucursalesError) {
           console.error('Error al cargar sucursales:', sucursalesError);
        } else {
           setSucursales(sucursalesData || []);
        }


        const { data: productosData, error: productosError } = await supabase
          .from('productos')
          .select('*')
          .eq('tienda_id', tiendaData.id);

        if (productosError) {
           console.error('Error al cargar productos:', productosError);
        } else {
           setProductos(productosData || []);
        }

      } else {
        setTienda(null);
        setSucursales([]);
        setProductos([]);
      }
    };

    cargarDatos();
  }, [usuario]); // Dependencia del useEffect

  // CAMBIOS PARA EDICION EN PAGINA SEPARADA: actualizarTienda ahora está en EditarTienda.jsx
  // const actualizarTienda = async (formData) => { ... }

  // CAMBIOS PARA EDICION EN PAGINA SEPARADA: FormularioEdicion ahora está en EditarTienda.jsx
  // const FormularioEdicion = () => { ... }

  // Función para navegar a la página de edición
  const handleEditarClick = () => {
    if (tienda && tienda.id) {
        navigate(`/editar-tienda/${tienda.id}`); // Navega a la nueva ruta con el ID de la tienda
    } else {
        console.error("No se pudo obtener el ID de la tienda para editar.");
        // Opcional: Mostrar un mensaje al usuario
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{tienda?.nombre || 'Cargando...'}</h1>
          <p className="text-gray-600">{tienda?.descripcion || 'No hay descripción.'}</p>
          {tienda?.imagen_url && (
            <img
              src={tienda.imagen_url}
              alt="Logo de la tienda"
              className="mt-2 w-32 h-32 object-cover rounded shadow"
            />
          )}
        </div>
        {/* Solo muestra el botón de editar si hay una tienda cargada */}
        {tienda &&
 (
          // CAMBIOS PARA EDICION EN PAGINA SEPARADA: Llama a la nueva función de navegación
          <button
            onClick={handleEditarClick}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Editar Tienda
          </button>
        )}
         {/* Mensaje si no se encuentra tienda */}
        {!tienda && usuario && (
            <div className="text-center p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                <p>No se encontró una tienda asociada a este usuario.</p>
                 {/* Podrías añadir un botón para crear una tienda aquí si lo necesitas */}
            </div>
        )}
      </div>

      {/* Navegación por pestañas (solo si hay tienda) */}
      {tienda && (
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('informacion')}
                className={`
                  ${activeTab === 'informacion'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none
                `}
              >
                Información de la Tienda
              </button>
              <button
                onClick={() => setActiveTab('productos')}
                className={`
                  ${activeTab === 'productos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus
:outline-none
                `}
              >
                Productos
              </button>
              <button
                onClick={() => setActiveTab('sucursales')}
                className={`
                  ${activeTab === 'sucursales'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none
                `}
              >
                Sucursales
              </button>
              {/* Puedes agregar más pestañas aquí */}
            </nav>
          </div>
      )}


      {/* Contenido de las pestañas (solo si hay tienda) */}
      {tienda && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeTab === 'informacion' && (
                 <>
                    <div className="bg-white p-4 rounded-lg shadow col-span-1 md:col-span-3">
                         <h3 className="text-xl font-semibold mb-4">Información Detallada</h3>
                         <div className="space-y-3">
                              <p><span className="font-medium">Nombre:</span> {tienda.nombre}</p>
                              <p><span className="font-medium">Descripción:</span> {tienda.descripcion}</p>
                              <p><span className="font-medium">Teléfono:</span> {tienda.telefono || 'No registrado'}</p>
                              <p><span className="font-medium">WhatsApp:</span> {tienda.whatsapp || 'No registrado'}</p>
                              <p><span className="font-medium">Facebook:</span> {tienda.facebook || 'No registrado'}</p>
                               {/* CAMBIOS PARA EDICION EN PAGINA SEPARADA: Mostrar mapa de ubicación aquí (solo visualización) */}
                              {tienda.direccion_coords && (
                                   <div className="h-64 w-full mt-4">
                                        <h4 className="font-medium mb-2">Ubicación:</h4>
                                         {/* Asegúrate de parsear coords para Leaflet [lat, lon] si tu base es POINT(lon lat) */}
                                         {(() => {
                                             try {
                                                 const [lon, lat] = tienda.direccion_coords.replace('POINT(', '').replace(')', '').split(' ').map(parseFloat);
                                                 if (!isNaN(lat) && !isNaN(lon)) {
                                                     // Importa MapContainer, TileLayer, Marker y L solo si los necesitas aquí
                                                     // para mostrar el mapa en la vista de información
                                                     // import { MapContainer, TileLayer, Marker } from 'react-leaflet';
                                                     // import L from 'leaflet';
                                                     // import 'leaflet/dist/leaflet.css';
                                                      return (
                                                         // Necesitarías importar MapContainer, TileLayer, Marker y L en MiTienda.jsx
                                                         // si decides mostrar el mapa aquí también.
                                                         // Por simplicidad, si solo lo editas en la otra página, puedes quitar esto.
                                                         // Si lo quieres mostrar aquí, descomenta las importaciones al inicio
                                                         // y asegúrate de que las dependencias 'react-leaflet' y 'leaflet' estén instaladas.
                                                         <MapContainer
                                                             center={[lat, lon]} // Leaflet espera [lat, lon]
                                                             zoom={13}
                                                             style={{ height: '100%', width: '100%' }}
                                                             dragging={false} // No permitir arrastrar
                                                             doubleClickZoom={false} // No permitir zoom
                                                             scrollWheelZoom={false} // No permitir zoom con scroll
                                                             zoomControl={false} // Ocultar controles de zoom
                                                         >
                                                             <TileLayer
                                                                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                             />
                                                             <Marker position={[lat, lon]}></Marker>
                                                         </MapContainer>
                                                     );
                                                 } else {
                                                     return <p className="text-red-500">Error al cargar la ubicación del mapa.</p>;
                                                 }
                                             } catch (e) {
                                                 console.error("Error parsing direccion_coords:", e);
                                                  return <p className="text-red-500">Error al cargar la ubicación del mapa.</p>;
                                             }
                                         })()}
                                   </div>
                              )}
                         </div>
                    </div>
                 </>
            )}

            {activeTab === 'productos' && (
                <div className="bg-white p-4 rounded-lg shadow col-span-1 md:col-span-3">
                  <h3 className="text-xl font-semibold mb-4">Todos los Productos</h3>
                  {productos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                         {productos.map(p => (
                            <div key={p.id} className="border rounded-lg p-4 flex flex-col">
                              {/* Si tienes imagen de producto, renderízala aquí */}
                              {/* <img src={p.imagen_url} alt={p.nombre} className="w-full h-48 object-cover rounded-md mb-2" /> */}
                              <h4 className="font-semibold text-lg">{p.nombre}</h4>
                              <p className="text-gray-700 mb-2 flex-grow">{p.descripcion}</p>
                              <p className="text-blue-600 font-bold mt-auto">${p.precio?.toFixed(2) || 'N/A'}</p>
                              {/* Puedes añadir botones de editar/eliminar producto aquí */}
                            </div>
                          ))}
                    </div>
                  ) : (
                       <p className="text-gray-600">Aún no tienes productos registrados.</p>
                  )}
                </div>
            )}

            {activeTab === 'sucursales' && (
                 <div className="bg-white p-4 rounded-lg shadow col-span-1 md:col-span-3">
                   <h3 className="text-xl font-semibold mb-4">Todas las Sucursales</h3>
                   {sucursales.length > 0 ? (
                     <div className="space-y-4">
                         {sucursales.map(s => (
                             <div key={s.id} className="border rounded-lg p-4">
                               <h4 className="font-semibold text-lg">{s.nombre}</h4>
                               <p className="text-gray-700">{s.direccion}</p>
                                {/* Puedes añadir información de contacto o mapa por sucursal */}
                                {/* Puedes añadir botones de editar/eliminar sucursal aquí */}
                             </div>
                           ))}
                     </div>
                   ) : (
                        <p className="text-gray-600">Aún no tienes sucursales registradas.</p>
                   )}
                 </div>
            )}
          </div>
      )}
       {/* Si no hay tienda y el usuario está autenticado, podrías mostrar un botón para crearla */}
       {/* {!tienda && usuario && (
           <div className="text-center mt-8">
               <button className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">Crear Mi Tienda</button>
           </div>
       )} */}


      {/* CAMBIOS PARA EDICION EN PAGINA SEPARADA: Ya no renderizamos el FormularioEdicion modal aquí */}
      {/* {mostrarEditar && tienda && <FormularioEdicion />} */}
    </div>
  );
};

export default MiTienda;
