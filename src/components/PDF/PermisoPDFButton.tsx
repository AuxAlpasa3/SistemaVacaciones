import React, { useState } from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
  pdf
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { apiService } from '../../api/apiService';
import { showToast } from '../../helpers/toast';
import logoAlpasa from "../../assets/LogoCredencial.png";

interface PermisoData {
  idPermiso: string;
  idProveedor: string;
  nombreProveedor: string;
  rfc: string;
  direccion: string;
  telefono: string;
  email: string;
  areaSolicita: string;
  motivoIngreso: string;
  fechaInicio: string;
  fechaFin: string;
  vigencia: string;
  codigoQR: string;
  fechaGeneracion: string;
  status: string;
}

interface PermisoPDFButtonProps {
  idPermiso: number;
  onSuccess?: (fileName: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  className?: string;
}

const ORANGE_COLOR = "#E85C0D";
const DARK_GRAY = "#333333";
const LIGHT_GRAY = "#f5f5f5";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: ORANGE_COLOR,
    paddingBottom: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: "auto",
    objectFit: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: ORANGE_COLOR,
    textAlign: "center",
    marginTop: 10,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 12,
    color: DARK_GRAY,
    textAlign: "center",
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: ORANGE_COLOR,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: ORANGE_COLOR,
    paddingLeft: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
    paddingVertical: 4,
  },
  label: {
    width: "35%",
    fontSize: 10,
    fontWeight: "bold",
    color: DARK_GRAY,
  },
  value: {
    width: "65%",
    fontSize: 10,
    color: DARK_GRAY,
  },
  qrContainer: {
    alignItems: "center",
    marginVertical: 20,
    padding: 15,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: ORANGE_COLOR,
    marginBottom: 10,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  qrCode: {
    fontSize: 8,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  vigenciaBox: {
    backgroundColor: "#FFF3E0",
    padding: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: ORANGE_COLOR,
    marginVertical: 10,
  },
  vigenciaText: {
    fontSize: 11,
    fontWeight: "bold",
    color: ORANGE_COLOR,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
  warningText: {
    fontSize: 9,
    color: ORANGE_COLOR,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 5,
  },
  twoColumnRow: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 10,
  },
  halfColumn: {
    flex: 1,
  },
});

interface PermisoPDFContentProps {
  data: PermisoData;
  qrBase64: string;
}

