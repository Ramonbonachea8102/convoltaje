import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FAQ_ITEMS, FAQ_CATEGORIES, type FAQItem } from "@/lib/faq-data";
import { OFFICIAL_WHATSAPP_CLEAN } from "@/lib/products";

export default function FAQSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQs = FAQ_ITEMS.filter(
    (item) => item.category === selectedCategory
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="py-16 lg:py-24 bg-slate-950 text-white border-t border-slate-800 font-sans">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <HelpCircle className="w-12 h-12 text-cyan-400 mx-auto" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-black text-orange-500 mb-3 tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto font-medium">
            Resuelve tus dudas sobre instalación, baterías, consumo energético y
            más. Si no encuentras tu respuesta, contáctanos directamente por WhatsApp.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap justify-center gap-2.5">
          {FAQ_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setExpandedId(null);
              }}
              variant="outline"
              className={`rounded-xl text-xs font-bold transition-all px-4 py-2 border ${
                selectedCategory === category.id
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-sm"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </Button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-3">
          {filteredFAQs.map((faq) => (
            <Card
              key={faq.id}
              className="overflow-hidden bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors rounded-2xl shadow-md text-white"
            >
              <button
                onClick={() => toggleExpand(faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-800/50 transition-colors text-left"
              >
                <h3 className="font-accent text-white flex-1 text-base md:text-lg font-bold">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-cyan-400 flex-shrink-0 transition-transform duration-300 ${
                    expandedId === faq.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Expanded Content */}
              {expandedId === faq.id && (
                <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 text-slate-300">
                  <p className="leading-relaxed text-sm">
                    {faq.answer}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 max-w-3xl mx-auto">
          <Card className="p-8 bg-slate-900/90 border-slate-800 rounded-3xl shadow-xl text-center">
            <div>
              <h3 className="font-display text-2xl font-black text-white mb-2">
                ¿Aún tienes dudas?
              </h3>
              <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto leading-relaxed">
                Nuestro equipo de expertos está disponible por WhatsApp
                para responder todas tus preguntas y asesorarte con el mejor
                sistema solar para tu hogar o negocio.
              </p>
              <Button
                onClick={() => {
                  const message = "Hola, tengo preguntas sobre los sistemas solares de Convoltaje.";
                  const encodedMessage = encodeURIComponent(message);
                  const whatsappUrl = `https://wa.me/${OFFICIAL_WHATSAPP_CLEAN}?text=${encodedMessage}`;
                  window.open(whatsappUrl, "_blank");
                }}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-accent px-8 py-3"
              >
                💬 Contactar por WhatsApp
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
