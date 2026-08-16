import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const emptyRoom = {
  codigo: "",
  descripcion: "",
  precio_mensual: "",
  estado: "DISPONIBLE",
  servicios: "",
  observaciones: "",
};

const emptySolicitud = {
  nombres: "",
  telefono: "",
  correo: "",
  mensaje: "",
};

const emptyAuthForm = {
  nombres: "",
  apellidos: "",
  correo: "",
  telefono: "",
  password: "",
};

const emptyContactForm = {
  nombres: "",
  telefono: "",
  correo: "",
  asunto: "Consulta de habitación",
  mensaje: "",
};

const nombrePattern = "[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,}";
const telefonoPattern = "[0-9]{7,10}";
const letrasPattern = "[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,}";
const periodoPattern = "(?=.*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]{4,30}";
const cedulaPattern = "[0-9]{10}";
const codigoPattern = "[A-Za-z0-9-]{2,20}";
const roomGalleryImages = [
  "/room-gallery/room-1.png",
  "/room-gallery/room-2.png",
  "/room-gallery/room-3.png",
  "/room-gallery/room-4.png",
];

const roomImagesByFloor = {
  2: [
    "/room-gallery/room-1.png",
    "/room-gallery/room-2.png",
    "/room-gallery/room-3.png",
    "/room-gallery/room-4.png",
  ],
  3: [
    "/room-gallery/room-2.png",
    "/room-gallery/room-3.png",
    "/room-gallery/room-1.png",
    "/room-gallery/room-4.png",
  ],
  4: [
    "/rooms/406/406.jpeg",
    "/rooms/406/406 a.jpeg",
    "/rooms/407/principal.jpeg.jpeg",
    "/rooms/407/cama.jpeg.jpeg",
    "/rooms/407/bano.jpeg.jpeg",
  ],
};

const roomReferenceByFloor = {
  2: "Foto referencial del Piso 2",
  3: "Foto referencial del Piso 3",
  4: "Foto referencial del Piso 4",
};

function getRoomGalleryImages(habitacion) {
  const floor = getRoomFloor(habitacion?.codigo);
  return roomImagesByFloor[floor] || roomGalleryImages;
}

function getRoomCoverImage(habitacion) {
  return getRoomGalleryImages(habitacion)[0];
}

function getRoomPhotoReference(habitacion) {
  const floor = getRoomFloor(habitacion?.codigo);
  return roomReferenceByFloor[floor] || "Foto referencial";
}

const publicFloorOptions = [
  ["todos", "Todos"],
  ["2", "Piso 2"],
  ["3", "Piso 3"],
  ["4", "Piso 4"],
];

const paymentMethodLabels = {
  SIN_SELECCIONAR: "Sin seleccionar",
  PAYPAL: "PayPal",
  TRANSFERENCIA: "Transferencia bancaria",
  SITIO: "Pagar en el sitio",
};

const paymentStatusLabels = {
  SIN_SELECCIONAR: "Sin seleccionar",
  PENDIENTE: "Pendiente de confirmación",
  CONFIRMADO: "Confirmado",
};

const paymentPeriodOptions = generatePaymentPeriods();

const bankTransferInfo = {
  banco: "Banco por confirmar",
  tipo: "Cuenta de ahorros",
  numero: "0000000000",
  titular: "Habitaciones amobladas",
  identificacion: "RUC/Cédula por registrar",
};

const emptyPublicAccount = { arriendos: [], pagos: [] };

const paymentProofTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const paymentProofMaxSize = 5 * 1024 * 1024;

function getRoomFloor(codigo) {
  const value = String(codigo || "");
  return /^[234]0[1-9]$/.test(value) ? value[0] : "otros";
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function getRoomFeatureTags(habitacion) {
  const text = `${habitacion?.servicios || ""} ${habitacion?.descripcion || ""}`.toLowerCase();
  const tags = [];
  if (text.includes("aire")) tags.push("Aire acondicionado");
  if (text.includes("baño") || text.includes("bano")) tags.push("Baño privado");
  if (text.includes("internet")) tags.push("Internet");
  if (!tags.length) tags.push("Amoblada");
  return tags.slice(0, 3);
}

function getFloorTitle(floor) {
  return floor === "otros" ? "Otras habitaciones" : `Piso ${floor}`;
}

function getFloorRange(floor) {
  return /^[234]$/.test(String(floor)) ? `Habitaciones ${floor}01 a ${floor}09` : "Habitaciones registradas";
}

function getFloorDescription(floor) {
  const descriptions = {
    2: "Habitaciones amobladas con servicios incluidos, pensadas para una estadía práctica y tranquila.",
    3: "Ambientes compactos y ordenados, con baño privado y mobiliario esencial para uso diario.",
    4: "Habitaciones con aire acondicionado, baño privado y una distribución cómoda para arrendar.",
  };
  return descriptions[floor] || "Opciones disponibles para solicitar en línea.";
}

function getRoomGroupServices(rooms) {
  return Array.from(new Set(
    rooms.flatMap((room) => String(room.servicios || "")
      .split(",")
      .map((service) => service.trim())
      .filter(Boolean))
  )).slice(0, 6);
}

function getRoomGroupPrice(rooms) {
  const prices = rooms
    .map((room) => Number(room.precio_mensual))
    .filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) return "Precio por definir";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `$${min.toFixed(2)} / mes` : `Desde $${min.toFixed(2)} hasta $${max.toFixed(2)} / mes`;
}

const moduleConfig = {
  habitaciones: {
    title: "Habitaciones",
    endpoint: "/habitaciones/",
    empty: emptyRoom,
    fields: [
      {
        name: "codigo",
        label: "Código",
        required: true,
        placeholder: "H001",
        pattern: codigoPattern,
        maxLength: 20,
        title: "Use letras, números o guion. Ejemplo: H001",
      },
      { name: "precio_mensual", label: "Precio mensual", type: "number", required: true, placeholder: "120.00", min: "0.01", step: "0.01" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          ["DISPONIBLE", "Disponible"],
          ["OCUPADA", "Ocupada"],
          ["MANTENIMIENTO", "Mantenimiento"],
        ],
      },
      { name: "servicios", label: "Servicios", span: true, placeholder: "Agua, luz, internet" },
      { name: "descripcion", label: "Descripción", type: "textarea", span: true },
      { name: "observaciones", label: "Observaciones", type: "textarea", span: true },
    ],
    columns: ["codigo", "estado", "precio_mensual"],
  },
  solicitudes: {
    title: "Solicitudes",
    endpoint: "/solicitudes-arrendamiento/",
    empty: {
      habitacion: "",
      nombres: "",
      telefono: "",
      correo: "",
      mensaje: "",
      estado: "PENDIENTE",
    },
    fields: [
      { name: "habitacion", label: "Habitación solicitada", type: "select-remote", source: "habitaciones", required: true },
      { name: "nombres", label: "Nombres", required: true, pattern: nombrePattern, minLength: 3, maxLength: 150, title: "Ingrese solo letras y espacios." },
      { name: "telefono", label: "Teléfono", required: true, pattern: telefonoPattern, inputMode: "numeric", maxLength: 10, title: "Ingrese solo números, entre 7 y 10 dígitos." },
      { name: "correo", label: "Correo", type: "email" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          ["PENDIENTE", "Pendiente"],
          ["APROBADA", "Aprobada"],
          ["RECHAZADA", "Rechazada"],
        ],
      },
      { name: "mensaje", label: "Mensaje", type: "textarea", span: true },
    ],
    columns: ["nombres", "telefono", "habitacion", "estado", "metodo_pago", "estado_pago"],
  },
  arrendatarios: {
    title: "Arrendatarios",
    endpoint: "/arrendatarios/",
    empty: {
      nombres: "",
      apellidos: "",
      cedula: "",
      telefono: "",
      correo: "",
      direccion: "",
      contacto_emergencia: "",
      estado: "ACTIVO",
    },
    fields: [
      { name: "nombres", label: "Nombres", required: true, pattern: nombrePattern, minLength: 3, maxLength: 100, title: "Ingrese solo letras y espacios." },
      { name: "apellidos", label: "Apellidos", required: true, pattern: nombrePattern, minLength: 3, maxLength: 100, title: "Ingrese solo letras y espacios." },
      { name: "cedula", label: "Cédula", required: true, pattern: cedulaPattern, inputMode: "numeric", maxLength: 10, title: "Ingrese una cédula ecuatoriana de 10 dígitos." },
      { name: "telefono", label: "Teléfono", required: true, pattern: telefonoPattern, inputMode: "numeric", maxLength: 10, title: "Ingrese solo números, entre 7 y 10 dígitos." },
      { name: "correo", label: "Correo", type: "email" },
      {
        name: "estado",
        label: "Estado del cliente",
        type: "select",
        options: [
          ["ACTIVO", "Activo"],
          ["INACTIVO", "Inactivo"],
        ],
      },
      { name: "contacto_emergencia", label: "Contacto de emergencia", span: true, placeholder: "Ej. familiar o persona de confianza - teléfono" },
    ],
    columns: ["nombres", "apellidos", "cedula", "telefono"],
  },
  arriendos: {
    title: "Arriendos",
    endpoint: "/arriendos/",
    empty: {
      arrendatario: "",
      habitacion: "",
      fecha_inicio: "",
      fecha_fin: "",
      valor_mensual: "",
      estado: "ACTIVO",
      observaciones: "",
    },
    fields: [
      { name: "arrendatario", label: "Arrendatario", type: "select-remote", source: "arrendatarios", required: true },
      { name: "habitacion", label: "Habitación", type: "select-remote", source: "habitaciones", required: true },
      { name: "fecha_inicio", label: "Fecha inicio", type: "date", required: true },
      { name: "fecha_fin", label: "Fecha fin", type: "date" },
      { name: "valor_mensual", label: "Valor mensual", type: "number", required: true, min: "0.01", step: "0.01" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          ["ACTIVO", "Activo"],
          ["FINALIZADO", "Finalizado"],
          ["CANCELADO", "Cancelado"],
        ],
      },
      { name: "observaciones", label: "Observaciones", type: "textarea", span: true },
    ],
    columns: ["arrendatario", "habitacion", "fecha_inicio", "estado"],
  },
  pagos: {
    title: "Pagos",
    endpoint: "/pagos/",
    empty: {
      arriendo: "",
      periodo: currentMonthPeriod(),
      fecha_vencimiento: dueDateForPeriod(currentMonthPeriod()),
      fecha_pago: "",
      monto: "120.00",
      metodo_pago: "",
      estado: "PENDIENTE",
      observaciones: "",
    },
    fields: [
      { name: "arriendo", label: "Arriendo", type: "select-remote", source: "arriendos", required: true, span: true },
      { name: "periodo", label: "Periodo", type: "select", required: true, options: paymentPeriodOptions },
      { name: "fecha_vencimiento", label: "Fecha límite de pago", type: "date", required: true, readOnly: true, title: "Se calcula automáticamente con el período seleccionado." },
      { name: "fecha_pago", label: "Fecha real de pago", type: "date", readOnly: true, title: "Se llena automáticamente cuando el estado es Pagado." },
      { name: "monto", label: "Monto", type: "number", required: true, min: "120", step: "1", readOnly: true, title: "El monto se toma automáticamente del arriendo." },
      {
        name: "metodo_pago",
        label: "Forma de pago",
        type: "select",
        options: [
          ["", "Seleccione..."],
          ["Efectivo", "Efectivo"],
          ["Transferencia", "Transferencia"],
          ["PayPal", "PayPal"],
          ["Pago en el sitio", "Pago en el sitio"],
        ],
      },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          ["PENDIENTE", "Pendiente"],
          ["PAGADO", "Pagado"],
          ["ATRASADO", "Atrasado"],
        ],
      },
      { name: "observaciones", label: "Observaciones", type: "textarea", span: true },
    ],
    columns: ["periodo", "monto", "estado", "fecha_vencimiento"],
  },
  garantias: {
    title: "Garantías",
    endpoint: "/garantias/",
    empty: {
      arriendo: "",
      monto: "120.00",
      fecha_entrega: todayIsoDate(),
      fecha_devolucion: "",
      estado: "RETENIDA",
      observaciones: "",
    },
    fields: [
      { name: "arriendo", label: "Arriendo", type: "select-remote", source: "arriendos", required: true, span: true },
      { name: "monto", label: "Monto de garantía", type: "number", required: true, min: "120", step: "1", readOnly: true, title: "La garantía se toma automáticamente del valor mensual del arriendo." },
      { name: "fecha_entrega", label: "Fecha de entrega", type: "date", required: true },
      { name: "fecha_devolucion", label: "Fecha de devolución", type: "date", readOnly: true, title: "Se llena automáticamente cuando el estado es Devuelta." },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          ["RETENIDA", "Retenida"],
          ["DEVUELTA", "Devuelta"],
          ["USADA_POR_DANOS", "Usada por daños"],
        ],
      },
      { name: "observaciones", label: "Observaciones", type: "textarea", span: true },
    ],
    columns: ["arriendo", "monto", "estado", "fecha_entrega"],
  },
  inventario: {
    title: "Inventario",
    endpoint: "/inventario-habitaciones/",
    empty: {
      habitacion: "",
      nombre_bien: "",
      descripcion: "",
      cantidad: 1,
      estado: "BUENO",
      observaciones: "",
    },
    fields: [
      { name: "habitacion", label: "Habitación", type: "select-remote", source: "habitaciones", required: true },
      { name: "nombre_bien", label: "Bien", required: true, placeholder: "Cama", pattern: letrasPattern, minLength: 3, maxLength: 100, title: "Ingrese solo letras. Ejemplo: Cama." },
      { name: "cantidad", label: "Cantidad", type: "number", required: true, min: "1", step: "1" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          ["BUENO", "Bueno"],
          ["REGULAR", "Regular"],
          ["MALO", "Malo"],
          ["DANADO", "Dañado"],
        ],
      },
      { name: "descripcion", label: "Descripción", type: "textarea", span: true },
      { name: "observaciones", label: "Observaciones", type: "textarea", span: true },
    ],
    columns: ["habitacion", "nombre_bien", "cantidad", "estado"],
  },
};

const estadoLabels = {
  DISPONIBLE: "Disponible",
  OCUPADA: "Ocupada",
  MANTENIMIENTO: "Mantenimiento",
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
  PAGADO: "Pagado",
  ATRASADO: "Atrasado",
  RETENIDA: "Retenida",
  DEVUELTA: "Devuelta",
  USADA_POR_DANOS: "Usada por daños",
  BUENO: "Bueno",
  REGULAR: "Regular",
  MALO: "Malo",
  DANADO: "Dañado",
};

const columnLabels = {
  codigo: "Código",
  precio_mensual: "Precio mensual",
  habitacion: "Habitación",
  telefono: "Teléfono",
  cedula: "Cédula",
  direccion: "Observaciones",
  fecha_inicio: "Fecha inicio",
  fecha_vencimiento: "Fecha vencimiento",
  fecha_pago: "Fecha de pago",
  fecha_entrega: "Fecha entrega",
  nombre_bien: "Bien",
  metodo_pago: "Método de pago",
  estado_pago: "Estado de pago",
};

function authHeader(credentials) {
  return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
}

function publicAuthHeader(credentials) {
  return `Basic ${btoa(`${credentials.correo}:${credentials.password}`)}`;
}

function getLabel(source, id, lookups) {
  const value = Number(id);
  if (!value) return "-";
  if (source === "habitaciones") {
    const item = lookups.habitaciones.find((row) => row.id === value);
    return item ? `Habitación ${item.codigo}` : `#${id}`;
  }
  if (source === "arrendatarios") {
    const item = lookups.arrendatarios.find((row) => row.id === value);
    return item ? `${item.nombres} ${item.apellidos}` : `#${id}`;
  }
  if (source === "arriendos") {
    const item = lookups.arriendos.find((row) => row.id === value);
    if (!item) return `#${id}`;
    return `${getLabel("arrendatarios", item.arrendatario, lookups)} - ${getLabel("habitaciones", item.habitacion, lookups)}`;
  }
  return `#${id}`;
}

function formatCell(key, value, lookups) {
  if (key === "habitacion") return getLabel("habitaciones", value, lookups);
  if (key === "arrendatario") return getLabel("arrendatarios", value, lookups);
  if (key === "arriendo") return getLabel("arriendos", value, lookups);
  if (key === "metodo_pago") return paymentMethodLabels[value] || value || "-";
  if (key === "estado_pago") return paymentStatusLabels[value] || value || "-";
  if (key === "precio_mensual" || key === "valor_mensual" || key === "monto") return `$${value}`;
  if (key.includes("fecha") && value) return formatDate(value);
  return value || "-";
}

function formatColumnLabel(column) {
  return columnLabels[column] || column.replace("_", " ");
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function todayIsoDate() {
  const today = new Date();
  return dateToIso(today);
}

function dateToIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonthPeriod() {
  return formatPeriod(new Date());
}

function formatPeriod(date) {
  const value = date.toLocaleDateString("es-EC", { month: "long", year: "numeric" });
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function generatePaymentPeriods(totalMonths = 30) {
  const base = new Date();
  base.setDate(1);
  return Array.from({ length: totalMonths }, (_, index) => {
    const date = new Date(base.getFullYear(), base.getMonth() + index, 1);
    const label = formatPeriod(date);
    return [label, label];
  });
}

function periodDateFromLabel(label) {
  const foundIndex = paymentPeriodOptions.findIndex(([value]) => value === label);
  const base = new Date();
  base.setDate(1);
  if (foundIndex >= 0) return new Date(base.getFullYear(), base.getMonth() + foundIndex, 1);
  return base;
}

function dateForMonthDay(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(Number(day) || 1, lastDay));
}

function dueDateForPeriod(label, day = new Date().getDate()) {
  const periodDate = periodDateFromLabel(label);
  return dateToIso(dateForMonthDay(periodDate.getFullYear(), periodDate.getMonth(), day));
}

function nextPaymentReminder(arriendos = [], pagos = []) {
  if (!arriendos.length) return null;
  const now = new Date();
  const activePayment = pagos
    .filter((item) => item.estado !== "PAGADO")
    .map((item) => ({ ...item, dueDate: parseLocalDate(item.fecha_vencimiento) }))
    .filter((item) => item.dueDate)
    .sort((a, b) => a.dueDate - b.dueDate)[0];

  if (activePayment) {
    const days = daysBetweenDates(now, activePayment.dueDate);
    return {
      type: activePayment.estado === "ATRASADO" || days < 0 ? "late" : days <= 5 ? "soon" : "pending",
      title: activePayment.estado === "ATRASADO" || days < 0 ? "Pago vencido" : "Próximo pago pendiente",
      period: activePayment.periodo,
      dueDate: activePayment.fecha_vencimiento,
      amount: activePayment.monto,
      room: activePayment.habitacion_codigo,
      detail: days < 0
        ? `La fecha límite fue hace ${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}.`
        : days === 0
          ? "La fecha límite es hoy."
          : `Faltan ${days} ${days === 1 ? "día" : "días"} para pagar.`,
    };
  }

  const paidWithDate = pagos
    .filter((item) => item.estado === "PAGADO")
    .map((item) => ({ ...item, dueDate: parseLocalDate(item.fecha_vencimiento) }))
    .filter((item) => item.dueDate)
    .sort((a, b) => b.dueDate - a.dueDate);
  const baseDate = paidWithDate[0]?.dueDate || parseLocalDate(arriendos[0]?.fecha_inicio) || now;
  const nextDate = dateForMonthDay(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());
  const nextPeriod = formatPeriod(nextDate);
  const mainLease = arriendos[0];
  const days = daysBetweenDates(now, nextDate);

  return {
    type: days <= 5 ? "soon" : "next",
    title: "Próximo pago",
    period: nextPeriod,
    dueDate: dateToIso(nextDate),
    amount: mainLease.valor_mensual,
    room: mainLease.habitacion_codigo,
    detail: `Tu siguiente pago vence en ${days} ${days === 1 ? "día" : "días"}.`,
  };
}

function formatDate(value) {
  const date = parseLocalDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
}

function splitFullName(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nombres: parts.join(" "), apellidos: "" };
  if (parts.length === 2) return { nombres: parts[0], apellidos: parts[1] };
  return {
    nombres: parts.slice(0, 2).join(" "),
    apellidos: parts.slice(2).join(" "),
  };
}

function paymentMethodForPago(value) {
  if (value === "TRANSFERENCIA") return "Transferencia";
  if (value === "PAYPAL") return "PayPal";
  if (value === "SITIO") return "Pago en el sitio";
  return "";
}

function daysBetweenDates(fromDate, toDate) {
  if (!fromDate || !toDate) return null;
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.round((end - start) / 86400000);
}