const PermisoPDFContent: React.FC<PermisoPDFContentProps> = ({
  data,
  qrBase64,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={logoAlpasa} style={styles.logo} />
          </View>
          <Text style={styles.title}>PERMISO DE ACCESO</Text>
          <Text style={styles.subtitle}>Voucher de Ingreso para Proveedores</Text>
        </View>

        {/* Información del Proveedor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL PROVEEDOR</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{data.nombreProveedor}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>RFC:</Text>
            <Text style={styles.value}>{data.rfc || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{data.direccion || "N/A"}</Text>
          </View>
          <View style={styles.twoColumnRow}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Teléfono:</Text>
              <Text style={styles.value}>{data.telefono || "N/A"}</Text>
            </View>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{data.email || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Información del Permiso */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL PERMISO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Número de Permiso:</Text>
            <Text style={styles.value}>{data.idPermiso}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Área Solicitante:</Text>
            <Text style={styles.value}>{data.areaSolicita || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Motivo de Ingreso:</Text>
            <Text style={styles.value}>{data.motivoIngreso}</Text>
          </View>
        </View>

        {/* Vigencia */}
        <View style={styles.vigenciaBox}>
          <Text style={styles.vigenciaText}>📅 PERÍODO DE VIGENCIA 📅</Text>
          <View style={styles.twoColumnRow}>
            <View style={styles.halfColumn}>
              <Text style={[styles.label, { textAlign: "center" }]}>
                Fecha de Inicio:
              </Text>
              <Text style={[styles.value, { textAlign: "center", fontWeight: "bold", color: ORANGE_COLOR }]}>
                {formatDate(data.fechaInicio)}
              </Text>
            </View>
            <View style={styles.halfColumn}>
              <Text style={[styles.label, { textAlign: "center" }]}>
                Fecha de Término:
              </Text>
              <Text style={[styles.value, { textAlign: "center", fontWeight: "bold", color: ORANGE_COLOR }]}>
                {formatDate(data.fechaFin)}
              </Text>
            </View>
          </View>
          {data.vigencia && (
            <View style={[styles.row, { marginTop: 10 }]}>
              <Text style={[styles.label, { width: "100%", textAlign: "center" }]}>
                Vigencia: {data.vigencia}
              </Text>
            </View>
          )}
        </View>

        {/* Código QR */}
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>🔐 CÓDIGO DE VERIFICACIÓN 🔐</Text>
          {qrBase64 && <Image src={qrBase64} style={styles.qrImage} />}
          <Text style={styles.qrCode}>Código: {data.codigoQR}</Text>
          <Text style={styles.warningText}>
            * Presentar este documento junto con identificación oficial *
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento generado el {formatDate(data.fechaGeneracion)}
          </Text>
          <Text style={styles.footerText}>
            Este permiso es válido únicamente dentro del período de vigencia establecido
          </Text>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} - Sistema de Control de Acceso para Proveedores
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export const PermisoPDFButton: React.FC<PermisoPDFButtonProps> = ({
  idPermiso,
  onSuccess,
  onError,
  buttonText = "Generar PDF QR",
  className = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermisoData = async (id: number): Promise<PermisoData> => {
    const response = await apiService.get<any>(
      `/proveedores/permisos/ObtenerPermisoParaPDF.php?idPermiso=${id}`
    );

    if (!response.status || !response.data) {
      throw new Error(response.message || "Permiso no encontrado");
    }

    const data = response.data;
    return {
      idPermiso: data.IdPermiso.toString(),
      idProveedor: data.IdProveedor.toString(),
      nombreProveedor: data.NombreProveedor,
      rfc: data.RFC || "",
      direccion: data.Direccion || "",
      telefono: data.Telefono || "",
      email: data.Email || "",
      areaSolicita: data.AreaSolicita || "",
      motivoIngreso: data.MotivoIngreso,
      fechaInicio: data.FechaInicio,
      fechaFin: data.FechaFin,
      vigencia: data.Vigencia || "",
      codigoQR: data.QR || "",
      fechaGeneracion: data.FechaGeneracionQR || new Date().toISOString(),
      status: data.Status,
    };
  };

  const generateUniqueQRCode = async (idPermiso: number): Promise<string> => {
    const response = await apiService.postForm<any>(
      "/proveedores/permisos/GenerarQRUnico.php",
      { IdPermiso: idPermiso }
    );

    if (!response.status || !response.data) {
      throw new Error(response.message || "Error al generar código QR");
    }

    return response.data.codigoQR;
  };

  const handleGeneratePDF = async () => {
    if (!idPermiso) {
      const errorMsg = "No se proporcionó ID de permiso";
      setError(errorMsg);
      onError?.(errorMsg);
      showToast({ text: errorMsg, type: "error", autoClose: 3000 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obtener datos del permiso
      let permisoData = await fetchPermisoData(idPermiso);

      // Si no tiene código QR, generar uno nuevo
      if (!permisoData.codigoQR) {
        const nuevoQR = await generateUniqueQRCode(idPermiso);
        permisoData.codigoQR = nuevoQR;
        permisoData.fechaGeneracion = new Date().toISOString();
        // Recargar datos para obtener el QR actualizado
        permisoData = await fetchPermisoData(idPermiso);
      }

      // Validar fechas de vigencia
      const fechaInicio = new Date(permisoData.fechaInicio);
      const fechaFin = new Date(permisoData.fechaFin);
      const hoy = new Date();

      if (fechaFin < hoy) {
        showToast({
          text: "Este permiso ha expirado. No se puede generar el documento.",
          type: "warning",
          autoClose: 5000,
        });
      }

      // Generar QR en base64 con información adicional
      const qrInfo = JSON.stringify({
        id: permisoData.idPermiso,
        proveedor: permisoData.nombreProveedor,
        codigo: permisoData.codigoQR,
        validoHasta: permisoData.fechaFin,
      });

      const qrBase64 = await QRCode.toDataURL(qrInfo, {
        width: 300,
        margin: 2,
        color: {
          dark: ORANGE_COLOR.replace("#", ""),
          light: "#FFFFFF",
        },
      });

      // Crear PDF
      const blob = await pdf(
        <PermisoPDFContent data={permisoData} qrBase64={qrBase64} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `permiso_${permisoData.idPermiso}_${permisoData.nombreProveedor.replace(
        /\s+/g,
        "_"
      )}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast({
        text: "PDF generado correctamente",
        type: "success",
        autoClose: 3000,
      });
      onSuccess?.(
        `permiso_${permisoData.idPermiso}_${permisoData.nombreProveedor.replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
    } catch (err: any) {
      const errorMsg = err.message || "Error al generar el permiso";
      setError(errorMsg);
      onError?.(errorMsg);
      showToast({ text: errorMsg, type: "error", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={loading || !idPermiso}
        className={className}
        style={{
          padding: "8px 16px",
          backgroundColor: loading ? "#ccc" : ORANGE_COLOR,
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading || !idPermiso ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: "12px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          opacity: loading || !idPermiso ? 0.7 : 1,
        }}
      >
        {loading ? "Generando PDF..." : buttonText}
      </button>

      {error && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c00",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default PermisoPDFButton;