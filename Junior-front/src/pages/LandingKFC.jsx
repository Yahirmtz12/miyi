import React from "react";
import { TextGenerateEffect } from "../components/magicui/TextGenerateEffect";
import { BorderBeam } from "../components/magicui/BorderBeam";
import Particles from "../components/magicui/Particles";
import Marquee from "../components/magicui/Marquee";
import { MagicCard } from "../components/magicui/MagicCard";
import Meteors from "../components/magicui/Meteors";
import ShinyButton from "../components/magicui/ShinyButton";
import { FaWhatsapp, FaStar } from "react-icons/fa";
import NumberTicker from "../components/magicui/NumberTicker";
// Imágenes
import KEN from '../assets/3.png';
import FA from '../assets/2.png';
import RO from '../assets/1.png';
import TARJETA_QR from '../assets/qr2.png';
import LOGO from '../assets/logo.png';

const tagline = "Sabor artesanal que transforma momentos en recuerdos inolvidables.";

const reviews = [
  { name: "Barcelos cruz David antonio", body: "Muy rico el pollo y se nota que la guarnicion que dan siempre es fresca" },
  { name: "Daniela lizzet", body: "Los pollos están muy ricos y la atención muy bien." },
  { name: "Max", body: "lugar tranquilo, se come rico y muy económico. restringida la convivencia por el covid. muy bien." },
  { name: "Abelardo Chavex", body: "Excelente sabor y muy buen precio" },
];