function getPaymentTimeline(record) {
  if (record.estado === "PAGADO") {
    return {
      tone: "paid",
      title: "Pago registrado",
      detail: record.fecha_pago ? `Pagado el ${formatDate(record.fecha_pago)}` : "Pago marcado como completado.",
    };
  }

  const dueDate = parseLocalDate(record.fecha_vencimiento);
  const diff = daysBetweenDates(new Date(), dueDate);
  if (diff === null) {
    return { tone: "pending", title: "Sin fecha límite", detail: "Registra una fecha límite para controlar este cobro." };
  }
  if (diff < 0) {
    const days = Math.abs(diff);
    return { tone: "late", title: "Pago vencido", detail: `Vencido hace ${days} ${days === 1 ? "día" : "días"}.` };
  }
  if (diff === 0) {
    return { tone: "due", title: "Vence hoy", detail: "Conviene notificar al cliente hoy." };
  }
  if (diff <= 5) {
    return { tone: "soon", title: "Próximo a vencer", detail: `Faltan ${diff} ${diff === 1 ? "día" : "días"} para la fecha límite.` };
  }
  return { tone: "pending", title: "Pendiente", detail: `Faltan ${diff} días para la fecha límite.` };
}

function resolveMediaUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const apiRoot = API_BASE.replace(/\/api\/?$/, "");
  return `${apiRoot}${String(value).startsWith("/") ? value : `/${value}`}`;
}

function formatFileSize(bytes = 0) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizePayload(form) {
  const payload = { ...form };
  ["precio_mensual", "valor_mensual", "monto"].forEach((key) => {
    if (key in payload) payload[key] = Number(payload[key] || 0).toFixed(2);
  });
  if ("cantidad" in payload) payload.cantidad = Number(payload.cantidad || 1);
  Object.keys(payload).forEach((key) => {
    if (payload[key] === "" && key.startsWith("fecha_")) payload[key] = null;
    if (payload[key] === "" && ["usuario", "habitacion", "arrendatario", "arriendo"].includes(key)) payload[key] = null;
  });
  return payload;
}

function formatApiError(detail) {
  if (!detail) return "Revise los datos ingresados.";
  if (/<!doctype html|<html/i.test(detail)) {
    const title = detail.match(/<title[^>]*>(.*?)<\/title>/i)?.[1];
    const heading = detail.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1];
    const cleanText = (heading || title || "El servidor devolvió una página de error.")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleanText || "El servidor devolvió una página de error.";
  }
  try {
    const data = JSON.parse(detail);
    if (typeof data === "string") return data;
    if (Array.isArray(data)) return data.join(" ");
    return Object.entries(data)
      .map(([field, messages]) => {
        const text = Array.isArray(messages) ? messages.join(" ") : String(messages);
        return `${field}: ${text}`;
      })
      .join(" ");
  } catch (err) {
    return detail;
  }
}

function sanitizeInputValue(field, value) {
  if (field.inputMode === "numeric") {
    return value.replace(/\D/g, "");
  }
  if (field.type === "number") {
    const cleanValue = value.replace(/[^\d.]/g, "");
    const [integerPart, ...decimalParts] = cleanValue.split(".");
    const normalized = decimalParts.length ? `${integerPart}.${decimalParts.join("")}` : integerPart;
    return field.step === "1" ? normalized.replace(/\D/g, "") : normalized;
  }
  if (field.pattern === letrasPattern) {
    return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, "");
  }
  if (field.pattern === periodoPattern) {
    return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]/g, "");
  }
  if (field.pattern === nombrePattern) {
    return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, "");
  }
  return value;
}

