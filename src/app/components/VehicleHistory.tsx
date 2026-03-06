import { Card, CardContent } from "./ui/card";

interface HistoryEntry {
  patente: string;
  tipo: string;
  horaIngreso: string;
  horaEgreso: string;
  monto: number;
   medioPago: string;
}

interface VehicleHistoryProps {
  history: HistoryEntry[];
}

export function VehicleHistory({ history }: VehicleHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay vehículos en el historial</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry, index) => (
        <Card key={index} className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-lg">{entry.patente}</p>
                <p className="text-sm text-gray-500">{entry.tipo}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">${entry.monto}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div>
                <p className="text-gray-500">Ingreso</p>
                <p className="font-medium">{entry.horaIngreso}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Egreso</p>
                <p className="font-medium">{entry.horaEgreso}</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Medio de pago:</span>
              <span className="font-medium text-gray-700">{entry.medioPago}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
