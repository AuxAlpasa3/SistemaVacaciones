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
import logoAlpasa from "../../assets/LogoCredencial.png";

interface CredencialData {
  idPersonal: string;
  nombreCompleto: string;
  noEmpleado: string;
  codigoQR: string;
}

interface CredencialPDFButtonProps {
  idPersonal: string;
  onSuccess?: (fileName: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  className?: string;
}

const ORANGE_COLOR = "#E85C0D";
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    position: "relative"
  },

  header: {
    backgroundColor: ORANGE_COLOR,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },

  logo: {
    width: 230,
    marginTop: 20,
    position: "absolute",
    alignSelf: "center",
    objectFit: "contain"
  },

  qrContainer: {
    marginTop: 20,
    alignItems: "center"
  },

  qrImage: {
    width: 330,
    height: 330
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: ORANGE_COLOR,
    paddingVertical: 20,
    alignItems: "center"
  },

  name: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase"
  },

  employee: {
    fontSize: 12, 
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 5
  }
});

interface CredencialPDFContentProps {
  data: CredencialData;
  qrBase64: string;
}

const CredencialPDFContent: React.FC<CredencialPDFContentProps> = ({
  data,
  qrBase64
}) => {
  return (
    <Document>
      <Page size={[310, 490]} style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
        </View>
            <Image src={logoAlpasa} style={styles.logo} />

        {/* QR */}
        <View style={styles.qrContainer}>
          <Image src={qrBase64} style={styles.qrImage} />
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.name}>{data.nombreCompleto}</Text>
          <Text style={styles.employee}>
            No. Empleado: {data.noEmpleado}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export const CredencialPDFButton: React.FC<CredencialPDFButtonProps> = ({
  idPersonal,
  onSuccess,
  onError,
  buttonText = "PDF",
  className = ""
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredencialData = async (
    id: string
  ): Promise<CredencialData> => {
    const response = await apiService.postForm<any>(
      "Empleados/GenerarCredencial.php",
      { IdPersonal: id }
    );

    if (!response.data) {
      throw new Error("Empleado no encontrado");
    }

    return {
      idPersonal: response.data.IdPersonal,
      nombreCompleto: response.data.NombreCompleto,
      noEmpleado: response.data.NoEmpleado,
      codigoQR: response.data.CodigoQR
    };
  };
  const handleGeneratePDF = async () => {
    if (!idPersonal) {
      const errorMsg = "No se proporcionó IdPersonal";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [ credencialData] = await Promise.all([
        fetchCredencialData(idPersonal)
      ]);

      // Generar QR en base64
      const qrBase64 = await QRCode.toDataURL(
        credencialData.codigoQR
      );

      // Crear PDF
      const blob = await pdf(
        <CredencialPDFContent
          data={credencialData}
          qrBase64={qrBase64}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `credencial_${credencialData.noEmpleado}_${credencialData.nombreCompleto.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onSuccess?.(`credencial_${credencialData.noEmpleado}_${credencialData.nombreCompleto.replace(/\s+/g, '_')}.pdf`);
    } catch (err: any) {
      const errorMsg =
        err.message || "Error al generar la credencial";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={loading || !idPersonal}
        className={className}
        style={{
          padding: "10px 20px",
          backgroundColor: loading ? "#ccc" : "#E85C0D",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor:
            loading || !idPersonal ? "not-allowed" : "pointer",
          fontWeight: "bold",
          opacity: loading || !idPersonal ? 0.7 : 1
        }}
      >
        {loading ? "Generando PDF..." : buttonText}
      </button>

      {error && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c00"
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default CredencialPDFButton;