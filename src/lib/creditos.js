// src/lib/creditos.js
import { supabase } from "../supabase/client";

export async function obtenerCreditosYMovimientos(usuarioId) {
  // Obtener créditos actuales
  const { data: usuario, error: errorUsuario } = await supabase
    .from("usuarios")
    .select("creditos")
    .eq("id", usuarioId)
    .single();

  // Obtener historial
  const { data: movimientos, error: errorMovimientos } = await supabase
    .from("movimientos_credito")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("fecha", { ascending: false });

  if (errorUsuario || errorMovimientos) {
    console.error("Error cargando datos de créditos:", errorUsuario || errorMovimientos);
    return { creditos: 0, movimientos: [] };
  }

  return { creditos: usuario.creditos, movimientos };
}
