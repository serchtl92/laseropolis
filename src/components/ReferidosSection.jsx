import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

export default function ReferidosSection() {
  const [codigoReferido, setCodigoReferido] = useState("");
  const [linkInvitacion, setLinkInvitacion] = useState("");
  const [amigosReferidos, setAmigosReferidos] = useState(0);
  const [creditosGanados, setCreditosGanados] = useState(0);
  const [referidos, setReferidos] = useState([]);

  useEffect(() => {
    const fetchReferidoData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return console.error("Error obteniendo usuario:", userError);

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("id, codigo_referido")
        .eq("id", user.id)
        .single();

      if (usuarioError || !usuario) return console.error("Error obteniendo datos del usuario:", usuarioError);

      const codigo = usuario.codigo_referido;
      const miId = usuario.id;
      setCodigoReferido(codigo);
      setLinkInvitacion(`${window.location.origin}/login?ref=${codigo}`);

      // Buscar referidos
      const { data: referidosData, error: referidosError } = await supabase
        .from("usuarios")
        .select("id, nombre, email, fecha_registro")
        .eq("referido_por", miId);

      if (referidosError) {
        console.error("Error obteniendo referidos:", referidosError);
      } else {
        setReferidos(referidosData || []);
        setAmigosReferidos(referidosData?.length || 0);
      }

      // Créditos ganados por referidos
      const { data: movimientos, error: movimientosError } = await supabase
        .from("movimientos_credito")
        .select("cantidad")
        .eq("usuario_id", user.id)
        .ilike("tipo", "%referido%");

      if (movimientosError) {
        console.error("Error obteniendo movimientos:", movimientosError);
      } else {
        console.log("Movimientos por referido:", movimientos);
        const totalCreditos = movimientos?.reduce((sum, mov) => sum + mov.cantidad, 0) || 0;
        setCreditosGanados(totalCreditos);
      }
    };

    fetchReferidoData();
  }, []);

  const copiarTexto = (texto) => {
    navigator.clipboard.writeText(texto);
    alert("Copiado al portapapeles");
  };

  return (
    <div className="bg-gray-50 border rounded-xl p-5 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Invita a tus amigos y gana créditos</h3>

        <div className="mb-3">
          <p className="font-medium">Tu código:</p>
          <div className="flex items-center gap-2">
            <span className="text-blue-700 font-mono">{codigoReferido}</span>
            <button className="text-sm text-blue-500 underline" onClick={() => copiarTexto(codigoReferido)}>
              Copiar
            </button>
          </div>
        </div>

        <div>
          <p className="font-medium">Tu enlace de invitación:</p>
          <div className="flex items-center gap-2">
            <span className="text-sm break-all">{linkInvitacion}</span>
            <button className="text-sm text-blue-500 underline" onClick={() => copiarTexto(linkInvitacion)}>
              Copiar
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t text-sm text-gray-700 space-y-1">
        <p>👥 Amigos invitados: <strong>{amigosReferidos}</strong></p>
        <p>🎁 Créditos ganados: <strong>{creditosGanados}</strong></p>
      </div>

      {referidos.length > 0 && (
        <div className="pt-6">
          <h4 className="text-md font-semibold mb-2">Historial de referidos</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border rounded-lg bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Crédito otorgado</th>
                </tr>
              </thead>
              <tbody>
                {referidos.map((ref) => (
                  <tr key={ref.id} className="border-t">
                    <td className="px-3 py-2">{ref.nombre || "—"}</td>
                    <td className="px-3 py-2">{ref.email}</td>
                    <td className="px-3 py-2">
                      {ref.fecha_registro ? new Date(ref.fecha_registro).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2">
  {ref.credito_otorgado ? "✅" : "—"}
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
