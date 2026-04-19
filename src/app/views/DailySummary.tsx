import { Car, DollarSign } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

interface DailySummaryProps {
  vehiculosIngresados: number;
  dineroCobrado: number;
  efectivo: number;
  transferencia: number;
}

export function DailySummary({
  vehiculosIngresados,
  dineroCobrado,
  efectivo,
  transferencia,
}: DailySummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Car className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-gray-600">Vehículos</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{vehiculosIngresados}</p>
          <p className="text-xs text-gray-500 mt-1">Ingresados hoy</p>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <p className="text-sm text-gray-600">Recaudado</p>
          </div>
          <p className="text-2xl font-bold text-green-600">${dineroCobrado}</p>
          <p className="text-xs text-gray-500 mt-1">Total del día</p>
          <p className="text-xs text-gray-600 mt-1">
            Efectivo: <span className="font-semibold">${efectivo}</span>
          </p>
          <p className="text-xs text-gray-600">
            Transferencia: <span className="font-semibold">${transferencia}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
