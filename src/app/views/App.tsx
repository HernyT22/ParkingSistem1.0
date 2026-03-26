import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { VehicleCard } from "./VehicleCard";
import { DailySummary } from "./DailySummary";
import { AddVehicleDialog } from "./AddVehicleDialog";
import { VehicleHistory } from "./VehicleHistory";
import { Car, History, BarChart3, Wallet, CreditCard, LogOutIcon } from "lucide-react";
import { Toaster } from "../components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { useParkingAppPresenter } from "../presenters/useParkingAppPresenter";
import { useAuthPresenter } from "../presenters/useAuthPresenter";



function App() {
  const { handleLogout } = useAuthPresenter()
  const p = useParkingAppPresenter()
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Toaster />

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-6 pb-4 sticky top-0 z-10 shadow-lg">
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-2xl font-bold mb-1">Playa de Estacionamiento</h1>
      <p className="text-blue-100 text-sm">Sistema de Gestión</p>
    </div>
    <button
      onClick={() => setLogoutOpen(true)}
      title="Cerrar sesión"
      className="mt-1 p-2 rounded-full bg-blue-500/40 hover:bg-blue-400/50 transition-colors"
    >
      <LogOutIcon className="h-4 w-4 text-white" />
  </button>
  </div>
</div>

      <div className="p-4">
        <DailySummary
          vehiculosIngresados={p.vehiculosIngresados}
          dineroCobrado={p.dineroCobrado}
          efectivo={p.efectivoTotal}
          transferencia={p.transferenciaTotal}
        />
      </div>

      <div className="px-4">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span>Activos</span>
              {p.activeVehicles.length > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {p.activeVehicles.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Historial</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <AddVehicleDialog onAdd={p.handleAddVehicle} />

            <div className="space-y-3">
              {p.activeVehicles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Car className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg">No hay vehículos activos</p>
                  <p className="text-sm">
                    Presiona &quot;Ingresar Vehículo&quot; para comenzar
                  </p>
                </div>
              ) : (
                p.activeVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    patente={vehicle.originalPlate}
                    hora={p.formatTime(vehicle.entryTimestamp)}
                    tipo={vehicle.type}
                    onCheckout={() => p.openCheckoutDialog(vehicle)}
                    onCancel={() => p.openCancelDialog(vehicle)}
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
              {p.history.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  type="button"
                  onClick={() => p.setClearHistoryOpen(true)}
                >
                  Borrar historial
                </Button>
              )}
            </div>
            <VehicleHistory history={p.uiHistory} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={!!p.vehicleForExitTime}
        onOpenChange={(open) => {
          if (!open) {
            p.closeExitTimeDialog();
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Hora de egreso</DialogTitle>
          </DialogHeader>
          {p.vehicleForExitTime && (
            <div className="space-y-4 text-sm">
              <p>
                Vehículo:{" "}
                <span className="font-semibold">{p.vehicleForExitTime.originalPlate}</span>
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
                  value={p.exitTimeInput}
                  onChange={(e) => p.setExitTimeInput(e.target.value)}
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
                  onClick={p.closeExitTimeDialog}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  type="button"
                  onClick={p.onContinueExitTime}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!p.vehicleToCheckout} onOpenChange={(open) => !open && p.cancelCheckoutDialog()}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Egreso de vehículo</DialogTitle>
          </DialogHeader>
          {p.previewCheckout && (
            <div className="space-y-3 text-sm">
              <p>
                Vehículo: <span className="font-semibold">{p.previewCheckout.originalPlate}</span>
              </p>
              <p>
                Ingreso: <span className="font-medium">{p.formatTime(p.previewCheckout.entryTimestamp)}</span>
              </p>
              <p>
                Egreso:{" "}
                <span className="font-medium">
                  {p.formatTime(p.previewCheckout.exitTimestamp)}
                </span>
              </p>
              <p>
                Tiempo total (horas):{" "}
                <span className="font-medium">
                  {p.formatHoursFromMinutes(p.previewCheckout.totalMinutes)}
                </span>
              </p>
              <p>
                Horas cobradas:{" "}
                <span className="font-medium">
                  {p.previewCheckout.hoursCharged ?? 0}
                </span>
              </p>
              <p>
                Monto a pagar:{" "}
                <span className="font-bold text-green-600">
                  ${p.previewCheckout.amountCharged ?? 0}
                </span>
              </p>
              <div className="pt-1 space-y-1">
                <p className="text-xs text-gray-500">Medio de pago</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={`flex-1 text-xs py-2 flex items-center justify-center gap-1 border ${
                      p.paymentMethod === "cash"
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => p.setPaymentMethod("cash")}
                  >
                    <Wallet className="h-3 w-3" />
                    Efectivo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`flex-1 text-xs py-2 flex items-center justify-center gap-1 border ${
                      p.paymentMethod === "transfer"
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => p.setPaymentMethod("transfer")}
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
                  onClick={p.cancelCheckoutDialog}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  type="button"
                  onClick={p.confirmCheckout}
                >
                  Confirmar egreso
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!p.vehicleToCancel} onOpenChange={(open) => !open && p.cancelCancelDialog()}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Cancelar vehículo</DialogTitle>
          </DialogHeader>
          {p.vehicleToCancel && (
            <div className="space-y-4 text-sm">
              <p>
                ¿Seguro que querés cancelar el vehículo{" "}
                <span className="font-semibold">{p.vehicleToCancel.originalPlate}</span>?
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  type="button"
                  onClick={p.cancelCancelDialog}
                >
                  No, volver
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  type="button"
                  onClick={p.confirmCancel}
                >
                  Sí, cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={p.clearHistoryOpen} onOpenChange={p.setClearHistoryOpen}>
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
                onClick={() => p.setClearHistoryOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                type="button"
                onClick={p.onClearHistoryConfirm}
              >
                Borrar historial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
  <DialogContent aria-describedby={undefined}>
    <DialogHeader>
      <DialogTitle>Cerrar sesión</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 text-sm">
      <p>¿Seguro que querés cerrar la sesión?</p>
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          type="button"
          onClick={() => setLogoutOpen(false)}
        >
          Cancelar
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          type="button"
          onClick={() => {
            setLogoutOpen(false)
            handleLogout()
          }}
        >
          <LogOutIcon className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
  
}

export default App;
