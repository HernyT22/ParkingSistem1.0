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
  persistState,
  shouldResetToday,
  markResetDone,
} from "../services/parkingStorage";

export function useParkingAppPresenter() {
  const [state, setState] = useState(() => {
    const initial = loadInitialState();
    if (shouldResetToday()) {
      markResetDone();
      return { activeVehicles: [], history: [] };
    }
    return initial;
  });

  const { activeVehicles, history } = state;

  useEffect(() => {
    persistState(state);
  }, [state]);

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

    setState((prev) => ({
      ...prev,
      activeVehicles: [...prev.activeVehicles, newVehicle],
    }));

    toast.success(`Vehículo ${patente} ingresado correctamente`);
  };

  const openCheckoutDialog = (vehicle: Vehicle) => {
    setVehicleForExitTime(vehicle);
    setExitTimeInput("");
  };

  const confirmCheckout = () => {
    if (!vehicleToCheckout) return;

    const finalized: Vehicle = {
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

  const openCancelDialog = (vehicle: Vehicle) => {
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

  const onClearHistoryConfirm = () => {
    setState((prev) => ({
      ...prev,
      history: [],
    }));
    setClearHistoryOpen(false);
    toast.info("Historial borrado correctamente");
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