export default function KFCPage() {
  const irALogin = () => { window.location.href = "/login"; };
  const irARegistro = () => { window.location.href = "/register"; };

  const handleWhatsappCotizacion = () => {
    const telefono = "9515694089";
    const mensaje = encodeURIComponent("¡Hola! Me gustaría cotizar el servicio de San Sebastian para un evento. ¿Podrían darme más información?");
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-50 font-sans overflow-hidden">

      {/* NAVBAR - Glassmorphism Premium */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-neutral-950/50 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 md:h-13 md:w-13 rounded-full overflow-hidden bg-[#74b649] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <img
              src={LOGO}
              alt="Logo San Sebastian"
              className="h-full w-full object-cover scale-150"
            />
          </div>
          <div className="text-xl md:text-2xl font-black tracking-widest text-white uppercase">
            San <span className="text-primary">Sebastian</span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          {/* BOTÓN INICIAR SESIÓN: 
        - En móvil: Se muestra como un ShinyButton principal (block md:hidden)
        - En escritorio: Se muestra como texto simple (hidden md:block) 
    */}
          <button
            onClick={irALogin}
            className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors uppercase tracking-widest hidden md:block"
          >
            Ingresar
          </button>

          <ShinyButton
            onClick={irALogin}
            className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest block md:hidden"
          >
            Iniciar Sesión
          </ShinyButton>

          {/* BOTÓN ÚNETE AL CLUB: 
        - Solo se muestra en escritorio (hidden md:block)
    */}
          <ShinyButton
            onClick={irARegistro}
            className="bg-primary text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hidden md:block"
          >
            Únete al Club
          </ShinyButton>
        </div>
      </nav>

      {/* HERO SECTION - Rediseñado para máximo impacto */}
      <div className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">

        {/* 1. Fondo de Resplandor (Glow) - Esto hace que las partículas resalten */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(78, 231, 86, 0.15),transparent_50%)]" />

        {/* 2. Partículas con mayor cantidad y tamaño */}
        <Particles
          className="absolute inset-0 z-0"
          quantity={500} // Aumentamos la cantidad
          ease={70}
          color="#7AC114"
          refresh
        />

        {/* 3. Un efecto visual extra: Gradiente en los bordes para centrar la vista */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950" />

        <div className="z-10 flex flex-col items-center">
          {/* Badge con pulso */}
          <div className="relative px-4 py-1 rounded-full border border-primary/50 bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md animate-pulse">
            Zaachila
          </div>

          {/* Título con sombra de color (Neon Effect) */}
          <h1 className="text-7xl md:text-[10rem] font-black text-white mb-6 tracking-tighter uppercase leading-none">
            San <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary drop-shadow-[0_0_35px_rgba(217,93,57,0.5)]">
              Sebastian
            </span>
          </h1>

          {/* Subtítulo más legible */}
          <div className="text-xl md:text-3xl text-white/80 max-w-3xl mx-auto font-medium italic leading-relaxed">
            <TextGenerateEffect words={tagline} />
          </div>
        </div>

        {/* Decoración: Línea de luz inferior */}
        <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      {/* NUEVA SECCIÓN: PRODUCTOS DESTACADOS con MagicCard */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Nuestras <span className="text-primary">Especialidades</span></h2>
          <p className="text-neutral-400 mt-4">Platillos creados con pasión y servidos con excelencia.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          {[
            { img: KEN, title: "CAPUCCINO", desc: "La mejor bebida para una platica amistosa" },
            { img: FA, title: "Hamburguesa", desc: "La combinación irresistible para compartir con tu familia sin límites." },
            { img: RO, title: "Frappe Oreo", desc: "Sabor dulce y refrescante, pensado para reunir a los que más quieres." }
          ].map((item, i) => (
            <MagicCard key={i} className="relative bg-neutral-900 border-white/10 rounded-[2rem] p-8 pt-24 text-center cursor-pointer flex flex-col items-center justify-center shadow-2xl">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-48 object-contain absolute -top-12 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] hover:scale-110 transition-transform duration-500"
              />
              <h3 className="text-2xl font-black uppercase tracking-tight text-white mt-10">{item.title}</h3>
              <p className="text-neutral-400 mt-4 font-light text-sm">{item.desc}</p>
            </MagicCard>
          ))}
        </div>
      </div>

      {/* NUEVA SECCIÓN: TESTIMONIOS (Marquee) */}
      <div className="py-20 bg-neutral-900/30 border-y border-white/5 relative z-10 overflow-hidden">
        <Marquee pauseOnHover className="[--duration:40s]">
          {reviews.map((review, i) => (
            <div key={i} className="mx-4 w-80 p-6 rounded-2xl bg-neutral-900/50 border border-white/10 backdrop-blur-sm">
              <div className="flex text-[#F5A623] mb-3 text-sm"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
              <p className="text-neutral-300 text-sm italic mb-4">"{review.body}"</p>
              <p className="text-white font-bold text-xs uppercase tracking-wider">— {review.name}</p>
            </div>
          ))}
        </Marquee>
      </div>

      {/* SECCIÓN DE EVENTOS - Meteors para ambiente festivo */}
      {/* SECCIÓN DE EVENTOS - Meteors para ambiente festivo */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Quitamos absolute inset-0 y usamos min-h para asegurar que se vea todo */}
        <div className="relative overflow-hidden w-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 md:p-16 bg-gradient-to-br from-[#1A1A1A] to-neutral-950 rounded-[3rem] border border-white/5 shadow-2xl">

          {/* Los meteoros ahora se posicionan respecto a este contenedor */}
          <Meteors number={40} />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight uppercase leading-tight">
              ¿Tu evento merece <span className="text-[#1ABC9C]">lo mejor?</span>
            </h2>

            <p className="text-neutral-400 text-lg mb-10 max-w-2xl mx-auto font-light">
              Llevamos el sabor de zaachila directamente a tu evento como bodas, cumpleaños o reuniones  con el sello de San Sebastian.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {["Bodas", "Aniversarios", "Empresarial"].map((event) => (
                <span key={event} className="px-6 py-2 bg-white/5 rounded-full text-xs font-black uppercase tracking-widest border border-white/10 text-white backdrop-blur-md">
                  {event}
                </span>
              ))}
            </div>

            <button
              onClick={handleWhatsappCotizacion}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#25D366] text-white rounded-full font-black text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(37,211,102,0.4)]"
            >
              <FaWhatsapp className="text-2xl group-hover:animate-bounce" />
              <span className="uppercase tracking-wide text-white">Cotizar ahora</span>
            </button>
          </div>
        </div>
      </div>
      {/* SECCIÓN DE ESTADÍSTICAS - IMPACTO VISUAL */}
      <section className="relative z-10 py-24 bg-neutral-950/50 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">

            {/* Estadística 1 */}
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={15000} className="text-5xl md:text-7xl font-black text-primary" />
                <span className="text-2xl font-bold text-primary">+</span>
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">
                Pollos servidos
              </p>
            </div>

            {/* Estadística 2 */}
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={120} className="text-5xl md:text-7xl font-black text-white" />
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">
                Eventos Exclusivos
              </p>
            </div>

            {/* Estadística 3 */}
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={98} className="text-5xl md:text-7xl font-black text-[#1ABC9C]" />
                <span className="text-2xl font-bold text-[#1ABC9C]">%</span>
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">
                Clientes Felices
              </p>
            </div>

            {/* Estadística 4 */}
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={12} className="text-5xl md:text-7xl font-black text-white" />
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">
                Años de Sabor
              </p>
            </div>

          </div>
        </div>
      </section>
      {/* SECCIÓN CLUB - Minimalista y Tecnológica */}
      <div className="relative z-10 py-20 px-6 max-w-6xl mx-auto">
        <div className="relative bg-neutral-900 border border-white/10 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center gap-16 shadow-2xl overflow-hidden">
          {/* Resplandor de fondo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="flex-1 text-center md:text-left z-10">
            <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase">
              Club <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#F5A623]">San Sebastian</span>
            </h2>
            <p className="text-neutral-400 text-lg mb-8 max-w-md font-light">
              Escanea tu código en cada visita, acumula puntos y desbloquea recompensas exclusivas.
            </p>
            <ShinyButton
              onClick={irARegistro}
              className="bg-white text-black px-10 py-4 rounded-full text-lg font-black uppercase tracking-widest"
            >
              Obtener Membresía
            </ShinyButton>
          </div>

          <div className="flex-1 flex justify-center z-10">
            <div className="relative group w-full max-w-[350px]">
              <img
                src={TARJETA_QR}
                alt="Membresía San Sebastian"
                className="relative z-10 w-full drop-shadow-[0_20px_50px_rgba(217,93,57,0.3)] md:rotate-6 group-hover:rotate-0 transition-transform duration-700"
              />
              <BorderBeam size={300} duration={8} colorFrom="#7AC114" colorTo="#7AC114" />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 text-center text-neutral-500 border-t border-white/10 bg-black flex flex-col items-center gap-6 relative z-10">
        <div className="h-16 w-16 rounded-full overflow-hidden opacity-80 hover:opacity-100 transition-opacity border border-white/20 bg-[#74b649] flex items-center justify-center shadow-lg">
          <img
            src={LOGO}
            alt="Logo"
            className="h-full w-full object-cover scale-125"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.4em] uppercase font-black text-neutral-400">
            San Sebastian • {new Date().getFullYear()}
          </p>
          <p className="text-[10px] tracking-widest uppercase font-bold text-[#74b649]">
            Zaachila
          </p>
        </div>

        {/* Sección de créditos personales */}
        <div className="pt-4 border-t border-white/5 w-48">
          <p className="text-[9px] tracking-widest uppercase text-neutral-600">
            Diseñado y desarrollado por
          </p>
          <a
            href="https://wa.me/9511907270"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-neutral-400 hover:text-white transition-colors duration-300"
          >
            Ing.Yahir Omar Martinez Garcia
          </a>
        </div>
      </footer>
    </div>
  );
}