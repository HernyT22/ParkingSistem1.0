import React from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DEFAULT_VEHICLE_TYPE,
  getAddVehicleFormResetValues,
  parseAddVehicleSubmit,
} from "../presenters/addVehiclePresenter";

interface AddVehicleDialogProps {
  onAdd: (patente: string, tipo: string, horaIngreso?: string | null) => void;
}

export function AddVehicleDialog({ onAdd }: AddVehicleDialogProps) {
  const [patente, setPatente] = useState("");
  const [tipo, setTipo] = useState(DEFAULT_VEHICLE_TYPE);
  const [open, setOpen] = useState(false);
  const [horaIngreso, setHoraIngreso] = useState("");
  const [patenteError, setPatenteError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patente.trim()) {
      setPatenteError("Debes ingresar una patente");
      return;
    }

    const parsed = parseAddVehicleSubmit(patente, tipo, horaIngreso);
    if (parsed) {
      onAdd(parsed.patente, parsed.tipo, parsed.horaIngreso);
      const reset = getAddVehicleFormResetValues();
      setPatente(reset.patente);
      setTipo(reset.tipo);
      setHoraIngreso(reset.horaIngreso);
      setPatenteError(null);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Ingresar Vehículo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ingresar Vehículo</DialogTitle>
          <DialogDescription>
            Registra un nuevo vehículo en el estacionamiento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="patente">Patente</Label>
            <Input
              id="patente"
              placeholder="ABC123"
              value={patente}
              onChange={(e) => {
                setPatenteError(null);
                setPatente(e.target.value.toUpperCase());
              }}
              className="text-lg"
              autoComplete="off"
            />
            {patenteError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">
                {patenteError}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Vehículo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Car/SUV">Auto/Suv</SelectItem>
                <SelectItem value="Pickup">Camioneta</SelectItem>
                <SelectItem value="Motorcycle">Motocicleta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="horaIngreso">Hora de ingreso (opcional)</Label>
            <Input
              id="horaIngreso"
              type="time"
              value={horaIngreso}
              onChange={(e) => setHoraIngreso(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Si lo dejas vacío se tomará la hora actual.
            </p>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
            Registrar Ingreso
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
