import React from "react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { VehicleCard } from "./components/VehicleCard";
import { DailySummary } from "./components/DailySummary";
import { AddVehicleDialog } from "./components/AddVehicleDialog";
import { VehicleHistory } from "./components/VehicleHistory";
import { Car, History, BarChart3, Wallet, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { Button } from "./components/ui/button";

import {
  Vehicle as BusinessVehicle,
  ParkingState,
  loadInitialState,
  persistState,
  createVehicle,
  checkoutVehicle,
  calculateSummary,
  shouldResetToday,
  markResetDone,
  PaymentMethod,
} from "./utils/parkingLogic";

interface HistoryEntryUi {
  patente: string;
  tipo: string;
  horaIngreso: string;
  horaEgreso: string;
  monto: number;
  medioPago: string;
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return "-";
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHoursFromMinutes(totalMinutes: number | null): string {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0 min";
  }

  // Si es menos de una hora, mostramos minutos para mayor intuición
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = totalMinutes / 60;
  return `${hours.toFixed(2)} h`;
}

function App() {
  const [state, setState] = useState<ParkingState>(() => {
    const initial = loadInitialState();
    if (shouldResetToday()) {
      markResetDone();
      return { activeVehicles: [], history: [] };
    }
    return initial;
  });

  const { activeVehicles, history } = state;

  // Persistir en localStorage cada vez que cambie el estado
  useEffect(() => {
    persistState(state);
  }, [state]);

  const summary = calculateSummary(state);
  const vehiculosIngresados = summary.totalVehicles;
  const dineroCobrado = summary.totalCharged;
  const efectivoTotal = summary.cashTotal ?? 0;
  const transferenciaTotal = summary.transferTotal ?? 0;

  const [vehicleToCheckout, setVehicleToCheckout] = useState<BusinessVehicle | null>(null);
  const [previewCheckout, setPreviewCheckout] = useState<BusinessVehicle | null>(null);
  const [vehicleForExitTime, setVehicleForExitTime] = useState<BusinessVehicle | null>(null);
  const [exitTimeInput, setExitTimeInput] = useState<string>("");
  const [vehicleToCancel, setVehicleToCancel] = useState<BusinessVehicle | null>(null);
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const handleAddVehicle = (patente: string, tipo: string, horaIngreso?: string | null) => {
    if (!patente || !tipo) return;

    const newVehicle = createVehicle(
      patente,
      tipo as any,
      state.activeVehicles,
      horaIngreso ?? null
    );

    setState((prev) => ({
      ...prev,
      activeVehicles: [...prev.activeVehicles, newVehicle],
    }));

    toast.success(`Vehículo ${patente} ingresado correctamente`);
  };

  const openCheckoutDialog = (vehicle: BusinessVehicle) => {
    setVehicleForExitTime(vehicle);
    setExitTimeInput("");
  };

  const confirmCheckout = () => {
    if (!vehicleToCheckout) return;

    const finalized: BusinessVehicle = {
      ...vehicleToCheckout,
      paymentMethod,
    };

    setState((prev) => ({
      activeVehicles: prev.activeVehicles.filter((v) => v.id !== vehicleToCheckout.id),
      history: [finalized, ...prev.history],
    }));

    setVehicleToCheckout(null);
    setPreviewCheckout(null);

    if (finalized.amountCharged != null) {
      toast.success(`Egreso registrado - Total: $${finalized.amountCharged}`);
    } else {
      toast.success("Egreso registrado");
    }
  };

  const cancelCheckoutDialog = () => {
    setVehicleToCheckout(null);
    setPreviewCheckout(null);
  };

  const openCancelDialog = (vehicle: BusinessVehicle) => {
    setVehicleToCancel(vehicle);
  };

  const confirmCancel = () => {
    if (!vehicleToCancel) return;

    const vehicle = vehicleToCancel;

    setState((prev) => ({
      ...prev,
      activeVehicles: prev.activeVehicles.filter((v) => v.id !== vehicle.id),
    }));
    setVehicleToCancel(null);
    toast.info(`Vehículo ${vehicle.originalPlate} cancelado`);
  };

  const cancelCancelDialog = () => {
    setVehicleToCancel(null);
  };

  const uiHistory: HistoryEntryUi[] = history.map((v) => ({
    patente: v.originalPlate,
    tipo: v.type,
    horaIngreso: formatTime(v.entryTimestamp),
    horaEgreso: formatTime(v.exitTimestamp),
    monto: v.amountCharged ?? 0,
    medioPago:
      v.paymentMethod === "cash"
        ? "Efectivo"
        : v.paymentMethod === "transfer"
        ? "Transferencia bancaria"
        : "-",
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Toaster />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-10 shadow-lg">
        <h1 className="text-2xl font-bold mb-1">Playa de Estacionamiento</h1>
        <p className="text-blue-100 text-sm">Sistema de Gestión</p>
      </div>

      {/* Summary */}
      <div className="p-4">
        <DailySummary
          vehiculosIngresados={vehiculosIngresados}
          dineroCobrado={dineroCobrado}
          efectivo={efectivoTotal}
          transferencia={transferenciaTotal}
        />
      </div>

      {/* Main Content */}
      <div className="px-4">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span>Activos</span>
              {activeVehicles.length > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {activeVehicles.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Historial</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <AddVehicleDialog onAdd={handleAddVehicle} />

            <div className="space-y-3">
              {activeVehicles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Car className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg">No hay vehículos activos</p>
                  <p className="text-sm">
                    Presiona &quot;Ingresar Vehículo&quot; para comenzar
                  </p>
                </div>
              ) : (
                activeVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    patente={vehicle.originalPlate}
                    hora={formatTime(vehicle.entryTimestamp)}
                    tipo={vehicle.type}
                    onCheckout={() => openCheckoutDialog(vehicle)}
                    onCancel={() => openCancelDialog(vehicle)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Historial de Vehículos</h2>
              </div>
              {history.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  type="button"
                  onClick={() => setClearHistoryOpen(true)}
                >
                  Borrar historial
                </Button>
              )}
            </div>
            <VehicleHistory history={uiHistory} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de selección de hora de egreso */}
      <Dialog
        open={!!vehicleForExitTime}
        onOpenChange={(open) => {
          if (!open) {
            setVehicleForExitTime(null);
            setExitTimeInput("");
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Hora de egreso</DialogTitle>
          </DialogHeader>
          {vehicleForExitTime && (
            <div className="space-y-4 text-sm">
              <p>
                Vehículo:{" "}
                <span className="font-semibold">{vehicleForExitTime.originalPlate}</span>
              </p>
              <div className="space-y-2">
                <label
                  className="text-xs font-medium text-gray-600"
                  htmlFor="horaEgresoSeleccion"
                >
                  Seleccioná la hora de egreso (opcional)
                </label>
                <input
                  id="horaEgresoSeleccion"
                  type="time"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={exitTimeInput}
                  onChange={(e) => setExitTimeInput(e.target.value)}
                />
                <p className="text-[11px] text-gray-500">
                  Si lo dejás vacío se tomará la hora actual.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  type="button"
                  onClick={() => {
                    setVehicleForExitTime(null);
                    setExitTimeInput("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  type="button"
                  onClick={() => {
                    const checkedOut = checkoutVehicle(
                      vehicleForExitTime,
                      exitTimeInput || null
                    );
                    setPreviewCheckout(checkedOut);
                    setVehicleToCheckout(checkedOut);
                    setVehicleForExitTime(null);
                    setExitTimeInput("");
                    setPaymentMethod("cash");
                  }}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de egreso (resumen) */}
      <Dialog open={!!vehicleToCheckout} onOpenChange={(open) => !open && cancelCheckoutDialog()}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Egreso de vehículo</DialogTitle>
          </DialogHeader>
          {previewCheckout && (
            <div className="space-y-3 text-sm">
              <p>
                Vehículo: <span className="font-semibold">{previewCheckout.originalPlate}</span>
              </p>
              <p>
                Ingreso: <span className="font-medium">{formatTime(previewCheckout.entryTimestamp)}</span>
              </p>
              <p>
                Egreso:{" "}
                <span className="font-medium">
                  {formatTime(previewCheckout.exitTimestamp)}
                </span>
              </p>
              <p>
                Tiempo total (horas):{" "}
                <span className="font-medium">
                  {formatHoursFromMinutes(previewCheckout.totalMinutes)}
                </span>
              </p>
              <p>
                Horas cobradas:{" "}
                <span className="font-medium">
                  {previewCheckout.hoursCharged ?? 0}
                </span>
              </p>
              <p>
                Monto a pagar:{" "}
                <span className="font-bold text-green-600">
                  ${previewCheckout.amountCharged ?? 0}
                </span>
              </p>
              <div className="pt-1 space-y-1">
                <p className="text-xs text-gray-500">Medio de pago</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={`flex-1 text-xs py-2 flex items-center justify-center gap-1 border ${
                      paymentMethod === "cash"
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <Wallet className="h-3 w-3" />
                    Efectivo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`flex-1 text-xs py-2 flex items-center justify-center gap-1 border ${
                      paymentMethod === "transfer"
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("transfer")}
                  >
                    <CreditCard className="h-3 w-3" />
                    Transferencia bancaria
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  type="button"
                  onClick={cancelCheckoutDialog}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  type="button"
                  onClick={confirmCheckout}
                >
                  Confirmar egreso
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de cancelación */}
      <Dialog open={!!vehicleToCancel} onOpenChange={(open) => !open && cancelCancelDialog()}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Cancelar vehículo</DialogTitle>
          </DialogHeader>
          {vehicleToCancel && (
            <div className="space-y-4 text-sm">
              <p>
                ¿Seguro que querés cancelar el vehículo{" "}
                <span className="font-semibold">{vehicleToCancel.originalPlate}</span>?
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  type="button"
                  onClick={cancelCancelDialog}
                >
                  No, volver
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  type="button"
                  onClick={confirmCancel}
                >
                  Sí, cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para borrar historial */}
      <Dialog open={clearHistoryOpen} onOpenChange={setClearHistoryOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Borrar historial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              ¿Seguro que querés borrar todo el historial de vehículos egresados?
            </p>
            <p className="text-xs text-gray-500">
              Esta acción solo afecta al historial, no modifica los vehículos activos.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                type="button"
                onClick={() => setClearHistoryOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                type="button"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    history: [],
                  }));
                  setClearHistoryOpen(false);
                  toast.info("Historial borrado correctamente");
                }}
              >
                Borrar historial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