async function request(path, credentials, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: authHeader(credentials),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(formatApiError(detail) || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function publicRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(formatApiError(detail) || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function publicAuthRequest(path, credentials, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: publicAuthHeader(credentials),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(formatApiError(detail) || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function PublicView() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [detailRoom, setDetailRoom] = useState(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [zoomedRoomImage, setZoomedRoomImage] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [pendingRoom, setPendingRoom] = useState(null);
  const [solicitud, setSolicitud] = useState(emptySolicitud);
  const [publicUser, setPublicUser] = useState(() => {
    const saved = localStorage.getItem("tesis_public_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [publicCredentials, setPublicCredentials] = useState(() => {
    const saved = localStorage.getItem("tesis_public_auth");
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState(null);
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [publicSolicitudes, setPublicSolicitudes] = useState([]);
  const [publicAccount, setPublicAccount] = useState(emptyPublicAccount);
  const [solicitudesLoading, setSolicitudesLoading] = useState(false);
  const [paymentForms, setPaymentForms] = useState({});
  const [paymentEditorOpen, setPaymentEditorOpen] = useState({});
  const [monthlyPaymentForms, setMonthlyPaymentForms] = useState({});
  const [monthlyPaymentEditorOpen, setMonthlyPaymentEditorOpen] = useState({});
  const [requestsView, setRequestsView] = useState("activas");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [publicSection, setPublicSection] = useState("home");
  const [selectedPublicFloor, setSelectedPublicFloor] = useState("todos");
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const modalHistoryActive = useRef(false);

  const visibleHabitaciones = useMemo(() => {
    return habitaciones
      .filter((habitacion) => selectedPublicFloor === "todos" || getRoomFloor(habitacion.codigo) === selectedPublicFloor)
      .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
  }, [habitaciones, selectedPublicFloor]);

  const publicFloorSummary = useMemo(() => {
    return publicFloorOptions.map(([value, label]) => ({
      value,
      label,
      count: value === "todos"
        ? habitaciones.length
        : habitaciones.filter((habitacion) => getRoomFloor(habitacion.codigo) === value).length,
    }));
  }, [habitaciones]);

  const publicAvailability = useMemo(() => {
    const prices = habitaciones.map((habitacion) => Number(habitacion.precio_mensual)).filter((price) => price > 0);
    const floors = new Set(habitaciones.map((habitacion) => getRoomFloor(habitacion.codigo)).filter((floor) => floor !== "otros"));
    return {
      total: habitaciones.length,
      minPrice: prices.length ? Math.min(...prices).toFixed(2) : "0.00",
      floors: floors.size,
    };
  }, [habitaciones]);

  const publicRoomGroups = useMemo(() => {
    const groups = visibleHabitaciones.reduce((acc, habitacion) => {
      const floor = getRoomFloor(habitacion.codigo);
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(habitacion);
      return acc;
    }, {});

    const order = ["2", "3", "4", "otros"];
    return order
      .filter((floor) => groups[floor]?.length)
      .map((floor) => {
        const rooms = groups[floor].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
        const prices = rooms.map((room) => Number(room.precio_mensual)).filter((price) => price > 0);
        const minPrice = prices.length ? Math.min(...prices) : null;
        return {
          floor,
          title: getFloorTitle(floor),
          range: getFloorRange(floor),
          description: getFloorDescription(floor),
          rooms,
          priceLabel: minPrice ? `Desde $${minPrice.toFixed(2)}` : "Precio por confirmar",
          image: roomImagesByFloor[floor]?.[0] || roomGalleryImages[0],
          reference: roomReferenceByFloor[floor] || "Foto referencial",
        };
      });
  }, [visibleHabitaciones]);

  const activeSolicitudes = useMemo(() => (
    publicSolicitudes.filter((item) => item.estado !== "RECHAZADA" && !item.formalizada)
  ), [publicSolicitudes]);

  const historialSolicitudes = useMemo(() => (
    publicSolicitudes.filter((item) => item.estado === "RECHAZADA" || item.formalizada)
  ), [publicSolicitudes]);

  const visibleSolicitudes = requestsView === "historial" ? historialSolicitudes : activeSolicitudes;

  const publicArriendos = publicAccount?.arriendos || [];
  const publicPagos = publicAccount?.pagos || [];

  const pendingMonthlyPayments = useMemo(() => (
    publicPagos.filter((item) => item.estado !== "PAGADO")
  ), [publicPagos]);

  const orderedPublicPagos = useMemo(() => {
    return [...publicPagos].sort((a, b) => {
      if (a.estado === "PAGADO" && b.estado !== "PAGADO") return 1;
      if (a.estado !== "PAGADO" && b.estado === "PAGADO") return -1;
      return String(a.fecha_vencimiento || "").localeCompare(String(b.fecha_vencimiento || ""));
    });
  }, [publicPagos]);

  const nextMonthlyPayment = useMemo(() => (
    orderedPublicPagos.find((item) => item.estado !== "PAGADO") || null
  ), [orderedPublicPagos]);

  const paidMonthlyPaymentsCount = useMemo(() => (
    publicPagos.filter((item) => item.estado === "PAGADO").length
  ), [publicPagos]);

  const publicNextPayment = useMemo(() => (
    nextPaymentReminder(publicArriendos, publicPagos)
  ), [publicArriendos, publicPagos]);

  const currentClientRental = publicArriendos[0] || null;

  const pendingPaymentCount = useMemo(() => {
    const pendingSolicitudes = activeSolicitudes.filter((item) => (
      item.estado === "APROBADA" && item.estado_pago !== "CONFIRMADO"
    )).length;
    return pendingSolicitudes + pendingMonthlyPayments.length;
  }, [activeSolicitudes, pendingMonthlyPayments]);

  function closeHeaderMenus() {
    setAccountMenuOpen(false);
    setSiteMenuOpen(false);
  }

  async function loadPublicRooms() {
    setLoading(true);
    setError("");
    try {
      const data = await publicRequest("/public/habitaciones-disponibles/");
      setHabitaciones(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError("No se pudo cargar habitaciones disponibles. Verifica que el backend esté encendido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPublicRooms();
  }, []);

  useEffect(() => {
    if (publicUser && publicCredentials) {
      loadMyRequests({ silent: true });
      return;
    }
    setPublicSolicitudes([]);
    setPublicAccount(emptyPublicAccount);
    setPaymentForms({});
    setPaymentEditorOpen({});
    setMonthlyPaymentForms({});
    setMonthlyPaymentEditorOpen({});
  }, [publicUser?.id, publicCredentials?.correo]);

  useEffect(() => {
    function closeModalFromNavigation() {
      if (modalHistoryActive.current) {
        modalHistoryActive.current = false;
        setSelectedRoom(null);
      }
    }

    function closeModalFromKeyboard(event) {
      if (event.key === "Escape" && zoomedRoomImage) {
        event.preventDefault();
        setZoomedRoomImage(null);
        return;
      }
      if (event.key === "Escape" && detailRoom) {
        event.preventDefault();
        closeRoomDetail();
      }
      if (event.key === "Escape" && modalHistoryActive.current) {
        event.preventDefault();
        closeSolicitudModal();
      }
    }

    window.addEventListener("popstate", closeModalFromNavigation);
    window.addEventListener("keydown", closeModalFromKeyboard);

    return () => {
      window.removeEventListener("popstate", closeModalFromNavigation);
      window.removeEventListener("keydown", closeModalFromKeyboard);
    };
  }, [detailRoom, zoomedRoomImage]);

  function openRoomDetail(habitacion) {
    setDetailRoom(habitacion);
    setDetailImageIndex(0);
    setZoomedRoomImage(null);
    closeHeaderMenus();
    setError("");
  }

  function closeRoomDetail() {
    setDetailRoom(null);
    setDetailImageIndex(0);
    setZoomedRoomImage(null);
  }

  function requestFromDetail(habitacion) {
    closeRoomDetail();
    openSolicitud(habitacion);
  }

  function openGuide() {
    setPublicSection("guide");
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeHeaderMenus();
  }

  async function openMyRequests() {
    if (!publicUser || !publicCredentials) {
      openAuth("login");
      return;
    }
    setPublicSection("requests");
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeHeaderMenus();
    await loadMyRequests();
  }

  async function loadMyRequests(options = {}) {
    if (!publicCredentials) return;
    const silent = Boolean(options.silent);
    if (!silent) setSolicitudesLoading(true);
    setError("");
    try {
      const [data, accountData] = await Promise.all([
        publicAuthRequest("/public/solicitudes/", publicCredentials),
        publicAuthRequest("/public/solicitudes/mi-cuenta/", publicCredentials),
      ]);
      const items = Array.isArray(data) ? data : data.results || [];
      const account = accountData || emptyPublicAccount;
      setPublicSolicitudes(items);
      setPublicAccount(account);
      setPaymentForms((current) => {
        const next = { ...current };
        items.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = {
              metodo_pago: item.metodo_pago && item.metodo_pago !== "SIN_SELECCIONAR" ? item.metodo_pago : "SITIO",
              referencia_pago: item.referencia_pago || "",
              comprobante_pago: null,
              comprobante_preview: "",
              comprobante_name: "",
              observaciones_pago: item.observaciones_pago || "",
            };
          }
        });
        return next;
      });
      setMonthlyPaymentForms((current) => {
        const next = { ...current };
        (account.pagos || []).forEach((pago) => {
          if (!next[pago.id]) {
            next[pago.id] = {
              metodo_pago: pago.metodo_pago || "Transferencia",
              referencia_pago: pago.referencia_pago || "",
              comprobante_pago: null,
              comprobante_preview: "",
              comprobante_name: "",
              observaciones_cliente: pago.observaciones_cliente || "",
            };
          }
        });
        return next;
      });
    } catch (err) {
      if (!silent) setError(`No se pudieron cargar tus solicitudes. ${err.message}`);
    } finally {
      if (!silent) setSolicitudesLoading(false);
    }
  }

  function updatePaymentForm(id, field, value) {
    setPaymentForms((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {
          metodo_pago: "SITIO",
          referencia_pago: "",
          comprobante_pago: null,
          comprobante_preview: "",
          comprobante_name: "",
          observaciones_pago: "",
        }),
        [field]: value,
      },
    }));
  }

  function updatePaymentProof(id, file) {
    if (!file) {
      updatePaymentForm(id, "comprobante_pago", null);
      updatePaymentForm(id, "comprobante_preview", "");
      updatePaymentForm(id, "comprobante_name", "");
      return;
    }
    if (!paymentProofTypes.includes(file.type)) {
      setError("El comprobante debe ser una imagen JPG, PNG, WEBP o un PDF.");
      return;
    }
    if (file.size > paymentProofMaxSize) {
      setError("El comprobante no debe superar 5 MB.");
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setError("");
    setPaymentForms((current) => {
      const previous = current[id]?.comprobante_preview;
      if (previous) URL.revokeObjectURL(previous);
      return {
        ...current,
        [id]: {
          ...(current[id] || {
            metodo_pago: "SITIO",
            referencia_pago: "",
            observaciones_pago: "",
          }),
          comprobante_pago: file,
          comprobante_preview: previewUrl,
          comprobante_name: file.name,
        },
      };
    });
  }

  function updateMonthlyPaymentForm(id, field, value) {
    setMonthlyPaymentForms((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {
          metodo_pago: "Transferencia",
          referencia_pago: "",
          comprobante_pago: null,
          comprobante_preview: "",
          comprobante_name: "",
          observaciones_cliente: "",
        }),
        [field]: value,
      },
    }));
  }

  function updateMonthlyPaymentProof(id, file) {
    if (!file) {
      updateMonthlyPaymentForm(id, "comprobante_pago", null);
      updateMonthlyPaymentForm(id, "comprobante_preview", "");
      updateMonthlyPaymentForm(id, "comprobante_name", "");
      return;
    }
    if (!paymentProofTypes.includes(file.type)) {
      setError("El comprobante mensual debe ser una imagen JPG, PNG, WEBP o un PDF.");
      return;
    }
    if (file.size > paymentProofMaxSize) {
      setError("El comprobante mensual no debe superar 5 MB.");
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setError("");
    setMonthlyPaymentForms((current) => {
      const previous = current[id]?.comprobante_preview;
      if (previous) URL.revokeObjectURL(previous);
      return {
        ...current,
        [id]: {
          ...(current[id] || {
            metodo_pago: "Transferencia",
            referencia_pago: "",
            observaciones_cliente: "",
          }),
          comprobante_pago: file,
          comprobante_preview: previewUrl,
          comprobante_name: file.name,
        },
      };
    });
  }

  async function sendMonthlyPaymentProof(pagoId) {
    if (!publicCredentials) return;
    const form = monthlyPaymentForms[pagoId] || { metodo_pago: "Transferencia" };
    const pago = publicPagos.find((item) => Number(item.id) === Number(pagoId));
    if (
      form.metodo_pago === "Transferencia"
      && !form.referencia_pago
      && !form.comprobante_pago
      && !pago?.comprobante_pago
    ) {
      setError("Para transferencia ingresa una referencia o sube el comprobante mensual.");
      return;
    }

    const payload = new FormData();
    payload.append("metodo_pago", form.metodo_pago || "Transferencia");
    payload.append("referencia_pago", form.referencia_pago || "");
    payload.append("observaciones_cliente", form.observaciones_cliente || "");
    if (form.comprobante_pago) {
      payload.append("comprobante_pago", form.comprobante_pago);
    }

    setError("");
    setMessage("");
    try {
      await publicAuthRequest(`/public/solicitudes/pagos/${pagoId}/comprobante/`, publicCredentials, {
        method: "POST",
        body: payload,
      });
      setMessage("Comprobante mensual enviado. Administración revisará y confirmará el pago.");
      setMonthlyPaymentEditorOpen((current) => ({ ...current, [pagoId]: false }));
      await loadMyRequests();
    } catch (err) {
      setError(`No se pudo enviar el comprobante mensual. ${err.message}`);
    }
  }

  async function choosePaymentMethod(solicitudId) {
    if (!publicCredentials) return;
    const form = paymentForms[solicitudId] || { metodo_pago: "SITIO" };
    const solicitud = publicSolicitudes.find((item) => item.id === solicitudId);
    if (
      form.metodo_pago === "TRANSFERENCIA"
      && !form.referencia_pago
      && !form.comprobante_pago
      && !solicitud?.comprobante_pago
    ) {
      setError("Para transferencia ingresa una referencia o sube el comprobante.");
      return;
    }
    const payload = new FormData();
    payload.append("metodo_pago", form.metodo_pago || "SITIO");
    payload.append("referencia_pago", form.referencia_pago || "");
    payload.append("observaciones_pago", form.observaciones_pago || "");
    if (form.comprobante_pago) {
      payload.append("comprobante_pago", form.comprobante_pago);
    }
    setError("");
    setMessage("");
    try {
      await publicAuthRequest(`/public/solicitudes/${solicitudId}/elegir_pago/`, publicCredentials, {
        method: "POST",
        body: payload,
      });
      setMessage("Forma de pago registrada. Administración confirmará el pago.");
      setPaymentEditorOpen((current) => ({ ...current, [solicitudId]: false }));
      await loadMyRequests();
    } catch (err) {
      setError(`No se pudo registrar la forma de pago. ${err.message}`);
    }
  }

  function scrollToRooms() {
    setPublicSection("rooms");
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeHeaderMenus();
  }

  function scrollToCanton() {
    setPublicSection("canton");
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeHeaderMenus();
  }

  function scrollToLocation() {
    setPublicSection("location");
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeHeaderMenus();
  }

  function openContact() {
    setPublicSection("contact");
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeHeaderMenus();
  }

  function goHome() {
    setPublicSection("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeHeaderMenus();
  }

  function openAdminPanel() {
    closeHeaderMenus();
    window.location.hash = "admin";
  }

  function renderLocationSection() {
    return (
      <section className="public-location-card" id="ubicacion-referencias" aria-label="Ubicación y referencias">
        <div className="location-copy">
          <p className="eyebrow">Ubicación referencial</p>
          <h2>Estamos en La Joya de los Sachas</h2>
          <p>
            Referencia principal: Centro de Especialidades Médicas y Odontológicas
            Capelo Ríos, en Av. Jaime Roldós y Monseñor Alejandro Labaka. Los
            cuartos de arrendamiento se encuentran en la parte posterior.
          </p>
          <div className="location-reference-grid">
            <span>
              <b>Dirección</b>
              Av. Jaime Roldós y Monseñor Alejandro Labaka
            </span>
            <span>
              <b>Referencia</b>
              Centro de Especialidades Médicas y Odontológicas Capelo Ríos
            </span>
            <span>
              <b>Ciudad</b>
              La Joya de los Sachas, Orellana
            </span>
          </div>
        </div>
        <div className="location-map-preview">
          <iframe
            title="Ubicación referencial en Google Maps"
            src="https://www.google.com/maps?q=Centro%20de%20Especialidades%20M%C3%A9dicas%20y%20Odontol%C3%B3gicas%20Capelo%20Rios%2C%20Av.%20Jaime%20Roldos%20%26%20Monse%C3%B1or%20Alejandro%20Labaka%2C%20La%20Joya%20de%20los%20Sachas&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href="https://www.google.com/maps/search/?api=1&query=Centro%20de%20Especialidades%20M%C3%A9dicas%20y%20Odontol%C3%B3gicas%20Capelo%20Rios%2C%20Av.%20Jaime%20Roldos%20%26%20Monse%C3%B1or%20Alejandro%20Labaka%2C%20La%20Joya%20de%20los%20Sachas"
            target="_blank"
            rel="noreferrer"
          >
            Abrir ubicación en Google Maps
          </a>
        </div>
      </section>
    );
  }

  function renderContactSection() {
    return (
      <section className="contact-page">
        <div className="contact-intro">
          <span>Inicio / Contacto</span>
          <p className="eyebrow">Estamos aquí</p>
          <h2>Contáctanos</h2>
          <p>
            Escríbenos para consultar disponibilidad, coordinar una visita o resolver
            dudas antes de enviar una solicitud de habitación.
          </p>
        </div>

        <div className="contact-layout">
          <div className="contact-info-list" aria-label="Datos de contacto">
            <article>
              <strong>Ubicación referencial</strong>
              <p>Centro de Especialidades Médicas y Odontológicas Capelo Ríos.</p>
              <button type="button" onClick={scrollToLocation}>Ver ubicación en el mapa</button>
            </article>
            <article>
              <strong>Dirección</strong>
              <p>Av. Jaime Roldós y Monseñor Alejandro Labaka, La Joya de los Sachas.</p>
            </article>
            <article>
              <strong>Atención</strong>
              <p>Las solicitudes y consultas son revisadas por administración según disponibilidad.</p>
            </article>
            <article>
              <strong>Recomendación</strong>
              <p>Indica la habitación que te interesa y el motivo de arriendo para responder mejor.</p>
            </article>
          </div>

          <form className="contact-form-card" onSubmit={handleContactSubmit}>
            <h3>Envíanos un mensaje</h3>
            <div className="contact-form-grid">
              <label>
                Nombres
                <input
                  required
                  pattern={nombrePattern}
                  placeholder="Ej. Diego Ríos"
                  value={contactForm.nombres}
                  onChange={(event) => setContactForm({ ...contactForm, nombres: event.target.value })}
                />
              </label>
              <label>
                Teléfono
                <input
                  required
                  inputMode="numeric"
                  pattern={telefonoPattern}
                  placeholder="Ej. 0981856802"
                  value={contactForm.telefono}
                  onChange={(event) => setContactForm({ ...contactForm, telefono: onlyDigits(event.target.value).slice(0, 10) })}
                />
              </label>
            </div>
            <label>
              Correo electrónico
              <input
                required
                type="email"
                placeholder="tu@correo.com"
                value={contactForm.correo}
                onChange={(event) => setContactForm({ ...contactForm, correo: event.target.value })}
              />
            </label>
            <label>
              Asunto
              <select
                value={contactForm.asunto}
                onChange={(event) => setContactForm({ ...contactForm, asunto: event.target.value })}
              >
                <option>Consulta de habitación</option>
                <option>Coordinar visita</option>
                <option>Información de pagos</option>
                <option>Otra consulta</option>
              </select>
            </label>
            <label>
              Mensaje
              <textarea
                required
                minLength="10"
                placeholder="Cuéntanos qué habitación te interesa, cuándo deseas visitar o qué información necesitas."
                value={contactForm.mensaje}
                onChange={(event) => setContactForm({ ...contactForm, mensaje: event.target.value })}
              />
            </label>
            <button className="primary-button" type="submit">Enviar mensaje</button>
            <small>Para reservar una habitación, revisa disponibilidad y envía la solicitud desde el catálogo.</small>
          </form>
        </div>
      </section>
    );
  }

  function renderPublicFooter() {
    return (
      <footer className="public-footer">
        <div className="footer-grid">
          <section className="footer-brand-block">
            <div className="footer-brand">
              <span>AT</span>
              <div>
                <strong>Habitaciones amobladas</strong>
                <small>La Joya de los Sachas</small>
              </div>
            </div>
            <p>
              Espacios amoblados para personas que buscan una habitación cómoda,
              clara en precio y fácil de solicitar en línea.
            </p>
            <div className="footer-contact-lines">
              <span>La Joya de los Sachas, Ecuador</span>
              <span>Atención mediante solicitud en línea</span>
              <span>Respuesta según disponibilidad</span>
            </div>
          </section>

          <section>
            <h3>Explorar</h3>
            <button type="button" onClick={goHome}>Inicio</button>
            <button type="button" onClick={scrollToRooms}>Habitaciones</button>
            <button type="button" onClick={scrollToCanton}>Sobre La Joya de los Sachas</button>
            <button type="button" onClick={openGuide}>Cómo funciona</button>
            <button type="button" onClick={openContact}>Contacto</button>
          </section>

          <section>
            <h3>Solicitar</h3>
            <button type="button" onClick={scrollToRooms}>Ver disponibilidad</button>
            {publicUser && <button type="button" onClick={openMyRequests}>Mi arriendo y pagos</button>}
            {!publicUser && <button type="button" onClick={() => openAuth("login")}>Iniciar sesión</button>}
            {!publicUser && <button type="button" onClick={() => openAuth("register")}>Crear cuenta</button>}
            {publicUser && <button type="button" onClick={handlePublicLogout}>Cerrar sesión</button>}
          </section>

          <section>
            <h3>Información</h3>
            <p>Habitaciones con servicios incluidos según registro.</p>
            <p>La solicitud será revisada por administración.</p>
            <button type="button" onClick={scrollToLocation}>Ubicación</button>
            <p>Los precios y disponibilidad pueden cambiar.</p>
          </section>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Habitaciones amobladas AT</span>
          <span>Sistema de gestión de arriendos</span>
        </div>
      </footer>
    );
  }

  function renderRoomsCatalog() {
    return (
      <section className="reservation-page">
        <div className="property-info-card">
          <div className="property-gallery">
            <img src="/rooms/406/principal.jpeg" alt="Habitación amoblada con cama y armario" />
            <img src="/rooms/407/principal.jpeg.jpeg" alt="Habitación amoblada con baño privado" />
            <img src="/rooms/406/406.jpeg" alt="Ambiente interior de habitación amoblada" />
          </div>
          <div className="property-copy">
            <p className="eyebrow">Información de la propiedad</p>
            <h2>Habitaciones amobladas AT</h2>
            <p>
              Espacios pensados para estadías mensuales en La Joya de los Sachas,
              con habitaciones equipadas, servicios incluidos y revisión de solicitudes
              por administración.
            </p>
          </div>
          <div className="property-service-grid" aria-label="Servicios de la propiedad">
            {[
              "Habitaciones amobladas",
              "Baño privado según habitación",
              "Internet incluido",
              "Agua y luz",
              "Aire acondicionado según habitación",
              "Solicitud en línea",
              "Confirmación administrativa",
              "Opciones de pago",
            ].map((service) => (
              <span key={service}>{service}</span>
            ))}
          </div>
          <div className="property-rules-grid" aria-label="Reglas del negocio">
            <article>
              <strong>Dirección y referencia</strong>
              <p>Av. Jaime Roldós y Monseñor Alejandro Labaka, detrás del Centro de Especialidades Médicas y Odontológicas Capelo Ríos.</p>
            </article>
            <article>
              <strong>Proceso de reserva</strong>
              <p>El cliente revisa la habitación, envía la solicitud y administración confirma disponibilidad antes de formalizar el arriendo.</p>
            </article>
            <article>
              <strong>Pago mensual</strong>
              <p>El pago se controla por mes. La fecha límite se genera según el inicio del arriendo registrado.</p>
            </article>
          </div>
        </div>

        <div className="available-section" id="habitaciones-disponibles">
          <div className="section-title">
            <div>
              <h2>Habitaciones disponibles</h2>
              <p>
                {loading
                  ? "Cargando..."
                  : `${visibleHabitaciones.length} de ${habitaciones.length} opciones para solicitar`}
              </p>
            </div>
            <button className="secondary-button" type="button" onClick={loadPublicRooms}>
              Actualizar
            </button>
          </div>

          <div className="catalog-toolbar" aria-label="Filtro de habitaciones por piso">
            {publicFloorSummary.map((option) => (
              <button
                className={selectedPublicFloor === option.value ? "active" : ""}
                key={option.value}
                type="button"
                onClick={() => setSelectedPublicFloor(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.count}</span>
              </button>
            ))}
          </div>

          <div className="floor-catalog-list">
            {publicRoomGroups.map((group) => (
              <section className="floor-catalog-section" key={group.floor}>
                <div className="floor-catalog-hero">
                  <div className="floor-catalog-photo">
                    <img src={group.image} alt={`${group.title} habitaciones amobladas`} />
                    <span>{group.reference}</span>
                  </div>
                  <div className="floor-catalog-info">
                    <small>{group.range}</small>
                    <h3>{group.title}</h3>
                    <p>{group.description}</p>
                    <div className="floor-catalog-metrics" aria-label={`Resumen de ${group.title}`}>
                      <span>
                        <strong>{group.rooms.length}</strong>
                        Disponibles
                      </span>
                      <span>
                        <strong>{group.priceLabel}</strong>
                        Mensual
                      </span>
                      <span>
                        <strong>3</strong>
                        Servicios clave
                      </span>
                    </div>
                  </div>
                </div>

                <div className="compact-room-grid">
                  {group.rooms.map((habitacion) => (
                    <article className="compact-room-tile" key={habitacion.id}>
                      <div className="compact-room-top">
                        <strong>Habitación {habitacion.codigo}</strong>
                        <span className="status disponible">Disponible</span>
                      </div>
                      <div className="catalog-tags" aria-label={`Servicios de habitación ${habitacion.codigo}`}>
                        {getRoomFeatureTags(habitacion).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      <div className="compact-room-bottom">
                        <strong>${habitacion.precio_mensual} / mes</strong>
                        <div className="public-room-actions">
                          <button className="ghost-button" type="button" onClick={() => openRoomDetail(habitacion)}>
                            Ver
                          </button>
                          <button className="primary-button" type="button" onClick={() => openSolicitud(habitacion)}>
                            Solicitar
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {!loading && visibleHabitaciones.length === 0 && (
              <div className="empty-state">
                No hay habitaciones disponibles en este filtro.
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  function handleContactSubmit(event) {
    event.preventDefault();
    setMessage("Mensaje preparado. Administración podrá responder por teléfono o correo.");
    setError("");
    setContactForm(emptyContactForm);
  }

  function openSolicitud(habitacion) {
    if (!publicUser) {
      setPendingRoom(habitacion);
      openAuth("login");
      return;
    }
    beginSolicitud(habitacion, publicUser);
  }

  function beginSolicitud(habitacion, user) {
    if (!modalHistoryActive.current) {
      window.history.pushState({ modal: "solicitud" }, "");
      modalHistoryActive.current = true;
    }
    setSelectedRoom(habitacion);
    setSolicitud({
      ...emptySolicitud,
      nombres: `${user.nombres || ""} ${user.apellidos || ""}`.trim(),
      telefono: user.telefono || "",
      correo: user.correo || "",
    });
    setMessage("");
    setError("");
  }

  function closeSolicitudModal() {
    if (modalHistoryActive.current) {
      modalHistoryActive.current = false;
      window.history.back();
    }
    setSelectedRoom(null);
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthForm((current) => ({
      ...emptyAuthForm,
      correo: current.correo || "",
      telefono: current.telefono || "",
    }));
    closeHeaderMenus();
    setError("");
    setMessage("");
  }

  function closeAuth() {
    setAuthMode(null);
    setPendingRoom(null);
    setAuthForm(emptyAuthForm);
  }

  function updateAuthField(field, value) {
    const cleanValue = sanitizeInputValue(
      field === "telefono"
        ? { inputMode: "numeric" }
        : field === "nombres" || field === "apellidos"
          ? { pattern: nombrePattern }
          : {},
      value
    );
    setAuthForm((current) => ({ ...current, [field]: cleanValue }));
  }

  function savePublicSession(user, credentials) {
    setPublicUser(user);
    setPublicCredentials(credentials);
    localStorage.setItem("tesis_public_user", JSON.stringify(user));
    localStorage.setItem("tesis_public_auth", JSON.stringify(credentials));
  }

  function handlePublicLogout() {
    setPublicUser(null);
    setPublicCredentials(null);
    setPublicAccount(emptyPublicAccount);
    setMonthlyPaymentForms({});
    setMonthlyPaymentEditorOpen({});
    closeHeaderMenus();
    localStorage.removeItem("tesis_public_user");
    localStorage.removeItem("tesis_public_auth");
    setMessage("Sesión cerrada. Te esperamos pronto.");
  }

  async function submitAuth(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const endpoint = authMode === "register" ? "/public/registro/" : "/public/login/";
      const payload = authMode === "register"
        ? {
            nombres: authForm.nombres,
            apellidos: authForm.apellidos,
            correo: authForm.correo,
            telefono: authForm.telefono,
            password: authForm.password,
          }
        : {
            correo: authForm.correo,
            password: authForm.password,
          };
      const user = await publicRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const credentials = { correo: authForm.correo, password: authForm.password };
      savePublicSession(user, credentials);
      setAuthMode(null);
      setAuthForm(emptyAuthForm);
      if (authMode === "register") {
        setMessage("Cuenta creada. Ya puedes solicitar una habitación.");
      } else {
        setMessage("Sesión iniciada. Ya puedes solicitar una habitación.");
      }
      if (pendingRoom) {
        const room = pendingRoom;
        setPendingRoom(null);
        beginSolicitud(room, user);
      }
    } catch (err) {
      setError(`No se pudo completar el acceso. ${err.message}`);
    }
  }

  async function sendSolicitud(event) {
    event.preventDefault();
    if (!selectedRoom) return;

    setError("");
    setMessage("");
    try {
      const requester = publicCredentials ? publicAuthRequest : publicRequest;
      const requestArgs = [
        "/public/solicitudes/",
        ...(publicCredentials ? [publicCredentials] : []),
        {
          method: "POST",
          body: JSON.stringify({
            habitacion: selectedRoom.id,
            nombres: solicitud.nombres,
            telefono: solicitud.telefono,
            correo: solicitud.correo,
            mensaje: solicitud.mensaje,
          }),
        },
      ];
      await requester(...requestArgs);
      setMessage("Solicitud enviada. El administrador revisará tu información.");
      closeSolicitudModal();
      setSolicitud(emptySolicitud);
    } catch (err) {
      setError(`No se pudo enviar la solicitud. ${err.message}`);
    }
  }

  return (
    <main className="public-page">
      <header className="public-header">
        <button className="public-brand public-brand-button" type="button" onClick={goHome}>
          <span>AT</span>
          <div>
            <strong>Habitaciones amobladas</strong>
            <small>La Joya de los Sachas</small>
          </div>
        </button>
        <nav className="public-nav" aria-label="Navegación principal">
          <button className={publicSection === "rooms" ? "active" : ""} type="button" onClick={scrollToRooms}>
            Habitaciones
          </button>
          <button className={publicSection === "canton" ? "active" : ""} type="button" onClick={scrollToCanton}>
            Sobre La Joya de los Sachas
          </button>
          <button className={publicSection === "guide" ? "active" : ""} type="button" onClick={openGuide}>
            Cómo funciona
          </button>
          <button className={publicSection === "location" ? "active" : ""} type="button" onClick={scrollToLocation}>
            Ubicación
          </button>
          <button className={publicSection === "contact" ? "active" : ""} type="button" onClick={openContact}>
            Contacto
          </button>
        </nav>
        <div className="public-actions">
          {publicUser && pendingPaymentCount > 0 && (
            <button className="payment-alert-button" type="button" onClick={openMyRequests}>
              <span aria-hidden="true" />
              Pagos
              <b>{pendingPaymentCount}</b>
            </button>
          )}
          <div className="user-menu">
            {publicUser ? (
              <button
                aria-expanded={accountMenuOpen}
                className="login-entry"
                type="button"
                onClick={() => {
                  setAccountMenuOpen((current) => !current);
                  setSiteMenuOpen(false);
                }}
              >
                Mi cuenta
              </button>
            ) : (
              <button className="login-entry" type="button" onClick={() => openAuth("login")}>
                Iniciar sesión
              </button>
            )}
            {accountMenuOpen && publicUser && (
              <div className="user-menu-dropdown account-dropdown">
                <div className="user-menu-greeting">
                  <strong>{publicUser.nombres} {publicUser.apellidos}</strong>
                  <small>{publicUser.correo}</small>
                  {publicUser.telefono && <small>Teléfono: {publicUser.telefono}</small>}
                </div>
                <button type="button" onClick={openMyRequests}>Mi arriendo y pagos</button>
                <button type="button" onClick={handlePublicLogout}>Cerrar sesión</button>
              </div>
            )}
          </div>

          <div className="user-menu">
            <button
              aria-expanded={siteMenuOpen}
              className="user-menu-button"
              type="button"
              onClick={() => {
                setSiteMenuOpen((current) => !current);
                setAccountMenuOpen(false);
              }}
            >
              <span>Menú</span>
            </button>
            {siteMenuOpen && (
              <div className="user-menu-dropdown">
                <button type="button" onClick={scrollToRooms}>Ver habitaciones</button>
                {publicUser && <button type="button" onClick={openMyRequests}>Mi arriendo y pagos</button>}
                <button type="button" onClick={scrollToCanton}>Sobre La Joya de los Sachas</button>
                <button type="button" onClick={openGuide}>Cómo funciona</button>
                <button type="button" onClick={scrollToLocation}>Ubicación</button>
                <button type="button" onClick={openContact}>Contacto</button>
                {!publicUser && <button type="button" onClick={() => openAuth("register")}>Crear cuenta</button>}
                <button type="button" onClick={goHome}>Inicio</button>
                <button className="admin-menu-link" type="button" onClick={openAdminPanel}>Panel administrativo</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {(message || error) && (
        <div className={`alert public-toast ${error ? "error" : "success"}`} role="status">
          <span className="toast-icon" aria-hidden="true" />
          <div>
            <strong>{error ? "Revisa la información" : "Listo"}</strong>
            <span>{error || message}</span>
          </div>
        </div>
      )}

      {publicSection === "guide" ? (
        <section className="guide-page">
          <div className="guide-page-header">
            <p className="eyebrow">Guía de uso</p>
            <h2>Cómo funciona la solicitud de habitación</h2>
            <p>
              Esta sección explica el proceso completo para revisar habitaciones, enviar una solicitud
              y esperar la respuesta del administrador.
            </p>
          </div>
          <div className="guide-steps guide-page-steps">
            <article>
              <span>1</span>
              <div>
                <strong>Revisa las habitaciones disponibles</strong>
                <p>Consulta las opciones publicadas, revisa fotos, precio mensual y servicios incluidos.</p>
              </div>
            </article>
            <article>
              <span>2</span>
              <div>
                <strong>Abre el detalle</strong>
                <p>Usa el botón Ver habitación para observar la galería, descripción y observaciones del espacio.</p>
              </div>
            </article>
            <article>
              <span>3</span>
              <div>
                <strong>Inicia sesión o crea tu cuenta</strong>
                <p>Esto permite completar tus datos de contacto y mantener registrada tu solicitud.</p>
              </div>
            </article>
            <article>
              <span>4</span>
              <div>
                <strong>Envía la solicitud</strong>
                <p>Selecciona la habitación que te interesa y envía tu información al administrador.</p>
              </div>
            </article>
            <article>
              <span>5</span>
              <div>
                <strong>Espera la revisión</strong>
                <p>El administrador revisa disponibilidad, aprueba o rechaza la solicitud y actualiza el estado.</p>
              </div>
            </article>
            <article>
              <span>6</span>
              <div>
                <strong>Continúa el proceso</strong>
                <p>Si la solicitud es aprobada, se registran los datos necesarios para el arriendo.</p>
              </div>
            </article>
          </div>
          <div className="guide-page-actions">
            <button className="primary-button" type="button" onClick={scrollToRooms}>
              Ver habitaciones
            </button>
            {!publicUser && (
              <button className="ghost-button" type="button" onClick={() => openAuth("login")}>
                Iniciar sesión
              </button>
            )}
          </div>
        </section>
      ) : publicSection === "requests" ? (
        <section className="requests-page">
          <div className="requests-header">
            <div>
              <p className="eyebrow">Área del cliente</p>
              <h2>{publicArriendos.length ? "Mi arriendo y pagos" : "Mis solicitudes"}</h2>
              <p>Consulta tus solicitudes activas y los pagos mensuales generados por administración.</p>
            </div>
            <button className="secondary-button" type="button" onClick={loadMyRequests}>
              Actualizar
            </button>
          </div>

          <div className="requests-tabs" aria-label="Filtro de solicitudes">
            <button
              className={requestsView === "activas" ? "active" : ""}
              type="button"
              onClick={() => setRequestsView("activas")}
            >
              Activas
              <span>{activeSolicitudes.length}</span>
            </button>
            <button
              className={requestsView === "historial" ? "active" : ""}
              type="button"
              onClick={() => setRequestsView("historial")}
            >
              Historial
              <span>{historialSolicitudes.length}</span>
            </button>
          </div>

          {publicArriendos.length > 0 && (
            <section className="client-account-panel" aria-label="Arriendo y pagos mensuales">
              <div className="client-account-hero">
                <div>
                  <p className="eyebrow">Cuenta del arrendatario</p>
                  <h3>Panel del cliente</h3>
                  <p>Consulta tu habitación actual, el próximo pago mensual y el historial de comprobantes.</p>
                </div>
                <div className="client-hero-stats" aria-label="Resumen de pagos">
                  <span>
                    <b>{pendingMonthlyPayments.length}</b>
                    Pendientes
                  </span>
                  <span>
                    <b>{paidMonthlyPaymentsCount}</b>
                    Pagados
                  </span>
                </div>
              </div>

              <div className="client-dashboard-grid">
                <article className="client-overview-card current-room">
                  <small>Mi habitación actual</small>
                  <div className="client-room-main">
                    <strong>{currentClientRental?.habitacion_codigo || "Sin habitación activa"}</strong>
                    <span className="client-payment-badge">
                      {currentClientRental ? estadoLabels[currentClientRental.estado] || currentClientRental.estado : "Sin arriendo"}
                    </span>
                  </div>
                  {currentClientRental ? (
                    <>
                      <p>Arriendo vigente desde {formatDate(currentClientRental.fecha_inicio)}.</p>
                      <div className="client-overview-meta">
                        <span><b>Valor mensual</b>${currentClientRental.valor_mensual}</span>
                        <span><b>Habitación</b>{currentClientRental.habitacion_codigo}</span>
                        <span><b>Estado</b>{estadoLabels[currentClientRental.estado] || currentClientRental.estado}</span>
                      </div>
                    </>
                  ) : (
                    <p>Cuando administración formalice tu solicitud, aquí aparecerá la habitación asignada.</p>
                  )}
                </article>

                <article className={`client-overview-card next-payment-card ${publicNextPayment ? `reminder-${publicNextPayment.type}` : ""}`}>
                  <small>Próximo pago</small>
                  {publicNextPayment ? (
                    <>
                      <div className="client-room-main">
                        <strong>{publicNextPayment.period}</strong>
                        <span className={`client-payment-badge ${publicNextPayment.type === "late" || publicNextPayment.type === "soon" || publicNextPayment.type === "pending" ? "warning" : ""}`}>
                          {publicNextPayment.title}
                        </span>
                      </div>
                      <p>{publicNextPayment.detail}</p>
                      <div className="client-overview-meta">
                        <span><b>Fecha límite</b>{formatDate(publicNextPayment.dueDate)}</span>
                        <span><b>Monto</b>${publicNextPayment.amount}</span>
                        <span><b>Habitación</b>{publicNextPayment.room}</span>
                      </div>
                      {nextMonthlyPayment && (
                        <button
                          className="primary-button client-next-action"
                          type="button"
                          onClick={() => setMonthlyPaymentEditorOpen((current) => ({ ...current, [nextMonthlyPayment.id]: true }))}
                        >
                          Enviar comprobante
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="client-room-main">
                        <strong>Sin cobros pendientes</strong>
                        <span className="client-payment-badge">Al día</span>
                      </div>
                      <p>Cuando se genere el siguiente mes, aparecerá aquí la fecha límite y el monto.</p>
                    </>
                  )}
                </article>

                <article className="client-overview-card account-status">
                  <small>Estado general</small>
                  <div className="client-room-main">
                    <strong>{pendingMonthlyPayments.length > 0 ? "Revisar pagos" : "Todo al día"}</strong>
                    {pendingMonthlyPayments.length > 0 ? (
                      <span className="client-payment-badge warning">{pendingMonthlyPayments.length} por pagar</span>
                    ) : (
                      <span className="client-payment-badge">Al día</span>
                    )}
                  </div>
                  <p>
                    {pendingMonthlyPayments.length > 0
                      ? "Sube el comprobante del pago mensual para que administración lo confirme."
                      : "Tus pagos registrados aparecen en el historial mensual."}
                  </p>
                  <div className="client-overview-meta compact">
                    <span><b>Arriendos</b>{publicArriendos.length}</span>
                    <span><b>Pagos</b>{publicPagos.length}</span>
                  </div>
                </article>
              </div>

              {publicArriendos.length > 1 && (
                <div className="client-lease-strip" aria-label="Otros arriendos activos">
                  {publicArriendos.slice(1).map((arriendo) => (
                    <span key={arriendo.id}>
                      {arriendo.habitacion_codigo} · {estadoLabels[arriendo.estado] || arriendo.estado} · ${arriendo.valor_mensual} / mes
                    </span>
                  ))}
                </div>
              )}

              {pendingMonthlyPayments.length > 0 && (
                <div className="monthly-notice">
                  <strong>Pago mensual pendiente</strong>
                  <span>
                    Cancela antes de la fecha límite y sube el comprobante. Administración confirmará el pago en el sistema.
                  </span>
                </div>
              )}

              <div className="client-section-title">
                <div>
                  <strong>Historial de pagos mensuales</strong>
                  <span>Los pagos pendientes aparecen primero; los confirmados quedan como respaldo.</span>
                </div>
              </div>

              <div className="client-payments-board">
                {orderedPublicPagos.length === 0 && (
                  <article className="client-payment-empty">
                    <strong>Sin pagos mensuales todavía</strong>
                    <span>Cuando administración cree el primer cobro mensual, aparecerá en esta sección.</span>
                  </article>
                )}
                {orderedPublicPagos.map((pago) => {
                  const timeline = getPaymentTimeline(pago);
                  const monthlyForm = monthlyPaymentForms[pago.id] || {
                    metodo_pago: pago.metodo_pago || "Transferencia",
                    referencia_pago: pago.referencia_pago || "",
                    comprobante_pago: null,
                    comprobante_preview: "",
                    comprobante_name: "",
                    observaciones_cliente: pago.observaciones_cliente || "",
                  };
                  const canUploadMonthlyProof = pago.estado !== "PAGADO";
                  const hasMonthlyProof = Boolean(pago.comprobante_pago || monthlyForm.comprobante_pago);
                  const showMonthlyEditor = canUploadMonthlyProof && monthlyPaymentEditorOpen[pago.id];
                  return (
                    <article className={`client-payment-card payment-${timeline.tone}`} key={pago.id}>
                      <div className="client-payment-top">
                        <div>
                          <small>Pago mensual</small>
                          <strong>{pago.periodo}</strong>
                        </div>
                        <span className={`status ${String(pago.estado || "").toLowerCase()}`}>
                          {estadoLabels[pago.estado] || pago.estado}
                        </span>
                      </div>
                      <div className="client-payment-alert">
                        <strong>{timeline.title}</strong>
                        <span>{timeline.detail}</span>
                      </div>
                      <div className="client-payment-meta">
                        <span><b>Habitación</b>{pago.habitacion_codigo}</span>
                        <span><b>Monto</b>${pago.monto}</span>
                        <span><b>Fecha límite</b>{formatDate(pago.fecha_vencimiento)}</span>
                        <span><b>Fecha de pago</b>{pago.fecha_pago ? formatDate(pago.fecha_pago) : "Sin registrar"}</span>
                        <span>
                          <b>Comprobante</b>
                          {pago.comprobante_pago ? (
                            <a href={resolveMediaUrl(pago.comprobante_pago)} target="_blank" rel="noreferrer">Ver archivo</a>
                          ) : (
                            "Sin archivo"
                          )}
                        </span>
                        <span><b>Forma de pago</b>{pago.metodo_pago || "Sin registrar"}</span>
                      </div>

                      {canUploadMonthlyProof && !showMonthlyEditor && (
                        <div className="monthly-proof-actions">
                          <span>
                            {hasMonthlyProof
                              ? "Tu comprobante está enviado. Puedes cambiarlo si subiste otro archivo."
                              : "Sube el comprobante cuando realices el pago mensual."}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMonthlyPaymentEditorOpen((current) => ({ ...current, [pago.id]: true }))}
                          >
                            {hasMonthlyProof ? "Cambiar comprobante" : "Enviar comprobante"}
                          </button>
                        </div>
                      )}

                      {showMonthlyEditor && (
                        <div className="monthly-proof-box">
                          <div>
                            <strong>Enviar comprobante mensual</strong>
                            <small>Administración revisará el archivo y marcará el pago como pagado.</small>
                          </div>
                          <div className="payment-methods">
                            {[
                              ["Transferencia", "Transferencia"],
                              ["PayPal", "PayPal"],
                              ["Pago en el sitio", "En el sitio"],
                            ].map(([value, label]) => (
                              <button
                                className={monthlyForm.metodo_pago === value ? "active" : ""}
                                key={value}
                                type="button"
                                onClick={() => updateMonthlyPaymentForm(pago.id, "metodo_pago", value)}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {monthlyForm.metodo_pago === "Transferencia" && (
                            <div className="transfer-payment-panel">
                              <div className="transfer-steps">
                                <strong>Datos para transferencia</strong>
                                <p>Usa esta referencia: Pago #{pago.id} - Habitación {pago.habitacion_codigo} - {pago.periodo}.</p>
                              </div>
                              <div className="bank-details">
                                <span><b>Banco:</b> {bankTransferInfo.banco}</span>
                                <span><b>Tipo:</b> {bankTransferInfo.tipo}</span>
                                <span><b>Número:</b> {bankTransferInfo.numero}</span>
                                <span><b>Titular:</b> {bankTransferInfo.titular}</span>
                              </div>
                            </div>
                          )}

                          <label>
                            Referencia o número de comprobante
                            <input
                              maxLength="120"
                              placeholder="Ej. transferencia 001 o número de operación"
                              value={monthlyForm.referencia_pago}
                              onChange={(event) => updateMonthlyPaymentForm(pago.id, "referencia_pago", event.target.value)}
                            />
                          </label>
                          <label>
                            Subir comprobante
                            <input
                              accept="image/*,.pdf"
                              type="file"
                              onChange={(event) => updateMonthlyPaymentProof(pago.id, event.target.files?.[0] || null)}
                            />
                          </label>

                          {hasMonthlyProof && (
                            <div className="proof-preview">
                              <div>
                                <strong>Comprobante mensual</strong>
                                <span>
                                  {monthlyForm.comprobante_pago
                                    ? `${monthlyForm.comprobante_name || monthlyForm.comprobante_pago.name} · ${formatFileSize(monthlyForm.comprobante_pago.size)}`
                                    : "Archivo guardado anteriormente"}
                                </span>
                              </div>
                              {monthlyForm.comprobante_preview ? (
                                <img src={monthlyForm.comprobante_preview} alt="Vista previa del comprobante mensual" />
                              ) : pago.comprobante_pago ? (
                                <a href={resolveMediaUrl(pago.comprobante_pago)} target="_blank" rel="noreferrer">Abrir comprobante</a>
                              ) : (
                                <span className="proof-file-label">PDF seleccionado</span>
                              )}
                            </div>
                          )}

                          <label className="span-2">
                            Observación para administración
                            <textarea
                              maxLength="300"
                              placeholder="Opcional: detalle del pago o comentario."
                              value={monthlyForm.observaciones_cliente}
                              onChange={(event) => updateMonthlyPaymentForm(pago.id, "observaciones_cliente", event.target.value)}
                            />
                          </label>

                          <div className="monthly-proof-buttons">
                            <button className="primary-button" type="button" onClick={() => sendMonthlyPaymentProof(pago.id)}>
                              Guardar comprobante
                            </button>
                            <button
                              className="ghost-button"
                              type="button"
                              onClick={() => setMonthlyPaymentEditorOpen((current) => ({ ...current, [pago.id]: false }))}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <div className="request-cards">
            {visibleSolicitudes.map((item) => {
              const paymentForm = paymentForms[item.id] || {
                metodo_pago: item.metodo_pago && item.metodo_pago !== "SIN_SELECCIONAR" ? item.metodo_pago : "SITIO",
                referencia_pago: item.referencia_pago || "",
                comprobante_pago: null,
                comprobante_preview: "",
                comprobante_name: "",
                observaciones_pago: item.observaciones_pago || "",
              };
              const isFormalized = Boolean(item.formalizada);
              const isApproved = item.estado === "APROBADA" && !isFormalized;
              const isRejected = item.estado === "RECHAZADA";
              const hasSelectedPayment = item.metodo_pago && item.metodo_pago !== "SIN_SELECCIONAR";
              const paymentPending = isApproved && item.estado_pago !== "CONFIRMADO";
              const paymentConfirmed = isApproved && item.estado_pago === "CONFIRMADO";
              const showPaymentEditor = isApproved && (!hasSelectedPayment || paymentEditorOpen[item.id]);

              return (
                <article className={`request-card estado-${String(item.estado || "").toLowerCase()}`} key={item.id}>
                  <div className="request-card-header">
                    <div>
                      <small>Solicitud #{item.id}</small>
                      <h3>Habitación {item.habitacion_codigo || item.habitacion}</h3>
                      {isFormalized && <span className="request-history-note">Convertida en arriendo</span>}
                    </div>
                    <span className={`status ${String(item.estado || "").toLowerCase()}`}>
                      {isFormalized ? "Formalizada" : estadoLabels[item.estado] || item.estado}
                    </span>
                  </div>

                  <div className="request-summary">
                    <span><b>Precio:</b> ${item.habitacion_precio || "Por confirmar"}</span>
                    <span><b>Pago:</b> {isRejected ? "No aplicable" : paymentMethodLabels[item.metodo_pago] || "Sin seleccionar"}</span>
                    <span><b>Estado de pago:</b> {isRejected ? "Cerrado por rechazo" : paymentStatusLabels[item.estado_pago] || "Sin seleccionar"}</span>
                    <span>
                      <b>{isRejected ? "Historial:" : "Comprobante:"}</b>{" "}
                      {item.comprobante_pago ? (
                        <a href={resolveMediaUrl(item.comprobante_pago)} target="_blank" rel="noreferrer">Ver archivo</a>
                      ) : (
                        "Sin archivo"
                      )}
                    </span>
                  </div>

                  {item.mensaje && <p>{item.mensaje}</p>}

                  {paymentPending && !hasSelectedPayment && (
                    <div className="payment-pending-banner">
                      <div>
                        <strong>Pago pendiente</strong>
                        <span>
                          {hasSelectedPayment
                            ? "Tu método fue registrado. Administración debe confirmar el pago."
                            : "Tu solicitud fue aprobada. Elige cómo deseas pagar para continuar."}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          const card = event.currentTarget.closest(".request-card");
                          setPaymentEditorOpen((current) => ({ ...current, [item.id]: true }));
                          window.setTimeout(() => {
                            card
                              ?.querySelector(".payment-box")
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 0);
                        }}
                      >
                        {hasSelectedPayment ? "Cambiar pago" : "Completar pago"}
                      </button>
                    </div>
                  )}

                  {isApproved && hasSelectedPayment && !showPaymentEditor && (
                    <div className={`payment-review-card ${paymentConfirmed ? "confirmed" : ""}`}>
                      <div>
                        <strong>{paymentConfirmed ? "Pago confirmado" : "Pago enviado a revisión"}</strong>
                        <p>
                          {paymentConfirmed
                            ? "Administración confirmó el pago de esta solicitud."
                            : "Administración revisará la referencia, el comprobante y confirmará si corresponde al pago real."}
                        </p>
                      </div>
                      {!paymentConfirmed && (
                        <button
                          type="button"
                          onClick={(event) => {
                            const card = event.currentTarget.closest(".request-card");
                            setPaymentEditorOpen((current) => ({ ...current, [item.id]: true }));
                            window.setTimeout(() => {
                              card
                                ?.querySelector(".payment-box")
                                ?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }, 0);
                          }}
                        >
                          Cambiar comprobante
                        </button>
                      )}
                    </div>
                  )}

                  {showPaymentEditor ? (
                    <div className="payment-box">
                      <div>
                        <strong>{hasSelectedPayment ? "Actualizar forma de pago" : "Elige tu forma de pago"}</strong>
                        <small>
                          PayPal quedará como pago pendiente hasta conectar las credenciales oficiales y confirmar la captura.
                        </small>
                      </div>

                      <div className="payment-methods">
                        {[
                          ["PAYPAL", "PayPal"],
                          ["TRANSFERENCIA", "Transferencia"],
                          ["SITIO", "En el sitio"],
                        ].map(([value, label]) => (
                          <button
                            className={paymentForm.metodo_pago === value ? "active" : ""}
                            key={value}
                            type="button"
                            onClick={() => updatePaymentForm(item.id, "metodo_pago", value)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {paymentForm.metodo_pago === "PAYPAL" ? (
                        <div className="paypal-note">
                          <strong>PayPal</strong>
                          <p>Cuando se conecte la cuenta PayPal Business, aquí se abrirá el pago seguro. Por ahora puedes guardar esta opción para que administración lo coordine.</p>
                        </div>
                      ) : paymentForm.metodo_pago === "TRANSFERENCIA" ? (
                        <div className="transfer-payment-panel">
                          <div className="transfer-steps">
                            <strong>Datos para transferencia</strong>
                            <p>Realiza el pago mensual y usa esta referencia: Solicitud #{item.id} - Habitación {item.habitacion_codigo || item.habitacion}.</p>
                          </div>
                          <div className="bank-details">
                            <span><b>Banco:</b> {bankTransferInfo.banco}</span>
                            <span><b>Tipo:</b> {bankTransferInfo.tipo}</span>
                            <span><b>Número:</b> {bankTransferInfo.numero}</span>
                            <span><b>Titular:</b> {bankTransferInfo.titular}</span>
                            <span><b>Identificación:</b> {bankTransferInfo.identificacion}</span>
                          </div>
                          <label>
                            Referencia o número de comprobante
                            <input
                              maxLength="120"
                              placeholder="Ej. comprobante 001 o número de operación"
                              value={paymentForm.referencia_pago}
                              onChange={(event) => updatePaymentForm(item.id, "referencia_pago", event.target.value)}
                            />
                          </label>
                          <label>
                            Subir comprobante
                            <input
                              accept="image/*,.pdf"
                              type="file"
                              onChange={(event) => updatePaymentProof(item.id, event.target.files?.[0] || null)}
                            />
                          </label>
                          {(paymentForm.comprobante_pago || item.comprobante_pago) && (
                            <div className="proof-preview">
                              <div>
                                <strong>Comprobante seleccionado</strong>
                                <span>
                                  {paymentForm.comprobante_pago
                                    ? `${paymentForm.comprobante_name || paymentForm.comprobante_pago.name} · ${formatFileSize(paymentForm.comprobante_pago.size)}`
                                    : "Archivo guardado anteriormente"}
                                </span>
                              </div>
                              {paymentForm.comprobante_preview ? (
                                <img src={paymentForm.comprobante_preview} alt="Vista previa del comprobante" />
                              ) : item.comprobante_pago ? (
                                <a href={resolveMediaUrl(item.comprobante_pago)} target="_blank" rel="noreferrer">Abrir comprobante</a>
                              ) : (
                                <span className="proof-file-label">PDF seleccionado</span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="paypal-note">
                          <strong>Pago en el sitio</strong>
                          <p>El pago se confirmará cuando te acerques al establecimiento.</p>
                        </div>
                      )}

                      <label className="span-2">
                        Observación para administración
                        <textarea
                          maxLength="300"
                          placeholder="Opcional: horario de llegada, detalle del pago o comentario."
                          value={paymentForm.observaciones_pago}
                          onChange={(event) => updatePaymentForm(item.id, "observaciones_pago", event.target.value)}
                        />
                      </label>

                      <button className="primary-button" type="button" onClick={() => choosePaymentMethod(item.id)}>
                        Guardar forma de pago
                      </button>
                    </div>
                  ) : !isApproved ? (
                    <div className={`request-waiting ${isRejected ? "rejected" : ""}`}>
                      {isFormalized
                        ? "Esta solicitud ya fue registrada como arriendo. Revisa tus pagos mensuales en la parte superior."
                        : item.estado === "PENDIENTE"
                          ? "Tu solicitud está pendiente de revisión."
                          : "La solicitud fue rechazada. Puedes revisar otras habitaciones disponibles."}
                    </div>
                  ) : null}
                </article>
              );
            })}

            {!solicitudesLoading && visibleSolicitudes.length === 0 && (
              <div className="empty-state">
                {publicSolicitudes.length === 0
                  ? "Todavía no tienes solicitudes registradas."
                  : requestsView === "activas"
                    ? "No tienes solicitudes activas. Revisa el historial si quieres ver solicitudes rechazadas."
                    : "No tienes solicitudes rechazadas en el historial."}
              </div>
            )}
            {solicitudesLoading && <div className="empty-state">Cargando tus solicitudes...</div>}
          </div>
        </section>
      ) : publicSection === "canton" ? (
        <section className="canton-page">
          <div className="canton-copy">
            <p className="eyebrow">Sobre el cantón</p>
            <h2>La Joya de los Sachas, Ecuador</h2>
            <p>
              Cantón amazónico de la provincia de Orellana, reconocido por su identidad
              productiva, su actividad comercial y su conexión con la vida de la Amazonía ecuatoriana.
            </p>
          </div>
          <div className="canton-media-stack">
            <div className="canton-video-card">
              <iframe
                title="Video sobre La Joya de los Sachas"
                src="https://www.youtube.com/embed/h-17J5uVsSM"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="canton-info-grid">
              <article>
                <span>01</span>
                <strong>Amazonía ecuatoriana</strong>
                <p>Forma parte del territorio amazónico del Ecuador, una zona de biodiversidad, cultura y crecimiento local.</p>
              </article>
              <article>
                <span>02</span>
                <strong>Provincia de Orellana</strong>
                <p>Actualmente pertenece a Orellana, provincia que agrupa cantones como Aguarico, Loreto, Francisco de Orellana y Sacha.</p>
              </article>
              <article>
                <span>03</span>
                <strong>Cantón desde 1988</strong>
                <p>Su cantonización marcó un paso importante para el desarrollo institucional y social de la localidad.</p>
              </article>
              <article>
                <span>04</span>
                <strong>Zona práctica y conectada</strong>
                <p>Cuenta con comercio cercano, servicios, transporte y movimiento diario; una zona conveniente para vivir con comodidad en el corazón de La Joya de los Sachas.</p>
              </article>
            </div>
          </div>
        </section>
      ) : publicSection === "rooms" ? (
        renderRoomsCatalog()
      ) : publicSection === "location" ? (
        renderLocationSection()
      ) : publicSection === "contact" ? (
        renderContactSection()
      ) : (
        <>
      <section className="public-hero">
        <div className="hero-copy">
          <p className="eyebrow">Habitaciones amobladas en La Joya de los Sachas</p>
          <h1>Habitaciones amobladas listas para alquilar</h1>
          <p>
            Revisa habitaciones por piso, compara servicios incluidos y envía tu solicitud
            en línea para que administración confirme la disponibilidad.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={scrollToRooms}>
              Ver habitaciones
            </button>
            <button className="ghost-button" type="button" onClick={openGuide}>
              Cómo funciona
            </button>
          </div>
        </div>
        <div className="hero-stats-grid" aria-label="Resumen de disponibilidad">
          <span>
            <strong>{publicAvailability.total}</strong>
            habitaciones disponibles
          </span>
          <span>
            <strong>Desde ${publicAvailability.minPrice}</strong>
            precio mensual
          </span>
          <span>
            <strong>{publicAvailability.floors || 3} pisos</strong>
            opciones para revisar
          </span>
          <span>
            <strong>Solicitud en línea</strong>
            respuesta de administración
          </span>
        </div>
      </section>
      <section className="public-highlights" aria-label="Ventajas del servicio">
        <article>
          <span className="highlight-icon bed-icon" aria-hidden="true" />
          <div>
            <strong>Habitaciones equipadas</strong>
            <p>Espacios con cama, mesa, armario y servicios básicos según disponibilidad.</p>
          </div>
        </article>
        <article>
          <span className="highlight-icon price-icon" aria-hidden="true" />
          <div>
            <strong>Precios claros</strong>
            <p>Consulta el valor mensual antes de enviar tus datos de contacto.</p>
          </div>
        </article>
        <article>
          <span className="highlight-icon request-icon" aria-hidden="true" />
          <div>
            <strong>Proceso sencillo</strong>
            <p>Elige una habitación, solicita y espera la revisión del administrador.</p>
          </div>
        </article>
      </section>

      <button className="floating-request-button" type="button" onClick={scrollToRooms}>
        <span aria-hidden="true">+</span>
        Solicitar
      </button>

        </>
      )}

      {renderPublicFooter()}

      {detailRoom && (
        <div className="modal-backdrop" onClick={closeRoomDetail}>
          <section className="solicitud-modal room-detail-modal" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Cerrar detalle de habitación"
              className="modal-close-button room-detail-close"
              title="Cerrar"
              type="button"
              onClick={closeRoomDetail}
            >
              X
            </button>
            <div className="panel-header modal-header">
              <div>
                <h2>Habitación {detailRoom.codigo}</h2>
                <p>${detailRoom.precio_mensual} / mes</p>
              </div>
            </div>

            <div className="room-photo-viewer" aria-label="Fotos de la habitación">
              <button
                className="room-main-photo"
                type="button"
                onClick={() => setZoomedRoomImage(getRoomGalleryImages(detailRoom)[detailImageIndex] || getRoomGalleryImages(detailRoom)[0])}
              >
                <img
                  alt={`Habitación ${detailRoom.codigo}, foto principal`}
                  src={getRoomGalleryImages(detailRoom)[detailImageIndex] || getRoomGalleryImages(detailRoom)[0]}
                />
                <span>Ampliar imagen</span>
              </button>
              <p className="photo-reference-note">
                {getRoomPhotoReference(detailRoom)}. La distribución es similar en el piso, pero el tamaño puede variar según la habitación.
              </p>

              <div className="room-photo-thumbnails">
                {getRoomGalleryImages(detailRoom).map((image, index) => (
                  <button
                    aria-label={`Ver foto ${index + 1} de la habitación ${detailRoom.codigo}`}
                    className={index === detailImageIndex ? "active" : ""}
                    key={image}
                    type="button"
                    onClick={() => setDetailImageIndex(index)}
                  >
                    <img
                      alt={`Habitación ${detailRoom.codigo}, miniatura ${index + 1}`}
                      src={image}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="room-detail-grid">
              <div>
                <small>Estado</small>
                <strong>Disponible</strong>
              </div>
              <div>
                <small>Precio mensual</small>
                <strong>${detailRoom.precio_mensual}</strong>
              </div>
            </div>

            <div className="room-detail-section">
              <h3>Descripción</h3>
              <p>{detailRoom.descripcion || "Habitación amoblada disponible."}</p>
            </div>

            <div className="room-detail-section">
              <h3>Servicios incluidos</h3>
              <p>{detailRoom.servicios || "Servicios por confirmar."}</p>
            </div>

            {detailRoom.observaciones && (
              <div className="room-detail-section">
                <h3>Observaciones</h3>
                <p>{detailRoom.observaciones}</p>
              </div>
            )}

            <div className="form-actions">
              <button className="primary-button" type="button" onClick={() => requestFromDetail(detailRoom)}>
                Solicitar esta habitación
              </button>
              <button className="ghost-button" type="button" onClick={closeRoomDetail}>
                Volver
              </button>
            </div>
          </section>
        </div>
      )}

      {zoomedRoomImage && detailRoom && (
        <div className="image-zoom-backdrop" onClick={() => setZoomedRoomImage(null)}>
          <section className="image-zoom-panel" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Cerrar imagen ampliada"
              className="modal-close-button image-zoom-close"
              title="Cerrar"
              type="button"
              onClick={() => setZoomedRoomImage(null)}
            >
              X
            </button>
            <img
              alt={`Habitación ${detailRoom.codigo} ampliada`}
              src={zoomedRoomImage}
            />
            <p>Habitación {detailRoom.codigo}</p>
          </section>
        </div>
      )}

      {authMode && (
        <div className="modal-backdrop" onClick={closeAuth}>
          <form className="solicitud-modal auth-modal" onClick={(event) => event.stopPropagation()} onSubmit={submitAuth}>
            <div className="panel-header modal-header">
              <div>
                <h2>{authMode === "register" ? "Crear cuenta" : "Iniciar sesión"}</h2>
                <p>{authMode === "register" ? "Regístrate para solicitar una habitación." : "Ingresa con tu correo para reservar."}</p>
              </div>
              <button
                aria-label="Cerrar acceso de usuario"
                className="modal-close-button"
                title="Cerrar"
                type="button"
                onClick={closeAuth}
              >
                X
              </button>
            </div>

            {authMode === "register" && (
              <>
                <label>
                  Nombres
                  <input
                    maxLength="100"
                    minLength="3"
                    pattern={nombrePattern}
                    required
                    title="Ingrese solo letras y espacios."
                    value={authForm.nombres}
                    onChange={(event) => updateAuthField("nombres", event.target.value)}
                    placeholder="Ej. Juan"
                  />
                </label>
                <label>
                  Apellidos
                  <input
                    maxLength="100"
                    minLength="3"
                    pattern={nombrePattern}
                    required
                    title="Ingrese solo letras y espacios."
                    value={authForm.apellidos}
                    onChange={(event) => updateAuthField("apellidos", event.target.value)}
                    placeholder="Ej. Perez"
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    inputMode="numeric"
                    maxLength="10"
                    pattern={telefonoPattern}
                    required
                    title="Ingrese solo números, entre 7 y 10 dígitos."
                    value={authForm.telefono}
                    onChange={(event) => updateAuthField("telefono", event.target.value)}
                    placeholder="Ej. 0999999999"
                  />
                </label>
              </>
            )}

            <label>
              Correo
              <input
                maxLength="254"
                required
                type="email"
                value={authForm.correo}
                onChange={(event) => updateAuthField("correo", event.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </label>
            <label>
              Contraseña
              <input
                minLength="8"
                required
                type="password"
                value={authForm.password}
                onChange={(event) => updateAuthField("password", event.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </label>

            <button className="primary-button" type="submit">
              {authMode === "register" ? "Crear cuenta" : "Entrar"}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}
            >
              {authMode === "register" ? "Ya tengo cuenta" : "Crear una cuenta"}
            </button>
          </form>
        </div>
      )}

      {selectedRoom && (
        <div className="modal-backdrop" onClick={closeSolicitudModal}>
          <form className="solicitud-modal" onClick={(event) => event.stopPropagation()} onSubmit={sendSolicitud}>
            <div className="panel-header modal-header">
              <div>
                <h2>Solicitar habitación {selectedRoom.codigo}</h2>
                <p>Precio mensual: ${selectedRoom.precio_mensual}</p>
              </div>
              <button
                aria-label="Cerrar ventana de solicitud"
                className="modal-close-button"
                title="Cerrar"
                type="button"
                onClick={closeSolicitudModal}
              >
                X
              </button>
            </div>

            <label>
              Nombres completos
              <input
                maxLength="150"
                minLength="3"
                pattern={nombrePattern}
                required
                title="Ingrese solo letras y espacios."
                value={solicitud.nombres}
                onChange={(event) => setSolicitud({
                  ...solicitud,
                  nombres: sanitizeInputValue({ pattern: nombrePattern }, event.target.value),
                })}
                placeholder="Ej. Juan Perez"
              />
            </label>
            <label>
              Teléfono
              <input
                inputMode="numeric"
                maxLength="10"
                pattern={telefonoPattern}
                required
                title="Ingrese solo números, entre 7 y 10 dígitos."
                value={solicitud.telefono}
                onChange={(event) => setSolicitud({
                  ...solicitud,
                  telefono: sanitizeInputValue({ inputMode: "numeric" }, event.target.value),
                })}
                placeholder="Ej. 0999999999"
              />
            </label>
            <label>
              Correo
              <input
                type="email"
                maxLength="254"
                value={solicitud.correo}
                onChange={(event) => setSolicitud({ ...solicitud, correo: event.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </label>
            <label>
              Mensaje
              <textarea
                maxLength="500"
                value={solicitud.mensaje}
                onChange={(event) => setSolicitud({ ...solicitud, mensaje: event.target.value })}
                placeholder="Estoy interesado en la habitación..."
              />
            </label>

            <button className="primary-button" type="submit">Enviar solicitud</button>
          </form>
        </div>
      )}
    </main>
  );
}

function AdminView({ onPublicClick }) {
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem("tesis_auth");
    return saved ? JSON.parse(saved) : { username: "admin", password: "Admin12345!" };
  });
  const [isLogged, setIsLogged] = useState(Boolean(localStorage.getItem("tesis_auth")));
  const [activeModule, setActiveModule] = useState("habitaciones");
  const [selectedInventoryRoomId, setSelectedInventoryRoomId] = useState("");
  const [records, setRecords] = useState([]);
  const [lookups, setLookups] = useState({ habitaciones: [], arrendatarios: [], arriendos: [], pagos: [], solicitudes: [] });
  const [form, setForm] = useState(moduleConfig.habitaciones.empty);
  const [editingId, setEditingId] = useState(null);
  const [pendingRentalDraft, setPendingRentalDraft] = useState(null);
  const [manualPaymentFormOpen, setManualPaymentFormOpen] = useState(false);
  const [manualTenantFormOpen, setManualTenantFormOpen] = useState(false);
  const [manualRentalFormOpen, setManualRentalFormOpen] = useState(false);
  const [adminRoomModal, setAdminRoomModal] = useState(null);
  const [adminRoomPhotoIndex, setAdminRoomPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const config = moduleConfig[activeModule];

  const stats = useMemo(() => {
    const total = records.length;
    const disponibles = records.filter((item) => item.estado === "DISPONIBLE").length;
    const ocupadas = records.filter((item) => item.estado === "OCUPADA").length;
    const mantenimiento = records.filter((item) => item.estado === "MANTENIMIENTO").length;

    return [
      { label: `Total ${config.title.toLowerCase()}`, value: total },
      { label: "Disponibles", value: disponibles },
      { label: "Ocupadas", value: ocupadas },
      { label: "Mantenimiento", value: mantenimiento },
    ];
  }, [records, config.title]);

  const inventoryGroups = useMemo(() => {
    const grouped = new Map();
    records.forEach((record) => {
      const roomId = String(record.habitacion || "");
      if (!grouped.has(roomId)) {
        const room = lookups.habitaciones.find((item) => String(item.id) === roomId);
        grouped.set(roomId, {
          id: roomId,
          label: room ? `Habitación ${room.codigo}` : getLabel("habitaciones", roomId, lookups),
          estado: room?.estado || "",
          items: [],
          totalItems: 0,
          totalUnits: 0,
          damagedItems: 0,
        });
      }
      const group = grouped.get(roomId);
      group.items.push(record);
      group.totalItems += 1;
      group.totalUnits += Number(record.cantidad || 0);
      if (["MALO", "DANADO"].includes(record.estado)) group.damagedItems += 1;
    });
    return Array.from(grouped.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [records, lookups]);

  const selectedInventoryGroup = useMemo(() => {
    if (!inventoryGroups.length) return null;
    return inventoryGroups.find((group) => group.id === selectedInventoryRoomId) || inventoryGroups[0];
  }, [inventoryGroups, selectedInventoryRoomId]);

  const roomGroups = useMemo(() => {
    const grouped = new Map();
    records.forEach((record) => {
      const codigo = String(record.codigo || "");
      const floor = /^[234]0[1-9]$/.test(codigo) ? codigo[0] : "otros";
      const key = floor === "otros" ? "otros" : `piso-${floor}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          label: floor === "otros" ? "Otras habitaciones" : `Piso ${floor}`,
          range: floor === "otros" ? "Registros fuera de pisos principales" : `${floor}01 - ${floor}09`,
          rooms: [],
          disponibles: 0,
          ocupadas: 0,
          mantenimiento: 0,
        });
      }
      const group = grouped.get(key);
      group.rooms.push(record);
      if (record.estado === "DISPONIBLE") group.disponibles += 1;
      if (record.estado === "OCUPADA") group.ocupadas += 1;
      if (record.estado === "MANTENIMIENTO") group.mantenimiento += 1;
    });
    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        rooms: group.rooms.sort((a, b) => String(a.codigo).localeCompare(String(b.codigo))),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [records]);

  const requestSummary = useMemo(() => {
    return {
      total: records.length,
      pending: records.filter((record) => record.estado === "PENDIENTE").length,
      approved: records.filter((record) => record.estado === "APROBADA").length,
      rejected: records.filter((record) => record.estado === "RECHAZADA").length,
    };
  }, [records]);

  const paymentSummary = useMemo(() => {
    const pendingRecords = records.filter((record) => record.estado !== "PAGADO");
    const paid = records.filter((record) => record.estado === "PAGADO").length;
    const late = pendingRecords.filter((record) => getPaymentTimeline(record).tone === "late").length;
    const dueSoonRecords = pendingRecords
      .map((record) => ({ ...record, dueDate: parseLocalDate(record.fecha_vencimiento) }))
      .filter((record) => record.dueDate)
      .sort((a, b) => a.dueDate - b.dueDate);
    const nextPayment = dueSoonRecords[0];

    return {
      total: records.length,
      pending: pendingRecords.length,
      paid,
      late,
      nextPayment,
    };
  }, [records]);

  const formalizationRequests = useMemo(() => {
    return lookups.solicitudes
      .filter((solicitud) => solicitud.estado === "APROBADA" && solicitud.estado_pago === "CONFIRMADO")
      .filter((solicitud) => !isSolicitudFormalized(solicitud))
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [lookups]);

  const tenantSummary = useMemo(() => {
    return {
      total: records.length,
      active: records.filter((record) => record.estado === "ACTIVO").length,
      inactive: records.filter((record) => record.estado === "INACTIVO").length,
      toFormalize: formalizationRequests.length,
    };
  }, [records, formalizationRequests]);

  const rentalSummary = useMemo(() => {
    return {
      total: records.length,
      active: records.filter((record) => record.estado === "ACTIVO").length,
      finished: records.filter((record) => record.estado === "FINALIZADO").length,
      canceled: records.filter((record) => record.estado === "CANCELADO").length,
    };
  }, [records]);

  useEffect(() => {
    if (activeModule !== "inventario") return;
    if (!inventoryGroups.length) {
      setSelectedInventoryRoomId("");
      return;
    }
    if (!inventoryGroups.some((group) => group.id === selectedInventoryRoomId)) {
      setSelectedInventoryRoomId(inventoryGroups[0].id);
    }
  }, [activeModule, inventoryGroups, selectedInventoryRoomId]);

  useEffect(() => {
    if (activeModule !== "solicitudes") return;
    setEditingId(null);
    setForm(moduleConfig.solicitudes.empty);
    setMessage((current) => current.startsWith("Editando registro") ? "" : current);
  }, [activeModule]);

  async function loadModule(moduleKey = activeModule, activeCredentials = credentials) {
    setLoading(true);
    setError("");
    try {
      const data = await request(moduleConfig[moduleKey].endpoint, activeCredentials);
      setRecords(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(`No se pudo cargar información. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadLookups(activeCredentials = credentials) {
    try {
      const [habitacionesData, arrendatariosData, arriendosData, pagosData, solicitudesData] = await Promise.all([
        request("/habitaciones/", activeCredentials),
        request("/arrendatarios/", activeCredentials),
        request("/arriendos/", activeCredentials),
        request("/pagos/", activeCredentials),
        request("/solicitudes-arrendamiento/", activeCredentials),
      ]);
      setLookups({
        habitaciones: Array.isArray(habitacionesData) ? habitacionesData : habitacionesData.results || [],
        arrendatarios: Array.isArray(arrendatariosData) ? arrendatariosData : arrendatariosData.results || [],
        arriendos: Array.isArray(arriendosData) ? arriendosData : arriendosData.results || [],
        pagos: Array.isArray(pagosData) ? pagosData : pagosData.results || [],
        solicitudes: Array.isArray(solicitudesData) ? solicitudesData : solicitudesData.results || [],
      });
    } catch (err) {
      setError(`No se pudieron cargar listas relacionadas. ${err.message}`);
    }
  }

  useEffect(() => {
    if (isLogged) {
      loadModule(activeModule);
      loadLookups();
    }
  }, [isLogged, activeModule]);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    try {
      await request("/habitaciones/", credentials);
      localStorage.setItem("tesis_auth", JSON.stringify(credentials));
      setIsLogged(true);
    } catch (err) {
      setError(`Usuario o contraseña incorrectos, o backend no disponible. ${err.message}`);
    }
  }

  function handleLogout() {
    localStorage.removeItem("tesis_auth");
    setIsLogged(false);
    setRecords([]);
    setMessage("");
  }

  function changeModule(moduleKey) {
    setActiveModule(moduleKey);
    setForm(moduleConfig[moduleKey].empty);
    setEditingId(null);
    setPendingRentalDraft(null);
    setManualPaymentFormOpen(false);
    setManualTenantFormOpen(false);
    setManualRentalFormOpen(false);
    setAdminRoomModal(null);
    setAdminRoomPhotoIndex(0);
    if (moduleKey !== "inventario") setSelectedInventoryRoomId("");
    setMessage("");
    setError("");
  }

  function getArriendoMonthlyValue(arriendoId) {
    const arriendo = lookups.arriendos.find((item) => Number(item.id) === Number(arriendoId));
    return Number(arriendo?.valor_mensual || 120).toFixed(2);
  }

  function getArriendoPaymentDay(arriendoId) {
    const arriendo = lookups.arriendos.find((item) => Number(item.id) === Number(arriendoId));
    const startDate = parseLocalDate(arriendo?.fecha_inicio);
    return startDate?.getDate() || new Date().getDate();
  }

  function fillInitialPaymentForm(arriendo, draft = pendingRentalDraft) {
    const periodoInicial = currentMonthPeriod();
    setActiveModule("pagos");
    setEditingId(null);
    setManualRentalFormOpen(false);
    setManualPaymentFormOpen(true);
    setForm({
      ...moduleConfig.pagos.empty,
      arriendo: arriendo.id,
      periodo: periodoInicial,
      fecha_vencimiento: arriendo.fecha_inicio || todayIsoDate(),
      fecha_pago: draft?.pagoConfirmado ? todayIsoDate() : "",
      monto: Number(arriendo.valor_mensual || draft?.precio_mensual || 120).toFixed(2),
      metodo_pago: draft?.metodo_pago || "",
      estado: draft?.pagoConfirmado ? "PAGADO" : "PENDIENTE",
      observaciones: draft?.solicitudId ? `Pago preparado desde la solicitud #${draft.solicitudId}.` : "",
    });
    setPendingRentalDraft((current) => current ? ({ ...current, arriendo: arriendo.id }) : current);
  }

  function findActiveArriendo(arrendatarioId, habitacionId, arriendosList = lookups.arriendos) {
    return arriendosList.find((item) => (
      Number(item.arrendatario) === Number(arrendatarioId)
      && Number(item.habitacion) === Number(habitacionId)
      && item.estado === "ACTIVO"
    ));
  }

  function isSolicitudFormalized(solicitud) {
    const marker = `solicitud #${solicitud.id}`;
    const byArriendoObservation = lookups.arriendos.some((arriendo) => (
      String(arriendo.observaciones || "").toLowerCase().includes(marker)
    ));
    const byPagoObservation = lookups.pagos.some((pago) => (
      String(pago.observaciones || "").toLowerCase().includes(marker)
    ));
    if (byArriendoObservation || byPagoObservation) return true;

    const normalizedEmail = String(solicitud.correo || "").trim().toLowerCase();
    const normalizedPhone = String(solicitud.telefono || "").trim();
    const matchingTenant = lookups.arrendatarios.find((tenant) => {
      const sameEmail = normalizedEmail && String(tenant.correo || "").trim().toLowerCase() === normalizedEmail;
      const samePhone = normalizedPhone && String(tenant.telefono || "").trim() === normalizedPhone;
      return sameEmail || samePhone;
    });
    if (!matchingTenant) return false;
    return Boolean(findActiveArriendo(matchingTenant.id, solicitud.habitacion));
  }

  async function formalizeSolicitudFromTenant(solicitudId, arrendatarioId) {
    const result = await request(`/solicitudes-arrendamiento/${solicitudId}/formalizar/`, credentials, {
      method: "POST",
      body: JSON.stringify({
        arrendatario: arrendatarioId,
        fecha_inicio: todayIsoDate(),
      }),
    });
    await loadModule(activeModule);
    await loadLookups();
    return result;
  }

  function updateField(field, value) {
    const configField = config.fields.find((item) => item.name === field);
    const cleanValue = configField ? sanitizeInputValue(configField, value) : value;
    setForm((current) => {
      const next = { ...current, [field]: cleanValue };

      if (activeModule === "pagos") {
        if (field === "arriendo") {
          next.monto = getArriendoMonthlyValue(cleanValue);
          next.fecha_vencimiento = dueDateForPeriod(next.periodo || currentMonthPeriod(), getArriendoPaymentDay(cleanValue));
        }
        if (field === "periodo") {
          next.fecha_vencimiento = dueDateForPeriod(cleanValue, getArriendoPaymentDay(next.arriendo));
        }
        if (field === "estado") {
          next.fecha_pago = cleanValue === "PAGADO" ? todayIsoDate() : "";
        }
      }
      if (activeModule === "garantias") {
        if (field === "arriendo") {
          next.monto = getArriendoMonthlyValue(cleanValue);
        }
        if (field === "estado") {
          next.fecha_devolucion = cleanValue === "DEVUELTA" ? todayIsoDate() : "";
        }
      }

      return next;
    });
  }

  function editRecord(record) {
    const nextForm = {};
    config.fields.forEach((field) => {
      nextForm[field.name] = record[field.name] ?? "";
    });
    setEditingId(record.id);
    if (activeModule === "pagos") setManualPaymentFormOpen(true);
    if (activeModule === "arrendatarios") setManualTenantFormOpen(true);
    if (activeModule === "arriendos") setManualRentalFormOpen(true);
    if (activeModule === "habitaciones") {
      setAdminRoomModal({ mode: "edit", room: record });
      setAdminRoomPhotoIndex(0);
    }
    setForm(nextForm);
    setMessage(["habitaciones", "arrendatarios", "arriendos"].includes(activeModule) ? "" : `Editando registro #${record.id}.`);
  }

  function resetForm() {
    setEditingId(null);
    setForm(config.empty);
    if (activeModule === "pagos") setManualPaymentFormOpen(false);
    if (activeModule === "arrendatarios") setManualTenantFormOpen(false);
    if (activeModule === "arriendos") setManualRentalFormOpen(false);
    if (activeModule === "habitaciones") {
      setAdminRoomModal(null);
      setAdminRoomPhotoIndex(0);
    }
    if (pendingRentalDraft && ["arrendatarios", "arriendos", "pagos"].includes(activeModule)) {
      setPendingRentalDraft(null);
    }
  }

  function openAdminRoomPhotos(record) {
    setAdminRoomModal({ mode: "photos", room: record });
    setAdminRoomPhotoIndex(0);
    setEditingId(null);
    setForm(config.empty);
    setMessage("");
    setError("");
  }

  function getTenantInitials(record) {
    const firstName = String(record.nombres || "").trim()[0] || "A";
    const lastName = String(record.apellidos || "").trim()[0] || "";
    return `${firstName}${lastName}`.toUpperCase();
  }

  function getTenantActiveRentals(record) {
    return lookups.arriendos.filter((arriendo) => (
      Number(arriendo.arrendatario) === Number(record.id) && arriendo.estado === "ACTIVO"
    ));
  }

  function getRentalPayments(record) {
    return lookups.pagos
      .filter((pago) => Number(pago.arriendo) === Number(record.id))
      .sort((a, b) => (parseLocalDate(a.fecha_vencimiento) || new Date(0)) - (parseLocalDate(b.fecha_vencimiento) || new Date(0)));
  }

  function getRentalNextPayment(record) {
    return getRentalPayments(record)
      .filter((pago) => pago.estado !== "PAGADO")
      .sort((a, b) => (parseLocalDate(a.fecha_vencimiento) || new Date(8640000000000000)) - (parseLocalDate(b.fecha_vencimiento) || new Date(8640000000000000)))[0];
  }

  function getRentalLastPayment(record) {
    return getRentalPayments(record)
      .filter((pago) => pago.estado === "PAGADO")
      .sort((a, b) => (parseLocalDate(b.fecha_pago || b.fecha_vencimiento) || new Date(0)) - (parseLocalDate(a.fecha_pago || a.fecha_vencimiento) || new Date(0)))[0];
  }

  async function saveRecord(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const payload = normalizePayload(form);

    if (!editingId && activeModule === "arriendos" && pendingRentalDraft) {
      const existingArriendo = findActiveArriendo(payload.arrendatario, payload.habitacion);
      if (existingArriendo) {
        fillInitialPaymentForm(existingArriendo, pendingRentalDraft);
        setMessage("Ese arriendo ya estaba registrado. Continuamos con el pago inicial.");
        return;
      }
    }

    try {
      const savedRecord = await request(editingId ? `${config.endpoint}${editingId}/` : config.endpoint, credentials, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      await loadLookups();

      if (!editingId && activeModule === "arrendatarios" && pendingRentalDraft) {
        await formalizeSolicitudFromTenant(pendingRentalDraft.solicitudId, savedRecord.id);
        setPendingRentalDraft(null);
        setEditingId(null);
        setManualTenantFormOpen(false);
        setForm(moduleConfig.arrendatarios.empty);
        setMessage("Solicitud formalizada. El cliente ya tiene arrendatario, arriendo activo y pago inicial registrado.");
        return;
      }

      if (!editingId && activeModule === "arriendos" && pendingRentalDraft) {
        fillInitialPaymentForm(savedRecord, pendingRentalDraft);
        setMessage("Arriendo guardado. Ahora revisa el pago inicial y guarda el registro de pago.");
        return;
      }

      if (!editingId && activeModule === "pagos" && pendingRentalDraft) {
        setMessage("Pago inicial guardado. El cliente ya queda vinculado como arrendatario, con arriendo y control de pagos.");
        setPendingRentalDraft(null);
        resetForm();
        await loadModule();
        await loadLookups();
        return;
      }

      setMessage(editingId ? "Registro actualizado." : "Registro guardado.");
      resetForm();
      await loadModule();
      await loadLookups();
    } catch (err) {
      setError(`No se pudo guardar. ${err.message}`);
    }
  }

  async function deleteRecord(id) {
    const confirmed = window.confirm("Deseas eliminar este registro?");
    if (!confirmed) return;
    setError("");
    try {
      await request(`${config.endpoint}${id}/`, credentials, { method: "DELETE" });
      setMessage("Registro eliminado.");
      await loadModule();
      await loadLookups();
    } catch (err) {
      setError(`No se pudo eliminar. ${err.message}`);
    }
  }

  async function updateSolicitudEstado(record, estado) {
    setError("");
    setMessage("");
    try {
      await request(`${config.endpoint}${record.id}/`, credentials, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      setMessage(
        estado === "APROBADA"
          ? "Solicitud aprobada. La habitación pasó a ocupada y ya no saldrá como disponible."
          : "Solicitud rechazada correctamente."
      );
      await loadModule();
      await loadLookups();
    } catch (err) {
      setError(`No se pudo actualizar el estado de la solicitud. ${err.message}`);
    }
  }

  async function updateSolicitudPago(record, estadoPago) {
    const action = estadoPago === "CONFIRMADO" ? "confirmar_pago" : "pago_pendiente";
    setError("");
    setMessage("");
    try {
      await request(`${config.endpoint}${record.id}/${action}/`, credentials, { method: "POST" });
      setMessage(
        estadoPago === "CONFIRMADO"
          ? "Pago confirmado correctamente."
          : "Pago marcado como pendiente."
      );
      await loadModule();
      await loadLookups();
    } catch (err) {
      setError(`No se pudo actualizar el pago. ${err.message}`);
    }
  }

  async function prepareRentalFromSolicitud(record) {
    const room = lookups.habitaciones.find((item) => Number(item.id) === Number(record.habitacion));
    const nameParts = splitFullName(record.nombres);
    const normalizedEmail = String(record.correo || "").trim().toLowerCase();
    const normalizedPhone = String(record.telefono || "").trim();
    const existingTenant = lookups.arrendatarios.find((tenant) => {
      const sameEmail = normalizedEmail && String(tenant.correo || "").trim().toLowerCase() === normalizedEmail;
      const samePhone = normalizedPhone && String(tenant.telefono || "").trim() === normalizedPhone;
      return sameEmail || samePhone;
    });
    const draft = {
      solicitudId: record.id,
      habitacion: record.habitacion,
      habitacionLabel: getLabel("habitaciones", record.habitacion, lookups),
      precio_mensual: room?.precio_mensual || "120.00",
      metodo_pago: paymentMethodForPago(record.metodo_pago),
      pagoConfirmado: record.estado_pago === "CONFIRMADO",
    };

    if (existingTenant) {
      setError("");
      setMessage("");
      try {
        await formalizeSolicitudFromTenant(record.id, existingTenant.id);
        setPendingRentalDraft(null);
        setMessage(`Solicitud formalizada. ${existingTenant.nombres} ya tiene arriendo activo y pago inicial registrado.`);
      } catch (err) {
        setError("");
        setMessage("");
        setError(`No se pudo formalizar la solicitud. ${err.message}`);
      }
      return;
    }

    setPendingRentalDraft(draft);
    setActiveModule("arrendatarios");
    setEditingId(null);
    setManualTenantFormOpen(true);
    setSelectedInventoryRoomId("");
    setForm({
      ...moduleConfig.arrendatarios.empty,
      nombres: nameParts.nombres,
      apellidos: nameParts.apellidos,
      telefono: record.telefono || "",
      correo: record.correo || "",
      estado: "ACTIVO",
    });
    setError("");
    setMessage(`Completa los datos legales de ${record.nombres}. Al guardar, se creará el arriendo activo y el pago inicial de ${draft.habitacionLabel}.`);
  }

  async function updatePagoEstado(record, estado) {
    setError("");
    setMessage("");
    try {
      const payload = estado === "PAGADO"
        ? { estado, fecha_pago: record.fecha_pago || todayIsoDate() }
        : { estado, fecha_pago: null };
      await request(`${config.endpoint}${record.id}/`, credentials, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMessage(estado === "PAGADO" ? "Pago registrado como pagado." : "Pago marcado como pendiente.");
      await loadModule();
    } catch (err) {
      setError(`No se pudo actualizar el pago. ${err.message}`);
    }
  }

  function getPaymentContext(record) {
    const arriendo = lookups.arriendos.find((item) => Number(item.id) === Number(record.arriendo));
    const roomLabel = record.habitacion_codigo
      ? `Habitación ${record.habitacion_codigo}`
      : arriendo
        ? getLabel("habitaciones", arriendo.habitacion, lookups)
        : "Habitación no seleccionada";
    return {
      arriendo,
      arrendatario: record.arrendatario_nombre || (arriendo ? getLabel("arrendatarios", arriendo.arrendatario, lookups) : "Arrendatario no seleccionado"),
      habitacion: roomLabel,
    };
  }

  function getArriendoContext(arriendoId) {
    const arriendo = lookups.arriendos.find((item) => Number(item.id) === Number(arriendoId));
    return {
      arriendo,
      arrendatario: arriendo?.arrendatario_nombre || (arriendo ? getLabel("arrendatarios", arriendo.arrendatario, lookups) : "Arrendatario no seleccionado"),
      habitacion: arriendo?.habitacion_codigo ? `Habitación ${arriendo.habitacion_codigo}` : arriendo ? getLabel("habitaciones", arriendo.habitacion, lookups) : "Habitación no seleccionada",
    };
  }

  function getGuaranteeTimeline(record) {
    if (record.estado === "DEVUELTA") {
      return {
        tone: "paid",
        title: "Garantía devuelta",
        detail: record.fecha_devolucion ? `Devuelta el ${formatDate(record.fecha_devolucion)}.` : "Garantía cerrada como devuelta.",
      };
    }
    if (record.estado === "USADA_POR_DANOS") {
      return {
        tone: "late",
        title: "Usada por daños",
        detail: "La garantía fue aplicada por daños o valores pendientes.",
      };
    }
    return {
      tone: "pending",
      title: "Garantía retenida",
      detail: "Se conserva como respaldo hasta finalizar el arriendo.",
    };
  }

  async function updateGarantiaEstado(record, estado) {
    setError("");
    setMessage("");
    try {
      const payload = {
        estado,
        fecha_devolucion: estado === "DEVUELTA" ? todayIsoDate() : null,
      };
      await request(`${config.endpoint}${record.id}/`, credentials, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMessage(
        estado === "DEVUELTA"
          ? "Garantía marcada como devuelta."
          : estado === "USADA_POR_DANOS"
            ? "Garantía marcada como usada por daños."
            : "Garantía marcada como retenida."
      );
      await loadModule();
    } catch (err) {
      setError(`No se pudo actualizar la garantía. ${err.message}`);
    }
  }

  async function copyPaymentReminder(record) {
    const context = getPaymentContext(record);
    const text = `Hola, ${context.arrendatario}. Te recordamos que tu pago de ${record.periodo} por ${formatCell("monto", record.monto, lookups)} corresponde a ${context.habitacion}. Fecha límite: ${formatDate(record.fecha_vencimiento)}. Gracias.`;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Aviso de pago copiado. Puedes pegarlo en WhatsApp o mensaje.");
    } catch (err) {
      setError("No se pudo copiar el aviso. Puedes escribirlo manualmente desde la información del pago.");
    }
  }

  const showAdminForm = activeModule !== "solicitudes" && activeModule !== "habitaciones"
    && activeModule !== "arrendatarios"
    && activeModule !== "arriendos"
    && (activeModule !== "pagos" || manualPaymentFormOpen || editingId || pendingRentalDraft);

  if (!isLogged) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <p className="eyebrow">Administración</p>
          <h1>Ingresar al panel</h1>
          <p className="muted">Esta vista es solo para administrador o encargado.</p>
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Usuario
              <input value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} />
            </label>
            <label>
              Contraseña
              <input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} />
            </label>
            {error && <p className="alert error">{error}</p>}
            <button className="primary-button" type="submit">Entrar</button>
            <button className="ghost-button" type="button" onClick={onPublicClick}>Volver a vista usuario</button>
          </form>
          <p className="hint">Demo: admin / Admin12345!</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar admin-top-panel">
        <div className="brand">
          <span>AT</span>
          <div>
            <strong>Administración</strong>
            <small>Gestión interna</small>
          </div>
        </div>
        <nav className="admin-nav" aria-label="Módulos administrativos">
          {Object.entries(moduleConfig).map(([key, item]) => (
            <button
              className={activeModule === key ? "active" : ""}
              key={key}
              type="button"
              onClick={() => changeModule(key)}
            >
              {item.title}
            </button>
          ))}
        </nav>
        <div className="admin-session-actions">
          <button className="logout-button" type="button" onClick={onPublicClick}>Ver como usuario</button>
          <button className="logout-button" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Panel administrativo</p>
            <h1>Gestión de {config.title.toLowerCase()}</h1>
          </div>
          <button className="secondary-button" type="button" onClick={() => loadModule()}>Actualizar</button>
        </header>

        {activeModule === "habitaciones" ? (
          <section className="stats-grid" aria-label="Resumen de habitaciones">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </section>
        ) : activeModule === "inventario" ? (
          <section className="stats-grid compact-stats" aria-label="Resumen de inventario">
            <article className="stat-card">
              <strong>{inventoryGroups.length}</strong>
              <span>Habitaciones con inventario</span>
            </article>
            <article className="stat-card">
              <strong>{records.length}</strong>
              <span>Bienes registrados</span>
            </article>
            <article className="stat-card">
              <strong>{inventoryGroups.reduce((total, group) => total + group.totalUnits, 0)}</strong>
              <span>Unidades inventariadas</span>
            </article>
          </section>
        ) : activeModule === "pagos" ? (
          <section className="stats-grid compact-stats payment-stats" aria-label="Resumen de pagos">
            <article className="stat-card">
              <strong>{paymentSummary.pending}</strong>
              <span>Pagos pendientes</span>
            </article>
            <article className={`stat-card ${paymentSummary.late ? "danger-stat" : ""}`}>
              <strong>{paymentSummary.late}</strong>
              <span>Vencidos</span>
            </article>
            <article className="stat-card">
              <strong>{paymentSummary.paid}</strong>
              <span>Pagados</span>
            </article>
            <article className="stat-card next-payment-stat">
              <strong>{paymentSummary.nextPayment ? formatDate(paymentSummary.nextPayment.fecha_vencimiento) : "-"}</strong>
              <span>{paymentSummary.nextPayment ? `Próximo: ${paymentSummary.nextPayment.periodo}` : "Sin próximos vencimientos"}</span>
            </article>
          </section>
        ) : activeModule === "solicitudes" ? (
          <section className="stats-grid compact-stats request-stats" aria-label="Resumen de solicitudes">
            <article className="stat-card">
              <strong>{requestSummary.total}</strong>
              <span>Total solicitudes</span>
            </article>
            <article className="stat-card">
              <strong>{requestSummary.pending}</strong>
              <span>Pendientes de revisar</span>
            </article>
            <article className="stat-card">
              <strong>{requestSummary.approved}</strong>
              <span>Aprobadas</span>
            </article>
            <article className="stat-card">
              <strong>{requestSummary.rejected}</strong>
              <span>Rechazadas</span>
            </article>
          </section>
        ) : activeModule === "arrendatarios" ? (
          <section className="stats-grid compact-stats tenant-stats" aria-label="Resumen de arrendatarios">
            <article className="stat-card">
              <strong>{tenantSummary.total}</strong>
              <span>Total arrendatarios</span>
            </article>
            <article className="stat-card">
              <strong>{tenantSummary.active}</strong>
              <span>Activos</span>
            </article>
            <article className="stat-card">
              <strong>{tenantSummary.inactive}</strong>
              <span>Inactivos</span>
            </article>
            <article className="stat-card">
              <strong>{tenantSummary.toFormalize}</strong>
              <span>Por formalizar</span>
            </article>
          </section>
        ) : activeModule === "arriendos" ? (
          <section className="stats-grid compact-stats rental-stats" aria-label="Resumen de arriendos">
            <article className="stat-card">
              <strong>{rentalSummary.total}</strong>
              <span>Total arriendos</span>
            </article>
            <article className="stat-card">
              <strong>{rentalSummary.active}</strong>
              <span>Activos</span>
            </article>
            <article className="stat-card">
              <strong>{rentalSummary.finished}</strong>
              <span>Finalizados</span>
            </article>
            <article className="stat-card">
              <strong>{rentalSummary.canceled}</strong>
              <span>Cancelados</span>
            </article>
          </section>
        ) : (
          <section className="stats-grid compact-stats" aria-label="Resumen del módulo">
            <article className="stat-card">
              <strong>{records.length}</strong>
              <span>Registros en {config.title.toLowerCase()}</span>
            </article>
          </section>
        )}

        {(message || error) && <div className={`alert ${error ? "error" : "success"}`}>{error || message}</div>}

        {activeModule === "pagos" && (
          <section className="payment-rule-panel">
            <div>
              <strong>Regla de cobro mensual</strong>
              <p>El pago vence cada mes el mismo día en que inició el arriendo. Si un cliente entra el 7 de julio, su siguiente pago vence el 7 de agosto.</p>
            </div>
            <div className="payment-rule-actions">
              <span>Usa el tablero para cobrar, confirmar pagos y copiar avisos.</span>
              <button className="secondary-button" type="button" onClick={() => editingId ? resetForm() : setManualPaymentFormOpen((current) => !current)}>
                {editingId ? "Cancelar corrección" : manualPaymentFormOpen ? "Ocultar formulario" : "Registrar pago manual"}
              </button>
            </div>
          </section>
        )}

        {activeModule === "arrendatarios" && (
          <section className="tenant-rule-panel">
            <div>
              <strong>Cartera de arrendatarios</strong>
              <p>Registra aquí solo a clientes que ya fueron aprobados y pagaron su reserva. Cada arrendatario puede quedar vinculado a un arriendo activo y a su control mensual de pagos.</p>
            </div>
            <button className="secondary-button" type="button" onClick={() => editingId ? resetForm() : setManualTenantFormOpen((current) => !current)}>
              {editingId ? "Cancelar edición" : manualTenantFormOpen ? "Cerrar registro" : "Registrar arrendatario"}
            </button>
          </section>
        )}

        {activeModule === "arriendos" && (
          <section className="rental-rule-panel">
            <div>
              <strong>Contratos y ocupación</strong>
              <p>Usa esta vista para controlar qué cliente ocupa cada habitación, desde qué fecha vive y si el arriendo sigue activo.</p>
            </div>
            <button className="secondary-button" type="button" onClick={() => editingId ? resetForm() : setManualRentalFormOpen((current) => !current)}>
              {editingId ? "Cancelar edición" : manualRentalFormOpen ? "Cerrar registro" : "Registrar arriendo"}
            </button>
          </section>
        )}

        <section className={`work-grid ${["pagos", "garantias"].includes(activeModule) ? "wide-form-work-grid" : ""} ${activeModule === "solicitudes" ? "requests-work-grid" : ""} ${activeModule === "pagos" && !showAdminForm ? "payments-focused-work-grid" : ""} ${activeModule === "habitaciones" ? "rooms-focused-work-grid" : ""} ${activeModule === "arrendatarios" && !showAdminForm ? "tenants-focused-work-grid" : ""} ${activeModule === "arriendos" && !showAdminForm ? "rentals-focused-work-grid" : ""}`}>
          {showAdminForm && (
            <form className="form-panel" onSubmit={saveRecord}>
              <div className="panel-header">
                <div>
                  <h2>{editingId ? `Corregir ${config.title}` : activeModule === "pagos" ? "Registrar pago manual" : "Nuevo registro"}</h2>
                  <p>{activeModule === "pagos" ? "Úsalo solo para ajustes especiales. Los pagos mensuales se generan desde cada arriendo activo." : "Completa los campos principales del módulo."}</p>
                </div>
              </div>
              {pendingRentalDraft && ["arrendatarios", "arriendos", "pagos"].includes(activeModule) && (
                <div className="conversion-helper">
                  <strong>Registro desde solicitud #{pendingRentalDraft.solicitudId}</strong>
                  <span>
                    {activeModule === "arrendatarios"
                      ? "Completa los datos legales del cliente. Al guardar se formaliza la solicitud completa."
                      : activeModule === "arriendos"
                        ? `Confirma el arriendo de ${pendingRentalDraft.habitacionLabel}.`
                        : "Revisa el pago inicial antes de guardarlo."}
                  </span>
                </div>
              )}
              <div className="form-grid">
                {config.fields.map((field) => (
                  <label className={field.span ? "span-2" : ""} key={field.name}>
                    {field.label}
                    {field.type === "textarea" ? (
                      <textarea
                        maxLength={field.maxLength}
                        minLength={field.minLength}
                        required={field.required}
                        title={field.title}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                      >
                        {field.options.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : field.type === "select-remote" ? (
                      <select
                        required={field.required}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                      >
                        <option value="">Seleccione...</option>
                        {lookups[field.source].map((item) => (
                          <option key={item.id} value={item.id}>
                            {getLabel(field.source, item.id, lookups)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        inputMode={field.inputMode}
                        maxLength={field.maxLength}
                        min={field.min ?? (field.type === "number" ? "0" : undefined)}
                        minLength={field.minLength}
                        pattern={field.pattern}
                        readOnly={field.readOnly}
                        required={field.required}
                        type={field.type || "text"}
                        step={field.step ?? (field.type === "number" ? "0.01" : undefined)}
                        title={field.title}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">{editingId ? "Guardar cambios" : "Guardar registro"}</button>
                {(editingId || ["pagos", "arrendatarios"].includes(activeModule)) && <button className="ghost-button" type="button" onClick={resetForm}>Cancelar</button>}
              </div>
            </form>
          )}

          <section className={`list-panel ${activeModule === "habitaciones" ? "rooms-dashboard-panel" : ""} ${activeModule === "arrendatarios" ? "tenants-dashboard-panel" : ""} ${activeModule === "arriendos" ? "rentals-dashboard-panel" : ""}`}>
            <div className="panel-header">
              <div>
                <h2>
                  {activeModule === "inventario"
                    ? "Inventario por habitación"
                    : activeModule === "solicitudes"
                      ? "Bandeja de solicitudes"
                      : activeModule === "pagos"
                        ? "Control de cobros"
                        : `${config.title} registrados`}
                </h2>
                <p>
                  {loading
                    ? "Cargando..."
                    : activeModule === "inventario"
                      ? `${inventoryGroups.length} habitaciones, ${records.length} bienes registrados`
                      : activeModule === "pagos"
                        ? `${paymentSummary.pending} pendientes, ${paymentSummary.late} vencidos y ${paymentSummary.paid} pagados`
                        : `${records.length} registros encontrados`}
                </p>
              </div>
            </div>
            {activeModule === "solicitudes" && (
              <div className="review-workflow-note">
                <strong>Flujo del negocio</strong>
                <div className="workflow-steps">
                  <span>1. Revisar solicitud</span>
                  <span>2. Aprobar o rechazar</span>
                  <span>3. Confirmar pago inicial</span>
                  <span>4. Formalizar arriendo</span>
                </div>
              </div>
            )}
            {["arrendatarios", "pagos"].includes(activeModule) && formalizationRequests.length > 0 && (
              <div className="formalization-queue">
                <div className="formalization-queue-head">
                  <div>
                    <strong>
                      {activeModule === "arrendatarios"
                        ? "Solicitudes listas para formalizar"
                        : "Arriendos pendientes de formalizar"}
                    </strong>
                    <span>
                      {activeModule === "arrendatarios"
                        ? "Completa los datos legales del cliente. Al guardar se creará el arriendo y el pago inicial."
                        : "Estas solicitudes ya están aprobadas y pagadas, pero todavía no tienen arriendo activo."}
                    </span>
                  </div>
                  <b>{formalizationRequests.length}</b>
                </div>

                <div className="formalization-cards">
                  {formalizationRequests.map((solicitud) => (
                    <article className="formalization-card" key={solicitud.id}>
                      <div>
                        <small>Solicitud #{solicitud.id}</small>
                        <h3>{solicitud.nombres || "Cliente sin nombre"}</h3>
                      </div>
                      <div className="formalization-meta">
                        <span><b>Habitación</b>{getLabel("habitaciones", solicitud.habitacion, lookups)}</span>
                        <span><b>Teléfono</b>{solicitud.telefono || "Sin teléfono"}</span>
                        <span><b>Pago</b>{paymentMethodLabels[solicitud.metodo_pago] || "Sin seleccionar"}</span>
                        <span><b>Estado</b>{paymentStatusLabels[solicitud.estado_pago] || "Sin seleccionar"}</span>
                      </div>
                      <button type="button" onClick={() => prepareRentalFromSolicitud(solicitud)}>
                        Formalizar
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}
            {activeModule === "habitaciones" ? (
              <div className="room-floor-view">
                {roomGroups.map((group) => (
                  <section className="room-floor-group" key={group.key}>
                    <div className="room-floor-header">
                      <div className="room-floor-cover">
                        <img
                          alt={`${group.label} referencial`}
                          src={getRoomCoverImage(group.rooms[0])}
                        />
                        <span>{getRoomPhotoReference(group.rooms[0])}</span>
                      </div>
                      <div className="room-floor-main">
                        <p className="eyebrow">{group.range}</p>
                        <h3>{group.label}</h3>
                        <p>{getFloorDescription(group.key.replace("piso-", ""))}</p>
                        <div className="room-floor-services">
                          <span className="room-floor-price">{getRoomGroupPrice(group.rooms)}</span>
                          {getRoomGroupServices(group.rooms).map((service) => (
                            <span key={service}>{service}</span>
                          ))}
                        </div>
                      </div>
                      <div className="room-floor-stats" aria-label={`Resumen de ${group.label}`}>
                        <span><b>{group.rooms.length}</b> habitaciones</span>
                        <span className="available"><b>{group.disponibles}</b> disponibles</span>
                        <span className="occupied"><b>{group.ocupadas}</b> ocupadas</span>
                        <span className="maintenance"><b>{group.mantenimiento}</b> mantenimiento</span>
                      </div>
                    </div>

                    <div className="room-floor-grid">
                      {group.rooms.map((record) => (
                        <article className={`room-card-compact estado-${String(record.estado || "").toLowerCase()}`} key={record.id}>
                          <div className="room-card-top">
                            <strong>{record.codigo}</strong>
                            {record.estado && (
                              <span className={`status ${String(record.estado).toLowerCase()}`}>
                                {estadoLabels[record.estado] || record.estado}
                              </span>
                            )}
                          </div>
                          <div className="room-card-quick">
                            <span>
                              <small>Precio mensual</small>
                              <b>${record.precio_mensual}</b>
                            </span>
                            <span>
                              <small>Ubicación</small>
                              <b>{record.observaciones || group.label}</b>
                            </span>
                          </div>
                          <div className="room-actions">
                            <button type="button" onClick={() => openAdminRoomPhotos(record)}>Ver foto</button>
                            <button type="button" onClick={() => editRecord(record)}>Editar</button>
                            <button className="danger" type="button" onClick={() => deleteRecord(record.id)}>Eliminar</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
                {!loading && records.length === 0 && <div className="empty-state">No hay habitaciones registradas.</div>}
              </div>
            ) : activeModule === "inventario" ? (
              <div className="inventory-view">
                <div className="inventory-room-tabs" aria-label="Habitaciones con inventario">
                  {inventoryGroups.map((group) => (
                    <button
                      className={selectedInventoryGroup?.id === group.id ? "active" : ""}
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedInventoryRoomId(group.id)}
                    >
                      <strong>{group.label}</strong>
                      <span>{group.totalItems} bienes · {group.totalUnits} unidades</span>
                    </button>
                  ))}
                </div>

                {selectedInventoryGroup ? (
                  <div className="inventory-detail">
                    <div className="inventory-room-summary">
                      <div>
                        <p className="eyebrow">Habitación seleccionada</p>
                        <h3>{selectedInventoryGroup.label}</h3>
                      </div>
                      <div className="inventory-summary-values">
                        <span><b>{selectedInventoryGroup.totalItems}</b> bienes</span>
                        <span><b>{selectedInventoryGroup.totalUnits}</b> unidades</span>
                        <span><b>{selectedInventoryGroup.damagedItems}</b> por revisar</span>
                      </div>
                    </div>

                    <div className="inventory-items-grid">
                      {selectedInventoryGroup.items.map((record) => (
                        <article className="inventory-item-card" key={record.id}>
                          <div className="inventory-item-header">
                            <div>
                              <strong>{record.nombre_bien}</strong>
                              <small>Registro #{record.id}</small>
                            </div>
                            {record.estado && (
                              <span className={`status ${String(record.estado).toLowerCase()}`}>
                                {estadoLabels[record.estado] || record.estado}
                              </span>
                            )}
                          </div>
                          <div className="inventory-item-meta">
                            <span><b>Cantidad:</b> {record.cantidad}</span>
                            <span><b>Estado:</b> {estadoLabels[record.estado] || record.estado}</span>
                          </div>
                          {record.descripcion && <p>{record.descripcion}</p>}
                          {record.observaciones && <small>{record.observaciones}</small>}
                          <div className="room-actions">
                            <button type="button" onClick={() => editRecord(record)}>Editar</button>
                            <button className="danger" type="button" onClick={() => deleteRecord(record.id)}>Eliminar</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  !loading && <div className="empty-state">No hay inventario registrado todavía.</div>
                )}
              </div>
            ) : activeModule === "arrendatarios" ? (
              <div className="tenant-board">
                {records.map((record) => {
                  const activeRentals = getTenantActiveRentals(record);
                  return (
                    <article className={`tenant-card estado-${String(record.estado || "").toLowerCase()}`} key={record.id}>
                      <div className="tenant-card-header">
                        <div className="tenant-avatar" aria-hidden="true">{getTenantInitials(record)}</div>
                        <div>
                          <small>Arrendatario #{record.id}</small>
                          <h3>{`${record.nombres || ""} ${record.apellidos || ""}`.trim() || "Cliente sin nombre"}</h3>
                        </div>
                        {record.estado && (
                          <span className={`status ${String(record.estado).toLowerCase()}`}>
                            {estadoLabels[record.estado] || record.estado}
                          </span>
                        )}
                      </div>

                      <div className="tenant-card-grid">
                        <span><b>Cédula</b>{record.cedula || "Sin registrar"}</span>
                        <span><b>Teléfono</b>{record.telefono || "Sin registrar"}</span>
                        <span><b>Correo</b>{record.correo || "Sin registrar"}</span>
                        <span>
                          <b>Arriendo activo</b>
                          {activeRentals.length
                            ? activeRentals.map((arriendo) => getLabel("habitaciones", arriendo.habitacion, lookups)).join(", ")
                            : "Sin arriendo activo"}
                        </span>
                      </div>

                      {record.contacto_emergencia && (
                        <div className="tenant-notes">
                          <span><b>Contacto de emergencia</b>{record.contacto_emergencia}</span>
                        </div>
                      )}

                      <div className="tenant-card-actions">
                        <button type="button" onClick={() => editRecord(record)}>Editar datos</button>
                        <button className="danger" type="button" onClick={() => deleteRecord(record.id)}>Eliminar</button>
                      </div>
                    </article>
                  );
                })}
                {!loading && records.length === 0 && (
                  <div className="empty-state request-empty-state">
                    <strong>No hay arrendatarios registrados</strong>
                    <span>Cuando formalices una solicitud aprobada y pagada, el cliente aparecerá aquí con sus datos legales y su arriendo activo.</span>
                    <div className="empty-state-actions">
                      <button className="primary-button" type="button" onClick={() => setManualTenantFormOpen(true)}>Registrar arrendatario</button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeModule === "arriendos" ? (
              <div className="rental-board">
                {records.map((record) => {
                  const payments = getRentalPayments(record);
                  const nextPayment = getRentalNextPayment(record);
                  const lastPayment = getRentalLastPayment(record);
                  const paidCount = payments.filter((pago) => pago.estado === "PAGADO").length;
                  const pendingCount = payments.filter((pago) => pago.estado !== "PAGADO").length;
                  return (
                    <article className={`rental-card estado-${String(record.estado || "").toLowerCase()}`} key={record.id}>
                      <div className="rental-card-head">
                        <div>
                          <small>Arriendo #{record.id}</small>
                          <h3>{getLabel("habitaciones", record.habitacion, lookups)}</h3>
                          <span>{getLabel("arrendatarios", record.arrendatario, lookups)}</span>
                        </div>
                        {record.estado && (
                          <span className={`status ${String(record.estado).toLowerCase()}`}>
                            {estadoLabels[record.estado] || record.estado}
                          </span>
                        )}
                      </div>

                      <div className="rental-progress">
                        <strong>{nextPayment ? "Próximo cobro" : "Pagos al día"}</strong>
                        <span>
                          {nextPayment
                            ? `${nextPayment.periodo} · vence ${formatDate(nextPayment.fecha_vencimiento)}`
                            : lastPayment
                              ? `Último pago registrado: ${formatDate(lastPayment.fecha_pago || lastPayment.fecha_vencimiento)}`
                              : "Aún no hay pagos registrados para este arriendo."}
                        </span>
                      </div>

                      <div className="rental-card-grid">
                        <span><b>Fecha de inicio</b>{formatDate(record.fecha_inicio)}</span>
                        <span><b>Fecha de fin</b>{record.fecha_fin ? formatDate(record.fecha_fin) : "Sin finalizar"}</span>
                        <span><b>Valor mensual</b>{formatCell("monto", record.valor_mensual, lookups)}</span>
                        <span><b>Pagos</b>{paidCount} pagados · {pendingCount} pendientes</span>
                      </div>

                      {record.observaciones && <p>{record.observaciones}</p>}

                      <div className="rental-card-actions">
                        <button type="button" onClick={() => changeModule("pagos")}>Controlar pagos</button>
                        <button type="button" onClick={() => editRecord(record)}>Editar contrato</button>
                        <button className="danger" type="button" onClick={() => deleteRecord(record.id)}>Eliminar</button>
                      </div>
                    </article>
                  );
                })}
                {!loading && records.length === 0 && (
                  <div className="empty-state request-empty-state">
                    <strong>No hay arriendos registrados</strong>
                    <span>Cuando formalices una solicitud aprobada y pagada, el arriendo activo aparecerá aquí con su control mensual.</span>
                    <div className="empty-state-actions">
                      <button className="primary-button" type="button" onClick={() => setManualRentalFormOpen(true)}>Registrar arriendo</button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeModule === "pagos" ? (
              <div className="payments-board">
                {records
                  .slice()
                  .sort((a, b) => {
                    if (a.estado === "PAGADO" && b.estado !== "PAGADO") return 1;
                    if (a.estado !== "PAGADO" && b.estado === "PAGADO") return -1;
                    return (parseLocalDate(a.fecha_vencimiento) || new Date(8640000000000000)) - (parseLocalDate(b.fecha_vencimiento) || new Date(8640000000000000));
                  })
                  .map((record) => {
                    const timeline = getPaymentTimeline(record);
                    const context = getPaymentContext(record);
                    return (
                      <article className={`payment-admin-card payment-${timeline.tone}`} key={record.id}>
                        <div className="payment-admin-head">
                          <div>
                            <small>Pago #{record.id}</small>
                            <h3>{record.periodo}</h3>
                          </div>
                          <span className={`status ${String(record.estado || "").toLowerCase()}`}>{estadoLabels[record.estado] || record.estado}</span>
                        </div>

                        <div className="payment-alert-line">
                          <strong>{timeline.title}</strong>
                          <span>{timeline.detail}</span>
                        </div>

                        <div className="payment-admin-grid">
                          <span><b>Cliente</b>{context.arrendatario}</span>
                          <span><b>Habitación</b>{context.habitacion}</span>
                          <span><b>Monto</b>{formatCell("monto", record.monto, lookups)}</span>
                          <span><b>Fecha límite</b>{formatDate(record.fecha_vencimiento)}</span>
                          <span><b>Fecha de pago</b>{record.fecha_pago ? formatDate(record.fecha_pago) : "Pendiente"}</span>
                          <span><b>Forma de pago</b>{record.metodo_pago || "Sin registrar"}</span>
                        </div>

                        {(record.referencia_pago || record.comprobante_pago || record.observaciones_cliente || record.observaciones) && (
                          <div className="payment-proof-summary">
                            <div>
                              <strong>Respaldo del pago</strong>
                              <span>{record.referencia_pago || "Sin referencia registrada"}</span>
                              {record.observaciones_cliente && <p>{record.observaciones_cliente}</p>}
                              {record.observaciones && <p>{record.observaciones}</p>}
                            </div>
                            {record.comprobante_pago ? (
                              <a href={resolveMediaUrl(record.comprobante_pago)} target="_blank" rel="noreferrer">Ver comprobante</a>
                            ) : (
                              <span>Sin comprobante</span>
                            )}
                          </div>
                        )}

                        <div className="payment-admin-actions">
                          {record.estado === "PAGADO" ? (
                            <button className="reject" type="button" onClick={() => updatePagoEstado(record, "PENDIENTE")}>Marcar pendiente</button>
                          ) : (
                            <button className="approve" type="button" onClick={() => updatePagoEstado(record, "PAGADO")}>Registrar pago</button>
                          )}
                          <button type="button" onClick={() => copyPaymentReminder(record)}>Copiar aviso</button>
                          <button type="button" onClick={() => editRecord(record)}>Corregir</button>
                          <button className="danger" type="button" onClick={() => deleteRecord(record.id)}>Eliminar</button>
                        </div>
                      </article>
                    );
                  })}
                {!loading && records.length === 0 && <div className="empty-state">No hay pagos registrados todavía.</div>}
              </div>
            ) : activeModule === "garantias" ? (
              <div className="payments-board guarantees-board">
                <div className="business-rule-card">
                  <strong>Regla de negocio</strong>
                  <span>La garantía se registra al iniciar el arriendo, queda retenida como respaldo y solo se cierra cuando se devuelve al cliente o se usa por daños.</span>
                </div>
                {records
                  .slice()
                  .sort((a, b) => String(a.estado).localeCompare(String(b.estado)))
                  .map((record) => {
                    const timeline = getGuaranteeTimeline(record);
                    const context = getArriendoContext(record.arriendo);
                    return (
                      <article className={`payment-admin-card guarantee-admin-card payment-${timeline.tone}`} key={record.id}>
                        <div className="payment-admin-head">
                          <div>
                            <small>Garantía #{record.id}</small>
                            <h3>{context.habitacion}</h3>
                          </div>
                          <span className={`status ${String(record.estado || "").toLowerCase()}`}>{estadoLabels[record.estado] || record.estado}</span>
                        </div>

                        <div className="payment-alert-line">
                          <strong>{timeline.title}</strong>
                          <span>{timeline.detail}</span>
                        </div>

                        <details className="record-details">
                          <summary>Ver datos</summary>
                          <div className="payment-admin-grid">
                            <span><b>Arrendatario</b>{context.arrendatario}</span>
                            <span><b>Habitación</b>{context.habitacion}</span>
                            <span><b>Monto</b>{formatCell("monto", record.monto, lookups)}</span>
                            <span><b>Fecha entrega</b>{formatDate(record.fecha_entrega)}</span>
                            <span><b>Fecha devolución</b>{record.fecha_devolucion ? formatDate(record.fecha_devolucion) : "Aún no registra"}</span>
                            <span><b>Estado</b>{estadoLabels[record.estado] || record.estado}</span>
                          </div>
                          {record.observaciones && <p>{record.observaciones}</p>}
                        </details>

                        <div className="payment-admin-actions">
                          {record.estado === "RETENIDA" ? (
                            <>
                              <button className="approve" type="button" onClick={() => updateGarantiaEstado(record, "DEVUELTA")}>Devolver</button>
                              <button className="reject" type="button" onClick={() => updateGarantiaEstado(record, "USADA_POR_DANOS")}>Usar por daños</button>
                            </>
                          ) : (
                            <button className="reject" type="button" onClick={() => updateGarantiaEstado(record, "RETENIDA")}>Marcar retenida</button>
                          )}
                          <button type="button" onClick={() => editRecord(record)}>Corregir</button>
                          <button className="danger" type="button" onClick={() => deleteRecord(record.id)}>Eliminar</button>
                        </div>
                      </article>
                    );
                  })}
                {!loading && records.length === 0 && <div className="empty-state">No hay garantías registradas todavía.</div>}
              </div>
            ) : (
            <div className="room-list">
              {records.map((record) => (
                <article className={`room-row ${activeModule === "solicitudes" ? "request-admin-row" : ""} estado-${String(record.estado || "").toLowerCase()}`} key={record.id}>
                  <div>
                    {activeModule === "solicitudes" ? (
                      <div className="request-admin-main">
                        <div className="request-admin-heading">
                          <div>
                            <small>Solicitud #{record.id}</small>
                            <strong>{record.nombres || "-"}</strong>
                          </div>
                          {record.estado && <span className={`status ${String(record.estado).toLowerCase()}`}>{estadoLabels[record.estado] || record.estado}</span>}
                        </div>

                        <div className="request-admin-meta">
                          <span><b>Teléfono</b>{record.telefono || "Sin teléfono"}</span>
                          <span><b>Correo</b>{record.correo || "Sin correo"}</span>
                          <span><b>Habitación</b>{getLabel("habitaciones", record.habitacion, lookups)}</span>
                          <span><b>Mensaje</b>{record.mensaje || "Sin mensaje"}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                      <div className="room-title">
                        <strong>#{record.id}</strong>
                        {record.estado && <span className={`status ${String(record.estado).toLowerCase()}`}>{estadoLabels[record.estado] || record.estado}</span>}
                      </div>
                      <div className="record-fields">
                        {config.columns.map((column) => (
                          <span key={column}>
                            <b>{formatColumnLabel(column)}:</b> {formatCell(column, record[column], lookups)}
                          </span>
                        ))}
                      </div>
                      </>
                    )}
                    {record.descripcion && <p>{record.descripcion}</p>}
                    {record.observaciones && <small>{record.observaciones}</small>}
                    {activeModule === "solicitudes" && (
                      <div className={`admin-payment-review ${record.estado === "RECHAZADA" ? "history" : ""}`}>
                        <div>
                          <strong>{record.estado === "RECHAZADA" ? "Historial de pago" : "Pago del cliente"}</strong>
                          <span>
                            {record.estado === "RECHAZADA"
                              ? "Reserva rechazada. El comprobante queda guardado solo como respaldo."
                              : `${paymentMethodLabels[record.metodo_pago] || "Sin seleccionar"} · ${paymentStatusLabels[record.estado_pago] || "Sin seleccionar"}`}
                          </span>
                        </div>
                        <div className="admin-payment-meta">
                          {record.referencia_pago && <span><b>Referencia</b>{record.referencia_pago}</span>}
                          {record.observaciones_pago && <span><b>Observación</b>{record.observaciones_pago}</span>}
                          {record.comprobante_pago && (
                            <a href={resolveMediaUrl(record.comprobante_pago)} target="_blank" rel="noreferrer">
                              Ver comprobante
                            </a>
                          )}
                        </div>
                        {record.estado === "APROBADA" && record.estado_pago !== "CONFIRMADO" && record.metodo_pago !== "SIN_SELECCIONAR" && (
                          <div className="payment-checklist" aria-label="Puntos de revisión">
                            <span>Valor</span>
                            <span>Fecha</span>
                            <span>Cuenta</span>
                            <span>Referencia</span>
                          </div>
                        )}
                      </div>
                    )}
                    {activeModule === "solicitudes" && record.estado === "APROBADA" && record.estado_pago === "CONFIRMADO" && !isSolicitudFormalized(record) && (
                      <div className="rental-next-step">
                        <div>
                          <strong>Siguiente paso</strong>
                          <span>La solicitud ya está aprobada y pagada. Formaliza para crear arrendatario, arriendo activo y pago inicial registrado.</span>
                        </div>
                        <button type="button" onClick={() => prepareRentalFromSolicitud(record)}>Formalizar</button>
                      </div>
                    )}
                  </div>
                  <div className="room-actions">
                    {activeModule === "solicitudes" && record.estado === "PENDIENTE" && (
                      <>
                        <button className="approve" type="button" onClick={() => updateSolicitudEstado(record, "APROBADA")}>Aprobar</button>
                        <button className="reject" type="button" onClick={() => updateSolicitudEstado(record, "RECHAZADA")}>Rechazar</button>
                      </>
                    )}
                    {activeModule === "solicitudes" && record.estado === "APROBADA" && record.metodo_pago !== "SIN_SELECCIONAR" && (
                      record.estado_pago === "CONFIRMADO" ? (
                        <button className="reject" type="button" onClick={() => updateSolicitudPago(record, "PENDIENTE")}>Marcar pendiente</button>
                      ) : (
                        <button className="approve" type="button" onClick={() => updateSolicitudPago(record, "CONFIRMADO")}>Confirmar pago</button>
                      )
                    )}
                    {activeModule === "solicitudes" && record.estado === "APROBADA" && (
                      <button className="reject" type="button" onClick={() => updateSolicitudEstado(record, "RECHAZADA")}>Rechazar reserva</button>
                    )}
                    {activeModule !== "solicitudes" && (
                      <button type="button" onClick={() => editRecord(record)}>Editar</button>
                    )}
                    <button className="danger" type="button" onClick={() => deleteRecord(record.id)}>Eliminar</button>
                  </div>
                </article>
              ))}
              {!loading && records.length === 0 && (
                activeModule === "solicitudes" ? (
                  <div className="empty-state request-empty-state">
                    <strong>No hay solicitudes nuevas</strong>
                    <span>Cuando un cliente envíe una solicitud desde la página pública, aparecerá aquí para revisar, aprobar, confirmar el pago y formalizar el arriendo.</span>
                    <div className="empty-state-actions">
                      <button className="primary-button" type="button" onClick={() => loadModule()}>Actualizar bandeja</button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">No hay registros en este módulo.</div>
                )
              )}
            </div>
            )}
          </section>
        </section>
      </section>

      {activeModule === "arrendatarios" && (manualTenantFormOpen || editingId || pendingRentalDraft) && (
        <div className="modal-backdrop" onClick={resetForm}>
          <section className="solicitud-modal admin-tenant-modal" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Cerrar formulario de arrendatario"
              className="modal-close-button room-detail-close"
              title="Cerrar"
              type="button"
              onClick={resetForm}
            >
              X
            </button>
            <div className="panel-header modal-header">
              <div>
                <p className="eyebrow">{pendingRentalDraft ? "Formalizar solicitud" : editingId ? "Editar arrendatario" : "Nuevo arrendatario"}</p>
                <h2>{editingId ? "Corregir datos del arrendatario" : "Registrar arrendatario"}</h2>
                <p>
                  {pendingRentalDraft
                    ? "Completa los datos legales del cliente para crear el arriendo y su control de pagos."
                    : "Actualiza solo los datos personales necesarios para la administración del arriendo."}
                </p>
              </div>
            </div>

            {pendingRentalDraft && (
              <div className="admin-tenant-modal-note">
                <strong>Registro desde solicitud #{pendingRentalDraft.solicitudId}</strong>
                <span>{pendingRentalDraft.habitacionLabel} · Pago inicial confirmado</span>
              </div>
            )}

            <form className="admin-tenant-form" onSubmit={saveRecord}>
              <div className="form-grid">
                {config.fields.map((field) => (
                  <label className={field.span ? "span-2" : ""} key={field.name}>
                    {field.label}
                    {field.type === "textarea" ? (
                      <textarea
                        maxLength={field.maxLength}
                        minLength={field.minLength}
                        required={field.required}
                        title={field.title}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                      >
                        {field.options.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        inputMode={field.inputMode}
                        maxLength={field.maxLength}
                        min={field.min ?? (field.type === "number" ? "0" : undefined)}
                        minLength={field.minLength}
                        pattern={field.pattern}
                        readOnly={field.readOnly}
                        required={field.required}
                        step={field.step ?? (field.type === "number" ? "0.01" : undefined)}
                        title={field.title}
                        type={field.type || "text"}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">{editingId ? "Guardar cambios" : "Guardar arrendatario"}</button>
                <button className="ghost-button" type="button" onClick={resetForm}>Cancelar</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {activeModule === "arriendos" && (manualRentalFormOpen || editingId || pendingRentalDraft) && (
        <div className="modal-backdrop" onClick={resetForm}>
          <section className="solicitud-modal admin-rental-modal" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Cerrar formulario de arriendo"
              className="modal-close-button room-detail-close"
              title="Cerrar"
              type="button"
              onClick={resetForm}
            >
              X
            </button>
            <div className="panel-header modal-header">
              <div>
                <p className="eyebrow">{pendingRentalDraft ? "Formalizar arriendo" : editingId ? "Editar arriendo" : "Nuevo arriendo"}</p>
                <h2>{editingId ? "Corregir contrato de arriendo" : "Registrar arriendo"}</h2>
                <p>Define el cliente, la habitación, la fecha de inicio y el valor mensual que usará el control de pagos.</p>
              </div>
            </div>

            {pendingRentalDraft && (
              <div className="admin-tenant-modal-note">
                <strong>Registro desde solicitud #{pendingRentalDraft.solicitudId}</strong>
                <span>{pendingRentalDraft.habitacionLabel} · Pago inicial confirmado</span>
              </div>
            )}

            <form className="admin-rental-form" onSubmit={saveRecord}>
              <div className="form-grid">
                {config.fields.map((field) => (
                  <label className={field.span ? "span-2" : ""} key={field.name}>
                    {field.label}
                    {field.type === "textarea" ? (
                      <textarea
                        maxLength={field.maxLength}
                        minLength={field.minLength}
                        required={field.required}
                        title={field.title}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                      >
                        {field.options.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : field.type === "select-remote" ? (
                      <select
                        required={field.required}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                      >
                        <option value="">Seleccione...</option>
                        {lookups[field.source].map((item) => (
                          <option key={item.id} value={item.id}>
                            {getLabel(field.source, item.id, lookups)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        inputMode={field.inputMode}
                        maxLength={field.maxLength}
                        min={field.min ?? (field.type === "number" ? "0" : undefined)}
                        minLength={field.minLength}
                        pattern={field.pattern}
                        readOnly={field.readOnly}
                        required={field.required}
                        step={field.step ?? (field.type === "number" ? "0.01" : undefined)}
                        title={field.title}
                        type={field.type || "text"}
                        value={form[field.name] ?? ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">{editingId ? "Guardar cambios" : "Guardar arriendo"}</button>
                <button className="ghost-button" type="button" onClick={resetForm}>Cancelar</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {adminRoomModal && activeModule === "habitaciones" && (
        <div className="modal-backdrop" onClick={adminRoomModal.mode === "edit" ? resetForm : () => setAdminRoomModal(null)}>
          <section className="solicitud-modal admin-room-modal" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Cerrar ventana de habitación"
              className="modal-close-button room-detail-close"
              title="Cerrar"
              type="button"
              onClick={adminRoomModal.mode === "edit" ? resetForm : () => setAdminRoomModal(null)}
            >
              X
            </button>

            <div className="panel-header modal-header">
              <div>
                <p className="eyebrow">{adminRoomModal.mode === "edit" ? "Editar habitación" : "Fotos de habitación"}</p>
                <h2>Habitación {adminRoomModal.room.codigo}</h2>
                <p>{getRoomPhotoReference(adminRoomModal.room)}</p>
              </div>
            </div>

            {adminRoomModal.mode === "edit" ? (
              <form className="admin-room-edit-layout" onSubmit={saveRecord}>
                <div className="admin-room-photo-panel">
                  <img
                    alt={`Habitación ${adminRoomModal.room.codigo}`}
                    src={getRoomGalleryImages(adminRoomModal.room)[adminRoomPhotoIndex] || getRoomCoverImage(adminRoomModal.room)}
                  />
                  <div className="room-photo-thumbnails">
                    {getRoomGalleryImages(adminRoomModal.room).slice(0, 4).map((image, index) => (
                      <button
                        aria-label={`Ver foto ${index + 1}`}
                        className={index === adminRoomPhotoIndex ? "active" : ""}
                        key={image}
                        type="button"
                        onClick={() => setAdminRoomPhotoIndex(index)}
                      >
                        <img alt={`Miniatura ${index + 1}`} src={image} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-room-edit-form">
                  <div className="form-grid">
                    {config.fields.map((field) => (
                      <label className={field.span ? "span-2" : ""} key={field.name}>
                        {field.label}
                        {field.type === "textarea" ? (
                          <textarea
                            maxLength={field.maxLength}
                            minLength={field.minLength}
                            required={field.required}
                            title={field.title}
                            value={form[field.name] ?? ""}
                            onChange={(event) => updateField(field.name, event.target.value)}
                            placeholder={field.placeholder || ""}
                          />
                        ) : field.type === "select" ? (
                          <select
                            required={field.required}
                            value={form[field.name] ?? ""}
                            onChange={(event) => updateField(field.name, event.target.value)}
                          >
                            {field.options.map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            inputMode={field.inputMode}
                            maxLength={field.maxLength}
                            min={field.min ?? (field.type === "number" ? "0" : undefined)}
                            minLength={field.minLength}
                            pattern={field.pattern}
                            readOnly={field.readOnly}
                            required={field.required}
                            step={field.step ?? (field.type === "number" ? "0.01" : undefined)}
                            title={field.title}
                            type={field.type || "text"}
                            value={form[field.name] ?? ""}
                            onChange={(event) => updateField(field.name, event.target.value)}
                            placeholder={field.placeholder || ""}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="form-actions">
                    <button className="primary-button" type="submit">Guardar cambios</button>
                    <button className="ghost-button" type="button" onClick={resetForm}>Cancelar</button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="admin-room-photo-view">
                <button
                  className="room-main-photo"
                  type="button"
                  onClick={() => setAdminRoomPhotoIndex((current) => (current + 1) % getRoomGalleryImages(adminRoomModal.room).length)}
                >
                  <img
                    alt={`Habitación ${adminRoomModal.room.codigo}`}
                    src={getRoomGalleryImages(adminRoomModal.room)[adminRoomPhotoIndex] || getRoomCoverImage(adminRoomModal.room)}
                  />
                  <span>Cambiar foto</span>
                </button>

                <div className="room-photo-thumbnails">
                  {getRoomGalleryImages(adminRoomModal.room).map((image, index) => (
                    <button
                      aria-label={`Ver foto ${index + 1}`}
                      className={index === adminRoomPhotoIndex ? "active" : ""}
                      key={image}
                      type="button"
                      onClick={() => setAdminRoomPhotoIndex(index)}
                    >
                      <img alt={`Miniatura ${index + 1}`} src={image} />
                    </button>
                  ))}
                </div>

                <div className="admin-room-photo-summary">
                  <span><b>Estado</b>{estadoLabels[adminRoomModal.room.estado] || adminRoomModal.room.estado}</span>
                  <span><b>Precio</b>${adminRoomModal.room.precio_mensual} / mes</span>
                  <span><b>Servicios</b>{adminRoomModal.room.servicios || "Servicios por confirmar"}</span>
                </div>

                <div className="form-actions">
                  <button className="primary-button" type="button" onClick={() => editRecord(adminRoomModal.room)}>Editar habitación</button>
                  <button className="ghost-button" type="button" onClick={() => setAdminRoomModal(null)}>Cerrar</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function App() {
  const [view, setView] = useState(() => (window.location.hash === "#admin" ? "admin" : "public"));

  useEffect(() => {
    function syncViewFromHash() {
      setView(window.location.hash === "#admin" ? "admin" : "public");
    }
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  function showPublicView() {
    window.history.replaceState(null, "", window.location.pathname);
    setView("public");
  }

  if (view === "admin") {
    return <AdminView onPublicClick={showPublicView} />;
  }

  return <PublicView />;
}

export default App;








