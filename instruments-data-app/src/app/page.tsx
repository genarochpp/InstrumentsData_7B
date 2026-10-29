"use client";

import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  CirclePlus,
  ImagePlus,
  LoaderCircle,
  Gauge,
  MoreHorizontal,
  Pencil,
  Plane,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Instrument = {
  id: string;
  person_name: string;
  instrument_name: string;
  part_number: string;
  serial_number: string;
  photo_url: string | null;
  created_at: string;
};

type FormValues = {
  personName: string;
  instrumentName: string;
  partNumber: string;
  serialNumber: string;
  photoUrl: string;
};

const emptyForm: FormValues = {
  personName: "",
  instrumentName: "",
  partNumber: "",
  serialNumber: "",
  photoUrl: "",
};

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function Home() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Instrument | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const loadInstruments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/instruments", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el inventario.");
      setInstruments(data);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInstruments();
  }, [loadInstruments]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    if (!term) return instruments;
    return instruments.filter((item) =>
      [item.person_name, item.instrument_name, item.part_number, item.serial_number]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(term),
    );
  }, [instruments, query]);

  function openNew() {
    setFormError("");
    setEditing(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPreview("");
    setDialogOpen(true);
  }

  function openEdit(item: Instrument) {
    setFormError("");
    setEditing(item);
    setForm({
      personName: item.person_name,
      instrumentName: item.instrument_name,
      partNumber: item.part_number,
      serialNumber: item.serial_number,
      photoUrl: item.photo_url ?? "",
    });
    setPhotoFile(null);
    setPreview(item.photo_url ?? "");
    setDialogOpen(true);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("La foto debe ser JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setFormError("La foto no puede superar los 4 MB.");
      event.target.value = "";
      return;
    }
    setFormError("");
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      let photoUrl = form.photoUrl;
      if (photoFile) {
        const payload = new FormData();
        payload.append("file", photoFile);
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: payload });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.error || "No se pudo cargar la foto.");
        photoUrl = uploadData.url;
      }

      const response = await fetch(editing ? `/api/instruments/${editing.id}` : "/api/instruments", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el equipo.");

      setDialogOpen(false);
      setPhotoFile(null);
      setPreview("");
      await loadInstruments();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "No se pudo guardar el registro.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteInstrument(item: Instrument) {
    if (!window.confirm(`¿Eliminar ${item.instrument_name} · serie ${item.serial_number}?`)) return;
    try {
      const response = await fetch(`/api/instruments/${item.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar el registro.");
      await loadInstruments();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al eliminar.");
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="Chiarappa Aviónica, inicio">
          <span className="brand-mark"><Plane size={19} strokeWidth={2.2} /></span>
          <span>Chiarappa<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-label">ESPACIO DE TRABAJO</div>
        <a className="nav-link active" href="#inventario"><span className="nav-glyph">▦</span> Inventario</a>
        <div className="sidebar-bottom">
          <div className="profile-avatar">CI</div>
          <div className="profile-copy"><strong>Chiarappa</strong><span>Administración</span></div>
          <MoreHorizontal size={18} className="profile-menu" />
        </div>
      </aside>

      <section className="workspace" id="inicio">
        <header className="topbar">
          <div className="breadcrumbs"><span>Espacio de trabajo</span><span className="crumb-slash">/</span><strong>Inventario</strong></div>
          <button className="workspace-switch" type="button">Chiarappa Instruments <ChevronDown size={15} /></button>
        </header>

        <div className="page-content" id="inventario">
          <div className="heading-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> CONTROL DE AVIÓNICA</div>
              <h1>Inventario de aviónica</h1>
              <p className="intro">Instrumentos y equipos aeronáuticos, identificados y bajo control.</p>
            </div>
            <button className="primary-button" type="button" onClick={openNew}>
              <CirclePlus size={17} strokeWidth={2.1} /> Añadir equipo
            </button>
          </div>

          <div className="stats-row">
            <div className="stat-card"><div className="stat-icon"><Gauge size={18} /></div><div><span className="stat-label">Equipos registrados</span><strong>{instruments.length.toString().padStart(2, "0")}</strong></div><span className="stat-note">en total</span></div>
            <div className="stat-card stat-card-secondary"><div className="stat-icon stat-icon-soft"><Check size={17} /></div><div><span className="stat-label">Estado del inventario</span><strong className="status-value"><i /> Actualizado</strong></div><span className="stat-note">al momento</span></div>
          </div>

          <div className="inventory-heading">
            <div><h2>Equipos registrados <span className="count-pill">{instruments.length}</span></h2><p>Consulta modelos, números de parte, series y responsables.</p></div>
            <button type="button" className="export-button" onClick={() => window.print()}><ArrowDownToLine size={16} /> Exportar <ArrowUpRight size={14} /></button>
          </div>

          <div className="toolbar">
            <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar equipo, responsable, P/N o S/N..." /></label>
            <button className="filter-button" type="button" onClick={() => setQuery("")}><SlidersHorizontal size={16} /> Filtros <span>0</span></button>
            <button className="sort-button" type="button">Más recientes <ChevronDown size={15} /></button>
          </div>

          {error && <div className="alert" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Cerrar aviso"><X size={16} /></button></div>}

          {loading ? (
            <div className="loading-state"><LoaderCircle className="spinner" size={24} /><span>Cargando inventario…</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Gauge size={25} /></div>
              <h3>{query ? "No encontramos resultados" : "Tu inventario comienza aquí"}</h3>
              <p>{query ? "Prueba con otro equipo, responsable, número de parte o serie." : "Registra el primer equipo de aviónica para tener su identificación y responsable a mano."}</p>
              {!query && <button type="button" className="primary-button" onClick={openNew}><CirclePlus size={17} /> Añadir equipo</button>}
            </div>
          ) : (
            <div className="instrument-grid">
              {filtered.map((item, index) => (
                <article className="instrument-card" key={item.id} style={{ animationDelay: `${index * 45}ms` }}>
                  <div className="instrument-photo">
                    {item.photo_url ? <Image src={item.photo_url} alt={item.instrument_name} fill unoptimized sizes="(max-width: 480px) 100vw, (max-width: 1120px) 50vw, 33vw" /> : <div className="photo-placeholder"><Gauge size={31} strokeWidth={1.4} /><span>Sin imagen del equipo</span></div>}
                    <span className="photo-chip">AVIÓNICA</span>
                    <div className="card-actions">
                      <button type="button" onClick={() => openEdit(item)} aria-label={`Editar ${item.instrument_name}`} title="Editar"><Pencil size={15} /></button>
                      <button type="button" onClick={() => void deleteInstrument(item)} aria-label={`Eliminar ${item.instrument_name}`} title="Eliminar"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="instrument-info">
                    <div className="card-title-row"><div><span className="owner-label">EQUIPO / MODELO</span><h3>{item.instrument_name}</h3></div><span className="created-date">{dateFormatter.format(new Date(item.created_at))}</span></div>
                    <p className="instrument-name">Responsable: {item.person_name}</p>
                    <div className="instrument-meta"><div><span>N.º DE PARTE · P/N</span><strong>{item.part_number}</strong></div><div className="meta-divider" /><div><span>N.º DE SERIE · S/N</span><strong>{item.serial_number}</strong></div></div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <footer className="page-footer"><span>CHIARAPPA <i>·</i> INVENTARIO DE AVIÓNICA</span><span>{filtered.length} de {instruments.length} registros <i>·</i> <button type="button" onClick={() => void loadInstruments()}>Actualizar</button></span></footer>
        </div>
      </section>

      {dialogOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialogOpen(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div className="modal-header"><div><span className="modal-kicker">REGISTRO DE AVIÓNICA</span><h2 id="dialog-title">{editing ? "Editar equipo" : "Añadir equipo"}</h2></div><button type="button" className="close-button" onClick={() => setDialogOpen(false)} aria-label="Cerrar"><X size={19} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field span-two"><span>Responsable / técnico <b>*</b></span><input required maxLength={160} value={form.personName} onChange={(event) => setForm({ ...form, personName: event.target.value })} placeholder="Ej. María González" /></label>
                <label className="form-field span-two"><span>Equipo / modelo <b>*</b></span><input required maxLength={160} value={form.instrumentName} onChange={(event) => setForm({ ...form, instrumentName: event.target.value })} placeholder="Ej. Garmin GNS 430W · GPS/NAV/COMM" /></label>
                <label className="form-field"><span>N.º de parte (P/N) <b>*</b></span><input required maxLength={100} value={form.partNumber} onChange={(event) => setForm({ ...form, partNumber: event.target.value })} placeholder="Ej. 011-01060-00" /></label>
                <label className="form-field"><span>N.º de serie (S/N) <b>*</b></span><input required maxLength={100} value={form.serialNumber} onChange={(event) => setForm({ ...form, serialNumber: event.target.value })} placeholder="Ej. 3A1234567" /></label>
                <div className="form-field span-two"><span>Foto del equipo <small>(opcional)</small></span><label className={`photo-upload ${preview ? "has-photo" : ""}`}>
                  {preview ? <><Image src={preview} alt="Vista previa del equipo de aviónica" fill unoptimized sizes="480px" /><span className="replace-photo"><ImagePlus size={15} /> Cambiar imagen</span></> : <><span className="upload-icon"><ImagePlus size={19} /></span><strong>Selecciona una imagen del equipo</strong><small>Opcional · JPG, PNG o WEBP · Máximo 4 MB</small></>}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
                </label></div>
              </div>
              {formError && <div className="form-error" role="alert">{formError}</div>}
              <div className="modal-footer"><span><b>*</b> Campos obligatorios</span><div><button type="button" className="cancel-button" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <><LoaderCircle size={16} className="spinner" /> Guardando…</> : <><Check size={16} /> {editing ? "Guardar cambios" : "Guardar equipo"}</>}</button></div></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}