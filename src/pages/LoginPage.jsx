import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const referralParam = queryParams.get('ref');

  // Guardar el código de referido en localStorage si viene en la URL
  useEffect(() => {
    if (referralParam) {
      localStorage.setItem('codigo_referido', referralParam);
    }
  }, [referralParam]);

  const generateUniqueReferralCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let exists = true;

    while (exists) {
      code = Array.from({ length: 6 }, () =>
        characters[Math.floor(Math.random() * characters.length)]
      ).join('');

      const { data } = await supabase
        .from('usuarios')
        .select('id')
        .eq('codigo_referido', code)
        .single();

      exists = !!data;
    }
    return code;
  };

  const handleUserSetupAndRedirect = async (user) => {
    if (!user) {
      if (location.pathname !== '/login') {
        navigate('/');
      }
      return;
    }

    try {
      // Verificar si el usuario ya existe
      const { data: existingUser, error: fetchError } = await supabase
        .from('usuarios')
        .select('id, rol')
        .eq('id', user.id)
        .single();

      let userRole = 'user';

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingUser) {
        const { email, user_metadata } = user;
        const userName = user_metadata?.name || email?.split('@')[0] || 'Nuevo Usuario';
        const referralCode = await generateUniqueReferralCode();

        let referidoPor = null;
        const refCode = referralParam || localStorage.getItem('codigo_referido');

        if (refCode) {
          const { data: refUser, error: refError } = await supabase
            .from('usuarios')
            .select('id')
            .eq('codigo_referido', refCode)
            .single();

          if (!refError && refUser) {
            referidoPor = refUser.id;
            localStorage.removeItem('codigo_referido');
          }
        }

        const { error: insertError } = await supabase
          .from('usuarios')
          .insert([{
            id: user.id,
            email: email,
            nombre: userName,
            rol: userRole,
            codigo_referido: referralCode,
            referido_por: referidoPor,
            creditos: 0
          }]);

        if (insertError) throw insertError;

        if (referidoPor) {
          const { error: movimientoError } = await supabase
            .from('movimientos_credito')
            .insert([{
              usuario_id: referidoPor,
              tipo: 'referido_registrado',
              cantidad: 10,
              descripcion: 'Crédito por referido registrado'
            }]);

          if (movimientoError) throw movimientoError;

          const { error: updateError } = await supabase.rpc('sumar_creditos', {
            uid: referidoPor,
            cantidad: 10
          });

          if (updateError) throw updateError;
        }
      } else {
        userRole = existingUser.rol;
      }

      const from = location.state?.from || '/';
      navigate(userRole === 'admin' ? '/admin' : from);

    } catch (error) {
      console.error('Error en handleUserSetupAndRedirect:', error);
      setError('Ocurrió un error al configurar tu cuenta. Por favor intenta nuevamente.');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setError('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/login',
        }
      });
      if (error) throw error;
    } catch (error) {
      setError(`Error al iniciar sesión con ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSetupAndRedirect(session.user);
      } else {
        handleUserSetupAndRedirect(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const checkInitialSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        handleUserSetupAndRedirect(user);
      }
    };
    checkInitialSession();
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-6 text-center">Iniciar sesión</h2>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-2 mb-4 rounded"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-2 mb-4 rounded"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Cargando...' : 'Ingresar'}
        </button>

        <hr className="my-4" />

        <button
          onClick={() => handleOAuthLogin('google')}
          disabled={loading}
          className={`w-full bg-red-500 text-white p-2 rounded mb-2 hover:bg-red-600 ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Cargando...' : 'Iniciar con Google'}
        </button>

        <button
          onClick={() => handleOAuthLogin('facebook')}
          disabled={loading}
          className={`w-full bg-blue-800 text-white p-2 rounded hover:bg-blue-900 ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Cargando...' : 'Iniciar con Facebook'}
        </button>
      </div>
    </div>
  );
}
