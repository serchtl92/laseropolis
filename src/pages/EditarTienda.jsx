import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Soluciona el error de iconos de Leaflet
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

const EditarTienda = ({ usuario }) => {
  const { id } = useParams(); // Obtiene el ID de la URL
  const navigate = useNavigate(); // Para navegar después de guardar o cancelar

  const [tienda, setTienda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', // Mantener para mostrar, pero no para actualizar si no se desea
    descripcion: '',
    imagen_url: '',
    telefono: '',
    whatsapp: '',
    redes_sociales: {
      facebook: '',
    }
  });
  const [ubicacion, setUbicacion] = useState([19.4326, -99.1332]); // Coordenadas iniciales CDMX
  const [archivoLogo, setArchivoLogo] = useState(null);

  // Cargar datos de la tienda a editar
  useEffect(() => {
    const cargarDatosTienda = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tiendas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error al cargar los datos de la tienda para edición:', error);
        setError('No se pudo cargar la información de la tienda.');
        setLoading(false);
        return;
      }

      if (data) {
        setTienda(data);
        setFormData({
          nombre: data.nombre, // Cargar el nombre existente
          descripcion: data.descripcion,
          imagen_url: data.logo_url,
          telefono: data.telefono || '',
          whatsapp: data.whatsapp || '',
          redes_sociales: data.redes_sociales || { facebook: '' }
        });
        if (data.direccion_coords) {
           const [lon, lat] = data.direccion_coords.replace('POINT(', '').replace(')', '').split(' ').map(parseFloat);
           setUbicacion([lat, lon]);
           console.log('Ubicacion cargada:', [lat, lon]);
        } else {
             setUbicacion([19.4326, -99.1332]); // CDMX
        }
      } else {
           setError('Tienda no encontrada.');
      }
      setLoading(false);
    };

    if (id) {
      cargarDatosTienda();
    } else {
        setError('ID de tienda no proporcionado en la URL.');
        setLoading(false);
    }
  }, [id]);

  // Función para manejar cambios en el formulario, incluyendo redes sociales
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.redes_sociales) {
      setFormData({
        ...formData,
        redes_sociales: {
          ...formData.redes_sociales,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Función para actualizar la tienda
  const actualizarTienda = async (e) => {
    e.preventDefault();

     if (!tienda) {
        console.error("No hay datos de tienda para actualizar.");
        return;
     }

    let updates = {
      // No incluimos el nombre en updates si no queremos que se edite
      descripcion: formData.descripcion,
      telefono: formData.telefono,
      whatsapp: formData.whatsapp,
      redes_sociales: formData.redes_sociales,
      direccion_coords: ubicacion ? `POINT(${ubicacion[1]} ${ubicacion[0]})` : null
    };

    console.log('Datos a actualizar antes del logo:', updates);
    console.log('Archivo de logo seleccionado:', archivoLogo);

    // Subir logo si existe
    if (archivoLogo) {
      const filePath = `${usuario?.id}/${Date.now()}-${archivoLogo.name}`;
      console.log('Ruta de subida del logo:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos-tiendas')
        .upload(filePath, archivoLogo);

      if (uploadError) {
        console.error('Error al subir el logo:', uploadError);
        // Manejar error de subida de logo si es necesario
      } else {
        console.log('Logo subido con éxito:', uploadData);
        const { publicURL, error: publicURLError } = supabase.storage
          .from('logos-tiendas')
          .getPublicUrl(uploadData.path);

        if (publicURLError) {
            console.error('Error al obtener la URL pública del logo:', publicURLError);
        } else {
            updates.logo_url = publicURL;
            console.log('URL pública del logo:', publicURL);
        }
      }
    }

    console.log('Datos finales a actualizar en la tabla tiendas:', updates);
    console.log('ID de la tienda a actualizar:', tienda.id);

    // Realizar la actualización en la tabla tiendas
    const { data: updateData, error: updateError } = await supabase
      .from('tiendas')
      .update(updates)
      .eq('id', tienda.id)
      .select(); // Eliminado .single()

    if (updateError) {
      console.error('Error al actualizar la tienda en la base de datos:', updateError);
      setError('Error al guardar los cambios: ' + updateError.message);
    } else {
      console.log('Tienda actualizada con éxito:', updateData);
      navigate(`/mi-tienda`);
    }
  };

  // Renderizar basado en el estado
  if (loading) {
    return <div className="max-w-4xl mx-auto p-4 text-center">Cargando datos de la tienda...</div>;
  }

  if (error) {
    return <div className="max-w-4xl mx-auto p-4 text-center text-red-600">Error: {error}</div>;
  }

  if (!tienda) {
      return <div className="max-w-4xl mx-auto p-4 text-center">No se encontró la tienda especificada.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Editar Información de la Tienda</h1>

      <form onSubmit={actualizarTienda} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda - Datos del formulario */}
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre de la Tienda</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed" // Agregado estilo para deshabilitado
                value={formData.nombre}
                disabled // Deshabilitado para evitar edición
              />
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.descripcion}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.telefono}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp</label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.whatsapp}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">Facebook</label>
              <input
                type="url"
                id="facebook"
                name="facebook"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.redes_sociales.facebook}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700">Logo de la Tienda</label>
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={(e) => setArchivoLogo(e.target.files[0])}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {tienda.logo_url && !archivoLogo && (
                  <div className="mt-2">
                       <p className="text-xs text-gray-500">Logo actual:</p>
                       <img src={tienda.logo_url} alt="Logo actual" className="w-16 h-16 object-cover rounded" />
                  </div>
              )}
               {archivoLogo && (
                   <div className="mt-2">
                      <p className="text-xs text-gray-500">Nuevo logo seleccionado:</p>
                      <img src={URL.createObjectURL(archivoLogo)} alt="Nuevo logo" className="w-16 h-16 object-cover rounded" />
                   </div>
              )}
            </div>
          </div>

          {/* Columna Derecha - Mapa */}
          <div className="h-96">
             <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación en el Mapa</label>
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
            <p className="mt-2 text-sm text-gray-600 text-center">
              Haz clic en el mapa para establecer la ubicación
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/profile`)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarTienda;
