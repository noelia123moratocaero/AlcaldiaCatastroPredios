import { useState, useEffect } from "react";
import { fetchTransacciones } from "../../service/transaccionService";
import * as XLSX from "xlsx"; // Para exportar Excel
import jsPDF from "jspdf"; // Para exportar PDF
import "jspdf-autotable"; // Tabla para PDF
import { Container, Title, FilterContainer, Button, TransaccionesTable } from "./stylesDashboard/styleTransacciones";

const Transacciones = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [filtros, setFiltros] = useState({ fechaInicio: "", fechaFin: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar transacciones cuando los filtros cambien
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        if (filtros.fechaInicio && filtros.fechaFin && new Date(filtros.fechaInicio) > new Date(filtros.fechaFin)) {
          setError("La fecha de inicio no puede ser mayor que la fecha de fin.");
          return;
        }
        const data = await fetchTransacciones(filtros.fechaInicio, filtros.fechaFin);
        setTransacciones(data);
      } catch (error) {
        console.error("Error al cargar transacciones:", error);
        setError("Error al cargar las transacciones.");
      } finally {
        setLoading(false);
      }
    };


    loadData();
  }, [filtros]);


  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
  };

  const limpiarFiltros = () => {
    setFiltros({ fechaInicio: "", fechaFin: "" });
  };

  const exportarExcel = () => {
    const data = transacciones.map((t) => ({
      Fecha: new Date(t.FechaHora).toLocaleString(),
      Usuario: t.NombreUsuario || "Usuario Desconocido",
      Acción: t.TipoAccion,
      Descripción: t.Descripcion,
      "Entidad Afectada": t.EntidadAfectada,
      "ID Entidad": t.IDEntidadAfectada,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");
    XLSX.writeFile(workbook, "reporte_transacciones.xlsx");
  };


  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Transacciones", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);

    const headers = [["Fecha", "Usuario", "Acción", "Descripción", "Entidad Afectada", "ID Entidad"]];
    const data = transacciones.map((t) => [
      new Date(t.FechaHora).toLocaleString(),
      t.NombreUsuario || "Usuario Desconocido",
      t.TipoAccion,
      t.Descripcion,
      t.EntidadAfectada || "",
      t.IDEntidadAfectada?.toString() || "",
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      startY: 40,
      styles: { fontSize: 8 },
    });

    doc.save("reporte_transacciones.pdf");
  };

  return (
    <Container>
      <Title>Reporte de Transacciones</Title>
      <FilterContainer>
        <input
          type="date"
          name="fechaInicio"
          value={filtros.fechaInicio}
          onChange={handleFiltroChange}
        />
        <input
          type="date"
          name="fechaFin"
          value={filtros.fechaFin}
          onChange={handleFiltroChange}
        />
        <Button onClick={limpiarFiltros}>Limpiar</Button>
      </FilterContainer>
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <FilterContainer>
            <Button onClick={exportarExcel}>Exportar a Excel</Button>
            <Button onClick={exportarPDF}>Exportar a PDF</Button>
          </FilterContainer>
          <TransaccionesTable>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Descripción</th>
                <th>Entidad Afectada</th>
                <th>ID Entidad</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.map((t) => (
                <tr key={t.IDTransaccion}>
                  <td>{new Date(t.FechaHora).toLocaleString()}</td>
                  <td>{t.NombreUsuario || "Usuario Desconocido"}</td>
                  <td>{t.TipoAccion}</td>
                  <td>{t.Descripcion}</td>
                  <td>{t.EntidadAfectada}</td>
                  <td>{t.IDEntidadAfectada}</td>
                </tr>
              ))}
            </tbody>
          </TransaccionesTable>

        </>
      )}
    </Container>
  );
};

export default Transacciones;