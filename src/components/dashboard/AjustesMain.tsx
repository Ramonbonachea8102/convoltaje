import { useState } from "react";
import {
  DollarSign, Users, MessageSquare, Save, Plus, Trash2,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Pencil,
  RefreshCw, UserCheck, Percent, Phone
} from "lucide-react";
import { toast } from "sonner";
import { useSettingsStore, TeamMember, WhatsAppTemplate } from "@/hooks/useSettingsStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import UserManagementPanel from "./admin/UserManagementPanel";

// ─── Componente Sección ────────────────────────────────────────────────
function Section({
  title, icon: Icon, children, defaultOpen = false
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center text-[#00D9FF]">
            <Icon size={16} />
          </div>
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Etiqueta de Rol ───────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  admin:         "bg-purple-500/20 text-purple-300 border-purple-500/30",
  comercial:     "bg-[#00D9FF]/15 text-[#00D9FF] border-[#00D9FF]/25",
  tecnico:       "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  contable:      "bg-amber-500/15 text-amber-300 border-amber-500/25",
  proyectista:   "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  almacenero:    "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  transportista: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};
function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${ROLE_COLORS[role] || "bg-white/10 text-white/60 border-white/10"}`}>
      {role}
    </span>
  );
}

// ─── Categoría de Plantilla ─────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  bienvenida:  "🤝 Bienvenida",
  cobro:       "💳 Cobro",
  instalacion: "🔧 Instalación",
  queja:       "⚠️ Queja",
  seguimiento: "📡 Seguimiento",
};

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────
export default function AjustesMain() {
  const {
    tasaCambioUSD, tasaCambioMLC, lastRateUpdate,
    setTasaCambioUSD, setTasaCambioMLC,
    teamMembers, updateTeamMember, addTeamMember, removeTeamMember,
    whatsappTemplates, updateTemplate, addTemplate, removeTemplate,
  } = useSettingsStore();

  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === "admin";
  const isAdminOrContable = isAdmin || currentUser?.role === "contable";

  // — Tasa de Cambio —
  const [usdInput, setUsdInput] = useState(String(tasaCambioUSD));
  const [mlcInput, setMlcInput] = useState(String(tasaCambioMLC));

  const handleSaveRates = () => {
    const usd = parseFloat(usdInput);
    const mlc = parseFloat(mlcInput);
    if (isNaN(usd) || usd <= 0 || isNaN(mlc) || mlc <= 0) {
      toast.error("Introduce valores numéricos válidos para las tasas.");
      return;
    }
    setTasaCambioUSD(usd);
    setTasaCambioMLC(mlc);
    toast.success("Tasas de cambio actualizadas correctamente. Finanzas se recalculará en tiempo real.");
  };

  // — Equipo (edición inline) —
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState<Partial<TeamMember>>({});
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<Omit<TeamMember, "id">>({
    name: "", role: "comercial", title: "", commissionPct: 5, phone: "", isActive: true
  });

  const startEditMember = (m: TeamMember) => {
    setEditingMemberId(m.id);
    setMemberDraft({ name: m.name, title: m.title, commissionPct: m.commissionPct, phone: m.phone });
  };

  const saveMember = (id: string) => {
    updateTeamMember(id, memberDraft);
    setEditingMemberId(null);
    setMemberDraft({});
    toast.success("Datos del miembro actualizados.");
  };

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.title.trim()) {
      toast.error("El nombre y el cargo son obligatorios.");
      return;
    }
    addTeamMember(newMember);
    setShowAddMember(false);
    setNewMember({ name: "", role: "comercial", title: "", commissionPct: 5, phone: "", isActive: true });
    toast.success("Nuevo miembro del equipo agregado.");
  };

  // — Plantillas WhatsApp —
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplDraft, setTplDraft] = useState<Partial<WhatsAppTemplate>>({});
  const [showAddTpl, setShowAddTpl] = useState(false);
  const [newTpl, setNewTpl] = useState<Omit<WhatsAppTemplate, "id">>({
    label: "", category: "bienvenida", body: ""
  });

  const startEditTpl = (t: WhatsAppTemplate) => {
    setEditingTplId(t.id);
    setTplDraft({ label: t.label, body: t.body, category: t.category });
  };

  const saveTpl = (id: string) => {
    updateTemplate(id, tplDraft);
    setEditingTplId(null);
    setTplDraft({});
    toast.success("Plantilla actualizada.");
  };

  const handleAddTpl = () => {
    if (!newTpl.label.trim() || !newTpl.body.trim()) {
      toast.error("El nombre y el texto de la plantilla son obligatorios.");
      return;
    }
    addTemplate(newTpl);
    setShowAddTpl(false);
    setNewTpl({ label: "", category: "bienvenida", body: "" });
    toast.success("Plantilla creada correctamente.");
  };

  return (
    <div className="w-full flex flex-col gap-4 font-sans text-white pb-10">
      
      {/* Encabezado */}
      <div className="mb-2">
        <h2 className="text-lg font-bold">Configuración del Sistema</h2>
        <p className="text-white/50 text-xs">
          Panel de administración central. Gestión de usuarios en Supabase Auth, tasas de cambio y plantillas.
        </p>
      </div>

      {/* ─── GESTIÓN DE USUARIOS (SUPABASE AUTH) ───────────────────────── */}
      {isAdmin && (
        <UserManagementPanel />
      )}

      {/* ─── TASA DE CAMBIO ─────────────────────────────── */}
      {isAdminOrContable && (
        <Section title="Tasas de Cambio" icon={DollarSign} defaultOpen>
          <div className="pt-4 flex flex-col gap-4">
            <p className="text-[11px] text-white/50 leading-relaxed">
              La tasa de cambio aquí configurada es la que usa el módulo de Finanzas para convertir entre USD, MLC y CUP en tiempo real. Actualízala diariamente consultando <strong className="text-[#00D9FF]">El Toque</strong>.
            </p>

            {lastRateUpdate && (
              <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                <RefreshCw size={11} />
                <span>Última actualización: {format(parseISO(lastRateUpdate), "d MMM yyyy, HH:mm", { locale: es })}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* USD */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase">USD → CUP</label>
                <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl px-3 py-2">
                  <span className="text-white/40 text-xs">$</span>
                  <input
                    type="number"
                    value={usdInput}
                    onChange={(e) => setUsdInput(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm font-bold focus:outline-none text-right"
                  />
                  <span className="text-white/40 text-[10px]">CUP</span>
                </div>
              </div>

              {/* MLC */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase">MLC → CUP</label>
                <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl px-3 py-2">
                  <span className="text-white/40 text-xs">M</span>
                  <input
                    type="number"
                    value={mlcInput}
                    onChange={(e) => setMlcInput(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm font-bold focus:outline-none text-right"
                  />
                  <span className="text-white/40 text-[10px]">CUP</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveRates}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00D9FF] hover:bg-[#00c5e6] text-[#0b1b33] text-xs font-black transition-all"
            >
              <Save size={14} />
              <span>Guardar Tasas</span>
            </button>
          </div>
        </Section>
      )}

      {/* ─── EQUIPO Y COMISIONES ─────────────────────────── */}
      <Section title="Equipo y Comisiones" icon={Users} defaultOpen={isAdmin}>
        <div className="pt-4 flex flex-col gap-3">

          {teamMembers.map((member) => (
            <div key={member.id} className="bg-black/20 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
              {editingMemberId === member.id ? (
                /* — Edición Inline — */
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-white/40 uppercase font-bold">Nombre</label>
                      <input
                        value={memberDraft.name ?? ""}
                        onChange={(e) => setMemberDraft((d) => ({ ...d, name: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-white/40 uppercase font-bold">Cargo</label>
                      <input
                        value={memberDraft.title ?? ""}
                        onChange={(e) => setMemberDraft((d) => ({ ...d, title: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-white/40 uppercase font-bold">Comisión (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={memberDraft.commissionPct ?? 0}
                        onChange={(e) => setMemberDraft((d) => ({ ...d, commissionPct: Number(e.target.value) }))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-white/40 uppercase font-bold">Teléfono</label>
                      <input
                        value={memberDraft.phone ?? ""}
                        onChange={(e) => setMemberDraft((d) => ({ ...d, phone: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => setEditingMemberId(null)}
                      className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/60 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => saveMember(member.id)}
                      className="py-1.5 rounded-lg bg-[#00D9FF] hover:bg-[#00c5e6] text-[#0b1b33] text-xs font-black"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                /* — Vista Normal — */
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white truncate">{member.name}</span>
                      <RoleBadge role={member.role} />
                      {!member.isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          (ex-empleado / archivado)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/50 truncate">{member.title}</span>
                    <div className="flex items-center gap-3 text-[10px] text-white/40 mt-0.5">
                      {member.commissionPct > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Percent size={9} />
                          <span>{member.commissionPct}% comisión</span>
                        </span>
                      )}
                      {member.phone && (
                        <span className="flex items-center gap-0.5">
                          <Phone size={9} />
                          <span>{member.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          const nextActive = !member.isActive;
                          updateTeamMember(member.id, { isActive: nextActive });
                          toast.success(nextActive ? `${member.name} reactivado.` : `${member.name} archivado como ex-empleado.`);
                        }}
                        className={`p-1.5 rounded-lg transition-colors border ${member.isActive ? "text-[#00D9FF] bg-[#00D9FF]/10 border-[#00D9FF]/20 hover:bg-[#00D9FF]/20" : "text-white/30 bg-white/5 border-white/10 hover:bg-white/10"}`}
                        title={member.isActive ? "Archivar (Dar de baja)" : "Reactivar"}
                      >
                        {member.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button
                        onClick={() => startEditMember(member)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Archivar a ${member.name}? Sus registros históricos e historial de OTs se conservarán con la etiqueta (ex-empleado).`)) {
                            updateTeamMember(member.id, { isActive: false });
                            toast.success(`${member.name} archivado correctamente.`);
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 bg-white/5 hover:bg-red-400/10 border border-white/10 transition-colors"
                        title="Archivar sin borrar historial"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* — Agregar Nuevo Miembro — */}
          {isAdmin && (
            showAddMember ? (
              <div className="bg-black/20 border border-[#00D9FF]/20 rounded-xl p-4 flex flex-col gap-3 mt-1">
                <h4 className="text-xs font-bold text-[#00D9FF]">Alta de Nuevo Personal (RRHH)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Nombre completo *"
                    value={newMember.name}
                    onChange={(e) => setNewMember((n) => ({ ...n, name: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none col-span-2"
                  />
                  <input
                    placeholder="Cargo / Título *"
                    value={newMember.title}
                    onChange={(e) => setNewMember((n) => ({ ...n, title: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none col-span-2"
                  />
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember((n) => ({ ...n, role: e.target.value as TeamMember["role"] }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="comercial">Comercial</option>
                    <option value="tecnico">Técnico</option>
                    <option value="proyectista">Proyectista</option>
                    <option value="contable">Contable</option>
                    <option value="almacenero">Almacenero</option>
                    <option value="transportista">Transportista</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <span className="text-white/40 text-[10px]">Comisión %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newMember.commissionPct}
                      onChange={(e) => setNewMember((n) => ({ ...n, commissionPct: Number(e.target.value) }))}
                      className="flex-1 bg-transparent text-white text-xs font-bold focus:outline-none text-right"
                    />
                  </div>
                  <input
                    placeholder="Teléfono (+53...)"
                    value={newMember.phone || ''}
                    onChange={(e) => setNewMember((n) => ({ ...n, phone: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none col-span-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowAddMember(false)} className="py-2 rounded-xl bg-white/5 text-xs font-semibold text-white/60">Cancelar</button>
                  <button onClick={handleAddMember} className="py-2 rounded-xl bg-[#00D9FF] text-[#0b1b33] text-xs font-black">Agregar</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center justify-center gap-2 py-2.5 mt-1 rounded-xl border border-dashed border-white/15 hover:border-[#00D9FF]/40 hover:bg-[#00D9FF]/5 text-xs font-semibold text-white/40 hover:text-[#00D9FF] transition-all"
              >
                <Plus size={14} />
                <span>Agregar integrante al equipo</span>
              </button>
            )
          )}
        </div>
      </Section>

      {/* ─── PLANTILLAS DE WHATSAPP ──────────────────────── */}
      <Section title="Plantillas de WhatsApp" icon={MessageSquare}>
        <div className="pt-4 flex flex-col gap-3">
          <p className="text-[11px] text-white/50 leading-relaxed mb-1">
            Las variables disponibles son: <code className="text-[#00D9FF]">{"{"}<wbr/>nombre{"}"}</code>, <code className="text-[#00D9FF]">{"{"}<wbr/>agente{"}"}</code>, <code className="text-[#00D9FF]">{"{"}<wbr/>fecha{"}"}</code>, <code className="text-[#00D9FF]">{"{"}<wbr/>tecnico{"}"}</code>, <code className="text-[#00D9FF]">{"{"}<wbr/>monto{"}"}</code>.
          </p>

          {whatsappTemplates.map((tpl) => (
            <div key={tpl.id} className="bg-black/20 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2">
              {editingTplId === tpl.id ? (
                /* — Edición — */
                <div className="flex flex-col gap-2.5">
                  <input
                    value={tplDraft.label ?? ""}
                    onChange={(e) => setTplDraft((d) => ({ ...d, label: e.target.value }))}
                    placeholder="Nombre de la plantilla"
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <select
                    value={tplDraft.category ?? "bienvenida"}
                    onChange={(e) => setTplDraft((d) => ({ ...d, category: e.target.value as WhatsAppTemplate["category"] }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <textarea
                    value={tplDraft.body ?? ""}
                    onChange={(e) => setTplDraft((d) => ({ ...d, body: e.target.value }))}
                    rows={5}
                    placeholder="Texto del mensaje (usa *negrita* para WhatsApp)..."
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setEditingTplId(null)} className="py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 font-semibold">Cancelar</button>
                    <button onClick={() => saveTpl(tpl.id)} className="py-1.5 rounded-lg bg-[#00D9FF] text-[#0b1b33] text-xs font-black">Guardar</button>
                  </div>
                </div>
              ) : (
                /* — Vista Normal — */
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="text-xs font-bold text-white truncate">{tpl.label}</span>
                      <span className="text-[10px] text-white/40">{CATEGORY_LABELS[tpl.category]}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => startEditTpl(tpl)} className="p-1.5 rounded-lg text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la plantilla "${tpl.label}"?`)) {
                            removeTemplate(tpl.id);
                            toast.success("Plantilla eliminada.");
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 bg-white/5 hover:bg-red-400/10 border border-white/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed bg-black/20 rounded-xl px-3 py-2 border border-white/5 line-clamp-3">
                    {tpl.body}
                  </p>
                </>
              )}
            </div>
          ))}

          {/* — Agregar plantilla — */}
          {showAddTpl ? (
            <div className="bg-black/20 border border-[#00D9FF]/20 rounded-xl p-4 flex flex-col gap-3 mt-1">
              <h4 className="text-xs font-bold text-[#00D9FF]">Nueva Plantilla</h4>
              <input
                placeholder="Nombre descriptivo *"
                value={newTpl.label}
                onChange={(e) => setNewTpl((n) => ({ ...n, label: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
              <select
                value={newTpl.category}
                onChange={(e) => setNewTpl((n) => ({ ...n, category: e.target.value as WhatsAppTemplate["category"] }))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <textarea
                placeholder="Texto del mensaje (usa *negrita* para WhatsApp)..."
                value={newTpl.body}
                onChange={(e) => setNewTpl((n) => ({ ...n, body: e.target.value }))}
                rows={5}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none leading-relaxed"
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowAddTpl(false)} className="py-2 rounded-xl bg-white/5 text-xs font-semibold text-white/60">Cancelar</button>
                <button onClick={handleAddTpl} className="py-2 rounded-xl bg-[#00D9FF] text-[#0b1b33] text-xs font-black">Crear Plantilla</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddTpl(true)}
              className="flex items-center justify-center gap-2 py-2.5 mt-1 rounded-xl border border-dashed border-white/15 hover:border-[#00D9FF]/40 hover:bg-[#00D9FF]/5 text-xs font-semibold text-white/40 hover:text-[#00D9FF] transition-all"
            >
              <Plus size={14} />
              <span>Nueva plantilla de WhatsApp</span>
            </button>
          )}
        </div>
      </Section>

      {/* ─── SESIÓN ACTUAL ───────────────────────────────── */}
      <Section title="Sesión Actual" icon={UserCheck}>
        <div className="pt-4 flex flex-col gap-3">
          <div className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center text-[#00D9FF] font-black text-base flex-shrink-0">
              {currentUser?.name?.charAt(0) ?? "?"}
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-bold text-white">{currentUser?.name ?? "Sin usuario"}</span>
              <span className="text-[11px] text-white/50">{currentUser?.title}</span>
              <RoleBadge role={currentUser?.role ?? ""} />
            </div>
          </div>
          <p className="text-[10px] text-white/30 text-center">
            Para cambiar de sesión, cierra sesión desde el botón en la barra superior.
          </p>
        </div>
      </Section>

    </div>
  );
}
