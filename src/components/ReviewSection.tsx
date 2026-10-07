import { useState, useRef } from "react";
import { Star } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const initialReviews = [
  { id: 1, name: "Cliente satisfecho de Convoltaje", neighborhood: "", rating: 5, src: "/images/cliente-01.jpg", text: "Instalación impecable, el equipo fue muy profesional. Ya llevamos 6 meses sin apagones." },
  { id: 2, name: "Cliente satisfecho de Convoltaje", neighborhood: "", rating: 5, src: "/images/cliente-02.jpg", text: "Lo mejor fue que no tuve que pagar nada hasta que el sistema estaba funcionando al 100%." },
  { id: 3, name: "Cliente satisfecho de Convoltaje", neighborhood: "", rating: 5, src: "/images/cliente-03.jpg", text: "En menos de 2 semanas teníamos el sistema instalado y andando. Superó mis expectativas." },
  { id: 4, name: "Cliente satisfecho de Convoltaje", neighborhood: "", rating: 5, src: "/images/cliente-04.jpg", text: "Excelente inversión. El aire acondicionado funciona todo el día sin problema." },
  { id: 5, name: "Cliente satisfecho de Convoltaje", neighborhood: "", rating: 5, src: "/images/cliente-05.jpg", text: "Profesionales de verdad. Me explicaron todo el proceso y quedé muy satisfecho." },
  { id: 6, name: "Cliente satisfecho de Convoltaje", neighborhood: "", rating: 5, src: "/images/cliente-06.jpg", text: "La calculadora me ayudó a elegir exactamente el sistema que necesitaba para mi casa." },
  { id: 7, name: "Cliente satisfecho de Convoltaje", neighborhood: "", rating: 5, src: "/images/cliente-07.jpg", text: "Recomendado al 100%. Trabajo serio, sin cobros por adelantado y resultado garantizado." },
];

export function ReviewSection() {
  const [reviews, setReviews] = useState(initialReviews);
  const [name, setName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Define a standard 4:3 aspect ratio size
        canvas.width = 800;
        canvas.height = 600;

        // Background
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw uploaded image (cover behavior)
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const x = (canvas.width - drawW) / 2;
        const y = (canvas.height - drawH) / 2;
        ctx.drawImage(img, x, y, drawW, drawH);

        // --- SIMULATED FRAME (To be replaced by the real PNG later) ---
        // 1. Inner border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 10;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        // 2. Outer border
        ctx.strokeStyle = "#00D9FF";
        ctx.lineWidth = 15;
        ctx.strokeRect(7.5, 7.5, canvas.width - 15, canvas.height - 15);

        // 3. Banner
        ctx.fillStyle = "#0A1A3A"; // Dark blue
        ctx.fillRect(0, canvas.height - 90, canvas.width, 90);

        // 4. Text
        ctx.fillStyle = "#00D9FF"; // Cyan text
        ctx.font = "bold 40px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐️ CLIENTE COMPLACIDO ⭐️", canvas.width / 2, canvas.height - 45);

        // Export and set preview
        setPreviewUrl(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rating === 0 || !text.trim()) {
      toast.error("Por favor, completa nombre, calificación y reseña.");
      return;
    }

    const newReview = {
      id: Date.now(),
      name,
      neighborhood,
      rating,
      text,
      src: previewUrl || "",
    };

    setReviews([newReview, ...reviews]);
    
    // Reset form
    setName("");
    setNeighborhood("");
    setRating(0);
    setHoverRating(0);
    setText("");
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    toast.success("✅ Reseña lista y publicada — ¡Gracias por tu opinión!");
  };

  return (
    <section id="resenas" data-section="reviews-section" className="py-20 lg:py-28 bg-slate-950 text-white border-t border-slate-800 scroll-mt-28 lg:scroll-mt-32 font-sans">
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        <div className="text-center mb-12">
          {/* Mascota "Nos das tu opinión" */}
          <div className="flex justify-center mb-6">
            <img
              src="/images/Nos das tu opinion.png"
              alt="Samuel el Panel — ¿Nos regalas tu opinión?"
              className="max-h-[190px] md:max-h-[220px] w-auto object-contain drop-shadow-2xl hover:scale-[1.03] transition-transform duration-300"
            />
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black text-orange-500 mb-3 tracking-tight">
            ⭐ Clientes — lo que dicen de nosotros
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto font-medium">
            Conoce la experiencia real de quienes ya dieron el paso hacia la independencia energética con ConVoltaje.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href="https://wa.me/5353097058?text=Hola%20ConVoltaje%20%F0%9F%91%8B%20Quisiera%20dejar%20mi%20rese%C3%B1a%20o%20conocer%20experiencias%20de%20clientes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <span>💬</span>
              <span>Enviar testimonio por WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Formulario de Reseña */}
          <div className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-800 md:sticky md:top-24">
            <h3 className="text-xl font-display font-black text-white mb-5 flex items-center gap-2">
              <span className="text-orange-500">✍️</span> Deja tu reseña
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nombre *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Barrio / Municipio (opcional)</label>
                <input 
                  type="text" 
                  value={neighborhood} 
                  onChange={(e) => setNeighborhood(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                  placeholder="Ej. Playa, La Habana"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Calificación *</label>
                <div className="flex gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 w-fit">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-7 h-7 cursor-pointer transition-colors ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tu reseña *</label>
                <textarea 
                  value={text} 
                  onChange={(e) => setText(e.target.value.slice(0, 200))} 
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none resize-none h-24 transition-all"
                  placeholder="Cuéntanos tu experiencia con el equipo e instalación..."
                  maxLength={200}
                  required
                ></textarea>
                <p className="text-[11px] text-right text-slate-500 mt-1">{text.length}/200</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Foto de la instalación (opcional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 cursor-pointer"
                />
                {previewUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover max-h-48" />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-slate-950 font-black py-4 rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all mt-2">
                Publicar mi reseña
              </Button>
            </form>
          </div>

          {/* Grid de Reseñas */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden flex flex-col hover:border-slate-700 transition-all">
                {review.src && (
                  <div className="w-full aspect-[4/3] overflow-hidden bg-slate-950 border-b border-slate-800">
                    <img src={review.src} alt="Instalación" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'}`} />
                    ))}
                  </div>
                  <p className="text-slate-300 italic mb-4 flex-grow text-sm leading-relaxed font-normal">"{review.text}"</p>
                  <div className="mt-auto pt-3 border-t border-slate-800/80">
                    <p className="font-extrabold text-white text-sm">{review.name}</p>
                    {review.neighborhood && <p className="text-xs text-cyan-400 font-semibold mt-0.5">{review.neighborhood}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
