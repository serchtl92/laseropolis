
// src/components/PrivateRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase/client";

export default function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuth(!!user);
      setLoading(false);
    };
    checkSession();
  }, []);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (!isAuth) return <Navigate to="/login" replace />;

  return children;
}
