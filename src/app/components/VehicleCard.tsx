import { Car, ArrowRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface VehicleCardProps {
  patente: string;
  hora: string;
  tipo: string;
  onCheckout: () => void;
  onCancel: () => void;
}

export function VehicleCard({ patente, hora, tipo, onCheckout, onCancel }: VehicleCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">{patente}</p>
              <p className="text-sm text-gray-500">{tipo}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Ingreso</p>
            <p className="font-medium">{hora}</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            onClick={onCheckout}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            size="lg"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Egreso
          </Button>
          <Button
            onClick={onCancel}
            variant="destructive"
            size="lg"
            className="flex-1"
          >
            <X className="h-5 w-5 mr-2" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
