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

// Imágenes (Mantenemos tus rutas, idealmente reemplaza con fotos de la academia)
import IMG_SALSA from '../assets/3.png';
import IMG_XV from '../assets/2.png';
import IMG_ELECTRO from '../assets/1.png';
import TARJETA_QR from '../assets/qr2.png';
import LOGO from '../assets/logo.png';

const tagline = "Descubre tu ritmo, domina la pista y haz que tu evento brille como nunca.";

const reviews = [
  { name: "Valeria Gómez", body: "Montaron el vals de mis XV años y fue espectacular. Todos los invitados quedaron fascinados con la coreografía." },
  { name: "Carlos M.", body: "Los maestros de salsa son de otro nivel. Tienen muchísima paciencia y la academia tiene una energía increíble." },
  { name: "Sofía Ruiz", body: "Las clases de electro son intensas y súper divertidas. Definitivamente la mejor academia de Oaxaca." },
  { name: "Familia Hernández", body: "Contratamos el paquete de chambelanes y coreografía para mi hija. Profesionales, puntuales y creativos al 100%." },
];

export default function RhytmOaxacaPage() {
  const irALogin = () => { window.location.href = "/login"; };
  const irARegistro = () => { window.location.href = "/register"; };

  const handleWhatsappCotizacion = () => {
    const telefono = "9515694089";
    const mensaje = encodeURIComponent("¡Hola! Me gustaría pedir información sobre las clases y/o coreografías para XV años en Rhytm Oaxaca.");
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-50 font-sans overflow-hidden">

      {/* NAVBAR - Glassmorphism Premium */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-neutral-950/50 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 md:h-13 md:w-13 rounded-full overflow-hidden bg-[#C5A473] flex items-center justify-center shadow-[0_0_20px_rgba(197,164,115,0.3)]">
            <img
              src={LOGO}
              alt="Logo Rhytm Oaxaca"
              className="h-full w-full object-cover scale-150"
            />
          </div>
          <div className="text-xl md:text-2xl font-black tracking-widest text-white uppercase">
            Rhytm <span className="text-[#C5A473]">Oaxaca</span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <button
            onClick={irALogin}
            className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors uppercase tracking-widest hidden md:block"
          >
            Login
          </button>

          <ShinyButton
            onClick={irALogin}
            className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest block md:hidden"
          >
            Ingresar
          </ShinyButton>

          <ShinyButton
            onClick={irARegistro}
            className="bg-[#C5A473] text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hidden md:block"
          >
            Inscribirse
          </ShinyButton>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">

        {/* 1. Fondo de Resplandor (Glow) - Adaptado a Dorado */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,164,115,0.15),transparent_50%)]" />

        {/* 2. Partículas Doradas */}
        <Particles
          className="absolute inset-0 z-0"
          quantity={500}
          ease={70}
          color="#C5A473"
          refresh
        />

        {/* 3. Gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950" />

        <div className="z-10 flex flex-col items-center">
          {/* Badge con pulso Dorado */}
          <div className="relative px-4 py-1 rounded-full border border-[#C5A473]/50 bg-[#C5A473]/10 text-[#C5A473] text-xs font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md animate-pulse">
            Oaxaca de Juárez
          </div>

          {/* Título con sombra de color (Neon Gold Effect) */}
          <h1 className="text-7xl md:text-[10rem] font-black text-white mb-6 tracking-tighter uppercase leading-none">
            Rhytm <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A473] via-[#8C6A3B] to-[#C5A473] drop-shadow-[0_0_35px_rgba(197,164,115,0.5)]">
              Oaxaca
            </span>
          </h1>

          {/* Subtítulo animado */}
          <div className="text-xl md:text-3xl text-white/80 max-w-3xl mx-auto font-medium italic leading-relaxed">
            <TextGenerateEffect words={tagline} />
          </div>
        </div>

        {/* Decoración: Línea de luz inferior */}
        <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A473]/50 to-transparent" />
      </div>

      {/* SECCIÓN: CLASES Y SERVICIOS */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Aprende con <span className="text-[#C5A473]">Los Mejores</span></h2>
          <p className="text-neutral-400 mt-4">Técnica, pasión y los instructores top de la ciudad.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          {[
            { img: IMG_SALSA, title: "Salsa & Bachata", desc: "Aprende desde cero o perfecciona tus vueltas y estilo en pareja con ritmo latino." },
            { img: IMG_XV, title: "Vals de XV Años", desc: "Coreografías modernas, entradas triunfales y alquiler de chambelanes profesionales." },
            { img: IMG_ELECTRO, title: "Electro Dance", desc: "Siente el beat. Clases de shuffling, hip-hop y ritmos urbanos con alta energía." }
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

      {/* SECCIÓN: TESTIMONIOS */}
      <div className="py-20 bg-neutral-900/30 border-y border-white/5 relative z-10 overflow-hidden">
        <Marquee pauseOnHover className="[--duration:40s]">
          {reviews.map((review, i) => (
            <div key={i} className="mx-4 w-80 p-6 rounded-2xl bg-neutral-900/50 border border-white/10 backdrop-blur-sm">
              <div className="flex text-[#C5A473] mb-3 text-sm"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
              <p className="text-neutral-300 text-sm italic mb-4">"{review.body}"</p>
              <p className="text-white font-bold text-xs uppercase tracking-wider">— {review.name}</p>
            </div>
          ))}
        </Marquee>
      </div>

      {/* SECCIÓN DE EVENTOS ESPECIALES - XV AÑOS */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden w-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 md:p-16 bg-gradient-to-br from-[#1A1A1A] to-neutral-950 rounded-[3rem] border border-white/5 shadow-2xl">

          <Meteors number={40} />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight uppercase leading-tight">
              ¿Tu fiesta de XV merece <span className="text-[#C5A473]">ser épica?</span>
            </h2>

            <p className="text-neutral-400 text-lg mb-10 max-w-2xl mx-auto font-light">
              Diseñamos la coreografía de tus sueños. Desde el vals tradicional hasta el baile sorpresa más explosivo. Somos la academia #1 en producción de XV años en Oaxaca.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {["Coreografías", "Chambelanes", "Mix Musical", "Ensayos Privados"].map((event) => (
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
              <span className="uppercase tracking-wide text-white">Agendar Cita</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE ESTADÍSTICAS */}
      <section className="relative z-10 py-24 bg-neutral-950/50 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">

            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={2500} className="text-5xl md:text-7xl font-black text-[#C5A473]" />
                <span className="text-2xl font-bold text-[#C5A473]">+</span>
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">Alumnos Formados</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={350} className="text-5xl md:text-7xl font-black text-white" />
                <span className="text-2xl font-bold text-white">+</span>
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">Coreografías de XV</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={100} className="text-5xl md:text-7xl font-black text-[#8C6A3B]" />
                <span className="text-2xl font-bold text-[#8C6A3B]">%</span>
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">Satisfacción</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={15} className="text-5xl md:text-7xl font-black text-white" />
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">Años de Experiencia</p>
            </div>

          </div>
        </div>
      </section>

      {/* SECCIÓN MEMBRESÍA */}
      <div className="relative z-10 py-20 px-6 max-w-6xl mx-auto">
        <div className="relative bg-neutral-900 border border-white/10 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center gap-16 shadow-2xl overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C5A473]/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="flex-1 text-center md:text-left z-10">
            <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase">
              Alumno <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A473] to-[#8C6A3B]">Rhytm</span>
            </h2>
            <p className="text-neutral-400 text-lg mb-8 max-w-md font-light">
              Obtén acceso a nuestras clases de la semana, unete a nosotros pagando una mensualidad para tus clases favoritas.
            </p>
            <ShinyButton
              onClick={irARegistro}
              className="bg-white text-black px-10 py-4 rounded-full text-lg font-black uppercase tracking-widest"
            >
              Unirme a la Academia
            </ShinyButton>
          </div>

          <div className="flex-1 flex justify-center z-10">
            <div className="relative group w-full max-w-[350px]">
              <img
                src={TARJETA_QR}
                alt="Credencial Rhytm Oaxaca"
                className="relative z-10 w-full drop-shadow-[0_20px_50px_rgba(197,164,115,0.3)] md:rotate-6 group-hover:rotate-0 transition-transform duration-700"
              />
              <BorderBeam size={300} duration={8} colorFrom="#C5A473" colorTo="#8C6A3B" />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 text-center text-neutral-500 border-t border-white/10 bg-black flex flex-col items-center gap-6 relative z-10">
        <div className="h-16 w-16 rounded-full overflow-hidden opacity-80 hover:opacity-100 transition-opacity border border-white/20 bg-[#C5A473] flex items-center justify-center shadow-lg">
          <img
            src={LOGO}
            alt="Logo"
            className="h-full w-full object-cover scale-125"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.4em] uppercase font-black text-neutral-400">
            Rhytm Oaxaca • {new Date().getFullYear()}
          </p>
          <p className="text-[10px] tracking-widest uppercase font-bold text-[#C5A473]">
            Oaxaca de Juárez, México
          </p>
        </div>

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
            Ing. Yahir Omar Martinez Garcia
          </a>
        </div>
      </footer>
    </div>
  );
}