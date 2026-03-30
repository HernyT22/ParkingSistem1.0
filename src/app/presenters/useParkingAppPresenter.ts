import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PaymentMethod, Vehicle, VehicleType } from "../models/parking";
import { mapHistoryToUi, formatTime, formatHoursFromMinutes } from "./appPresenter";
import {
  createVehicle,
  checkoutVehicle,
  calculateSummary,
} from "../services/parkingLogic";
import {
  loadInitialState,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from "../services/parkingStorage";

export function useParkingAppPresenter() {
  const [state, setState] = useState<{ activeVehicles: Vehicle[]; history: Vehicle[] }>({
    activeVehicles: [],
    history: [],
  });

  // Carga inicial desde localStorage (sync con Supabase en background)
  useEffect(() => {
    const fetchState = async () => {
      const initial = await loadInitialState();
      setState(initial);
    };

    fetchState();
  }, []);

  const { activeVehicles, history } = state;

  const summary = calculateSummary(state);
  const vehiculosIngresados = summary.totalVehicles;
  const dineroCobrado = summary.totalCharged;
  const efectivoTotal = summary.cashTotal ?? 0;
  const transferenciaTotal = summary.transferTotal ?? 0;

  const [vehicleToCheckout, setVehicleToCheckout] = useState<Vehicle | null>(null);
  const [previewCheckout, setPreviewCheckout] = useState<Vehicle | null>(null);
  const [vehicleForExitTime, setVehicleForExitTime] = useState<Vehicle | null>(null);
  const [exitTimeInput, setExitTimeInput] = useState<string>("");
  const [vehicleToCancel, setVehicleToCancel] = useState<Vehicle | null>(null);
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const handleAddVehicle = (patente: string, tipo: string, horaIngreso?: string | null) => {
    if (!patente || !tipo) return;

    const newVehicle = createVehicle(
      patente,
      tipo as VehicleType,
      state.activeVehicles,
      horaIngreso ?? null
    );

    try {
      // Guarda primero en localStorage (UX instantánea)
      addVehicle(newVehicle);

      // Actualiza React state
      setState((prev) => ({
        ...prev,
        activeVehicles: [...prev.activeVehicles, newVehicle],
      }));

      toast.success(`Vehículo ${patente} ingresado correctamente`);
    } catch {
      toast.error(`Error al ingresar el vehículo ${patente}`);
    }
  };

  const openCheckoutDialog = (vehicle: Vehicle) => {
    setVehicleForExitTime(vehicle);
    setExitTimeInput("");
  };

  const confirmCheckout = async () => {
    if (!vehicleToCheckout) return;

    const finalized: Vehicle = {
      ...vehicleToCheckout,
      paymentMethod,
    };

    try {
      updateVehicle(finalized);

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
    } catch {
      toast.error("Error al registrar el egreso");
    }
  };

  const cancelCheckoutDialog = () => {
    setVehicleToCheckout(null);
    setPreviewCheckout(null);
  };

  const openCancelDialog = (vehicle: Vehicle) => {
    setVehicleToCancel(vehicle);
  };

  const confirmCancel = async () => {
    if (!vehicleToCancel) return;

    const vehicle = vehicleToCancel;

    try {
      deleteVehicle(vehicle.id);

      setState((prev) => ({
        ...prev,
        activeVehicles: prev.activeVehicles.filter((v) => v.id !== vehicle.id),
      }));

      setVehicleToCancel(null);
      toast.info(`Vehículo ${vehicle.originalPlate} cancelado`);
    } catch {
      toast.error("Error al cancelar el vehículo");
    }
  };

  const cancelCancelDialog = () => {
    setVehicleToCancel(null);
  };

  const uiHistory = mapHistoryToUi(history);

  const onContinueExitTime = () => {
    if (!vehicleForExitTime) return;

    const checkedOut = checkoutVehicle(vehicleForExitTime, exitTimeInput || null);

    setPreviewCheckout(checkedOut);
    setVehicleToCheckout(checkedOut);
    setVehicleForExitTime(null);
    setExitTimeInput("");
    setPaymentMethod("cash");
  };

  const onClearHistoryConfirm = async () => {
    try {
      history.forEach((v) => deleteVehicle(v.id));

      setState((prev) => ({
        ...prev,
        history: [],
      }));

      setClearHistoryOpen(false);
      toast.info("Historial borrado correctamente");
    } catch {
      toast.error("Error al borrar el historial");
    }
  };

  const closeExitTimeDialog = () => {
    setVehicleForExitTime(null);
    setExitTimeInput("");
  };

  return {
    activeVehicles,
    history,
    vehiculosIngresados,
    dineroCobrado,
    efectivoTotal,
    transferenciaTotal,
    uiHistory,
    vehicleToCheckout,
    previewCheckout,
    vehicleForExitTime,
    exitTimeInput,
    setExitTimeInput,
    vehicleToCancel,
    clearHistoryOpen,
    setClearHistoryOpen,
    paymentMethod,
    setPaymentMethod,
    handleAddVehicle,
    openCheckoutDialog,
    confirmCheckout,
    cancelCheckoutDialog,
    openCancelDialog,
    confirmCancel,
    cancelCancelDialog,
    closeExitTimeDialog,
    onContinueExitTime,
    onClearHistoryConfirm,
    formatTime,
    formatHoursFromMinutes,
  };
}