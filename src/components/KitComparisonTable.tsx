import { useState } from "react";
import { Check, X, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ECOPOWER_KITS } from "@/lib/calculator";
import { WHATSAPP_NUMBERS, OFFICIAL_WHATSAPP_CLEAN } from "@/lib/products";
import { getKitWhatsAppLink } from "@/lib/whatsapp-messages";
import { toast } from "sonner";

type ViewMode = "table" | "cards";

interface KitComparisonTableProps {
  comparisonSlugs: string[];
  onToggleCompare: (slug: string) => void;
  onCompareNow: () => void;
}

export default function KitComparisonTable({
  comparisonSlugs,
  onToggleCompare,
  onCompareNow
}: KitComparisonTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedKit, setSelectedKit] = useState<string | null>(null);

  const handleWhatsAppClick = (kitId: string) => {
    const whatsappLink = getKitWhatsAppLink(kitId);
    window.open(whatsappLink, "_blank");
  };

  // Specifications for comparison
  const specs = [
    {
      label: "Potencia del Inversor",
      key: "inverter",
      unit: "kW",
      tooltip: "Potencia máxima que puede entregar el sistema",
    },
    {
      label: "Capacidad de Batería",
      key: "battery",
      unit: "kWh",
      tooltip: "Energía que puede almacenar la batería",
    },
    {
      label: "Consumo Diario Recomendado",
      key: "consumption",
      unit: "kWh",
      tooltip: "Rango de consumo diario ideal para este kit",
    },
    {
      label: "Paneles Solares Incluidos",
      key: "panels",
      unit: "unidades",
      tooltip: "Cantidad de paneles en el kit base",
    },
    {
      label: "Garantía",
      key: "warranty",
      unit: "",
      tooltip: "Garantía real sobre equipos e instalación",
    },
    {
      label: "Tiempo de Instalación",
      key: "installation",
      unit: "días",
      tooltip: "Tiempo promedio de instalación",
    },
    {
      label: "Precio",
      key: "price",
      unit: "USD",
      tooltip: "Precio base del sistema",
    },
  ];

  // Get spec value for a kit
  const getSpecValue = (kit: typeof ECOPOWER_KITS[0], specKey: string) => {
    switch (specKey) {
      case "inverter":
        return kit.inverterPower.toString();
      case "battery":
        return kit.batteryCapacity.toString();
      case "consumption":
        return `${kit.minDailyConsumption}-${kit.maxDailyConsumption}`;
      case "panels":
        // Calculate based on inverter power
        if (kit.inverterPower <= 0.5) return "2";
        if (kit.inverterPower <= 3.6) return "4";
        if (kit.inverterPower <= 7.2) return "6";
        return "8";
      case "warranty":
        return kit.id === "titan-12000" ? "1 año" : "3 meses";
      case "installation":
        return "10-15";
      case "price":
        return `$${kit.price}`;
      default:
        return "-";
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <Info className="w-12 h-12 text-secondary mx-auto" />
          </div>
          <h2 className="font-display text-4xl lg:text-5xl text-primary mb-4">
            Comparativa de Kits Solares
          </h2>
          <p className="text-lg text-foreground max-w-2xl mx-auto mb-8">
            Compara todas las especificaciones, características y precios de
            nuestros sistemas EcoPower para encontrar el perfecto para ti.
          </p>

          {/* View Mode Toggle */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              onClick={() => setViewMode("table")}
              variant={viewMode === "table" ? "default" : "outline"}
              className={`font-accent w-full sm:w-auto ${
                viewMode === "table"
                  ? "bg-secondary hover:bg-secondary/90"
                  : ""
              }`}
            >
              📊 Vista Tabla
            </Button>
            <Button
              onClick={() => setViewMode("cards")}
              variant={viewMode === "cards" ? "default" : "outline"}
              className={`font-accent w-full sm:w-auto ${
                viewMode === "cards"
                  ? "bg-secondary hover:bg-secondary/90"
                  : ""
              }`}
            >
              🎴 Vista Tarjetas
            </Button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10 border-b-2 border-primary">
                  <th className="text-left p-4 font-accent text-foreground sticky left-0 bg-primary/10 z-10">
                    Especificación
                  </th>
                  {ECOPOWER_KITS.map((kit) => (
                    <th
                      key={kit.id}
                      className="p-4 font-accent text-foreground text-center min-w-40"
                    >
                      <div className="mb-2">{kit.name}</div>
                      <div className="text-sm text-secondary font-display">
                        ${kit.price}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((spec, idx) => (
                  <tr
                    key={spec.key}
                    className={`border-b border-border ${
                      idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <td className="p-4 font-accent text-foreground sticky left-0 bg-inherit z-10">
                      <div className="flex items-center gap-2">
                        {spec.label}
                        <div
                          className="group relative cursor-help"
                          title={spec.tooltip}
                        >
                          <Info className="w-4 h-4 text-muted-foreground" />
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded whitespace-nowrap z-20">
                            {spec.tooltip}
                          </div>
                        </div>
                      </div>
                    </td>
                    {ECOPOWER_KITS.map((kit) => (
                      <td
                        key={`${kit.id}-${spec.key}`}
                        className="p-4 text-center text-foreground"
                      >
                        <span className="font-accent">
                          {getSpecValue(kit, spec.key)}{spec.unit ? ` ${spec.unit}` : ""}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Features Row */}
                <tr className="bg-secondary/10 border-b-2 border-secondary">
                  <td className="p-4 font-accent text-foreground sticky left-0 bg-secondary/10 z-10">
                    Características Principales
                  </td>
                  {ECOPOWER_KITS.map((kit) => (
                    <td key={`${kit.id}-features`} className="p-4">
                      <ul className="space-y-2 text-sm">
                        {kit.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                {/* CTA Row */}
                <tr>
                  <td className="p-4 font-accent text-foreground sticky left-0 bg-background z-10">
                    Acción
                  </td>
                  {ECOPOWER_KITS.map((kit) => {
                    const isSelected = comparisonSlugs.includes(kit.id);
                    return (
                      <td key={`${kit.id}-cta`} className="p-4 text-center">
                        <Button
                          onClick={() => {
                            if (!isSelected && comparisonSlugs.length >= 3) {
                              toast.error("Máximo 3 kits para comparar. Quitá uno primero.");
                              return;
                            }
                            onToggleCompare(kit.id);
                          }}
                          className={`w-full font-accent transition-colors ${
                            isSelected 
                              ? "bg-green-600 hover:bg-green-700 text-white" 
                              : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Seleccionado
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Comparar
                            </>
                          )}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Cards View */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ECOPOWER_KITS.map((kit) => (
              <Card
                key={kit.id}
                className={`p-6 flex flex-col border-2 transition-all ${
                  selectedKit === kit.id
                    ? "border-secondary bg-secondary/5"
                    : "border-border hover:border-secondary/50"
                }`}
                onClick={() => setSelectedKit(selectedKit === kit.id ? null : kit.id)}
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="font-display text-xl text-primary mb-2">
                    {kit.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {kit.description}
                  </p>
                  <div className="text-3xl font-display text-secondary">
                    ${kit.price}
                  </div>
                  <p className="text-xs text-muted-foreground">USD</p>
                </div>

                {/* Key Specs */}
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="text-sm text-muted-foreground">
                      Inversor
                    </span>
                    <span className="font-accent text-foreground">
                      {kit.inverterPower} kW
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="text-sm text-muted-foreground">
                      Batería
                    </span>
                    <span className="font-accent text-foreground">
                      {kit.batteryCapacity} kWh
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="text-sm text-muted-foreground">
                      Consumo Ideal
                    </span>
                    <span className="font-accent text-foreground">
                      {kit.minDailyConsumption}-{kit.maxDailyConsumption} kWh
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <p className="font-accent text-sm text-foreground mb-2">
                    Incluye:
                  </p>
                  <ul className="space-y-2">
                    {kit.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => {
                    const isSelected = comparisonSlugs.includes(kit.id);
                    if (!isSelected && comparisonSlugs.length >= 3) {
                      toast.error("Máximo 3 kits para comparar. Quitá uno primero.");
                      return;
                    }
                    onToggleCompare(kit.id);
                  }}
                  className={`w-full font-accent transition-colors ${
                    comparisonSlugs.includes(kit.id)
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  }`}
                >
                  {comparisonSlugs.includes(kit.id) ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Seleccionado
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Comparar
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Recommendation Section */}
        <Card className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-display text-lg text-primary mb-2">
                👨‍👩‍👧 Para Familias Pequeñas
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Apartamentos o casas con consumo bajo a medio.
              </p>
              <p className="font-accent text-secondary">
                Sistema Básico o Medio 3000W
              </p>
            </div>
            <div>
              <h4 className="font-display text-lg text-primary mb-2">
                🏠 Para Casas Medianas
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Casas con consumo moderado, incluyendo aire acondicionado.
              </p>
              <p className="font-accent text-secondary">
                Sistema Aire Acondicionado 3000W o Avanzado 6000W
              </p>
            </div>
            <div>
              <h4 className="font-display text-lg text-primary mb-2">
                🏢 Para Negocios y Casas Grandes
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Consumo alto, múltiples equipos, máxima autonomía.
              </p>
              <p className="font-accent text-secondary">
                Sistema 6K PLUS o Premium 10000W
              </p>
            </div>
          </div>
        </Card>

        {/* Warranty Notice */}
        <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg shadow-sm text-left">
          <h4 className="font-display text-lg text-amber-900 mb-3 flex items-center gap-2">
            ⚠️ Sobre la Garantía de los Equipos
          </h4>
          <div className="text-sm text-amber-800 leading-relaxed space-y-2">
            <p>Convoltaje ofrece garantía real cubierta 100% por nosotros. Los equipos se adquieren en tiendas fuera de Cuba que no aceptan devoluciones, por lo que Convoltaje asume directamente toda la responsabilidad de garantía ante el cliente.</p>
            <p className="font-semibold">• Sistemas hasta 6kW: 3 meses de garantía (equipos + instalación)</p>
            <p className="font-semibold">• Sistemas de 10kW o más: 1 año de garantía (equipos + instalación)</p>
            <p className="font-semibold">• PowerStations integradas a sistemas: 1 mes de garantía</p>
            <p className="mt-2">Sin cobros por adelantado. Pagas solo cuando tu sistema funciona al 100%.</p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            ¿No estás seguro cuál elegir? Usa nuestra calculadora solar o
            habla con un experto.
          </p>
          <Button
            onClick={() => {
              const message =
                "Hola, necesito ayuda para elegir el kit solar adecuado.";
              const encodedMessage = encodeURIComponent(message);
              const whatsappUrl = `https://wa.me/${OFFICIAL_WHATSAPP_CLEAN}?text=${encodedMessage}`;
              window.open(whatsappUrl, "_blank");
            }}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-accent px-8 py-3"
          >
            💬 Hablar con un Experto
          </Button>
        </div>
      </div>

      {/* Floating Comparison Bar */}
      {comparisonSlugs.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary shadow-[0_-4px_15px_rgba(0,0,0,0.2)] z-50 animate-fade-in slide-in-from-bottom">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-x-auto flex-1 w-full pb-2 sm:pb-0 hide-scrollbar">
                <span className="text-white/80 font-accent text-sm whitespace-nowrap">
                  Kits seleccionados:
                </span>
                {comparisonSlugs.map((slug) => {
                  const kit = ECOPOWER_KITS.find(k => k.id === slug);
                  if (!kit) return null;
                  return (
                    <div 
                      key={slug}
                      className="bg-primary-foreground/10 text-white px-3 py-1.5 rounded-full text-xs font-accent flex items-center gap-2 whitespace-nowrap border border-white/20"
                    >
                      {kit.name}
                      <button 
                        onClick={() => onToggleCompare(slug)}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <Button 
                id="comparar-ahora-btn"
                onClick={onCompareNow}
                className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground font-display text-lg py-6 sm:py-4 px-8 shadow-lg shrink-0"
              >
                Comparar ahora ({comparisonSlugs.length}/3)
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
