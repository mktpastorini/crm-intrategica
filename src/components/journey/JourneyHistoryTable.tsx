
import { Button } from "@/components/ui/button";
import { JourneyMessageHistory } from "@/utils/journeyHistoryService";

interface JourneyHistoryTableProps {
  history: JourneyMessageHistory[];
  historyLoading: boolean;
  onReload: () => void;
}

export default function JourneyHistoryTable({
  history,
  historyLoading,
  onReload,
}: JourneyHistoryTableProps) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-4">Histórico de Mensagens Enviadas</h3>
      <Button onClick={onReload} size="sm" className="mb-2">
        Recarregar
      </Button>
      {historyLoading ? (
        <div className="text-center text-slate-400 py-8">Carregando...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          Nenhuma mensagem enviada encontrada.
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 font-semibold">Quando</th>
                <th className="p-2 font-semibold">Lead</th>
                <th className="p-2 font-semibold">Estágio</th>
                <th className="p-2 font-semibold">Mensagem</th>
                <th className="p-2 font-semibold">Tipo</th>
                <th className="p-2 font-semibold">Webhook</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b">
                  <td className="p-2">{new Date(h.sent_at).toLocaleString()}</td>
                  <td className="p-2">{h.lead_name || h.lead_id}</td>
                  <td className="p-2">{h.stage}</td>
                  <td className="p-2">{h.message_title}</td>
                  <td className="p-2">{h.message_type}</td>
                  <td className="p-2 text-ellipsis overflow-hidden max-w-[120px]">{h.webhook_url ? "Enviado" : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
