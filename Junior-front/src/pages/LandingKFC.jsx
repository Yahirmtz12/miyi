import React from "react";
import { TextGenerateEffect } from "../components/magicui/TextGenerateEffect";
import { BorderBeam } from "../components/magicui/BorderBeam";
import Particles from "../components/magicui/Particles";
import Marquee from "../components/magicui/Marquee";
import { MagicCard } from "../components/magicui/MagicCard";
import Meteors from "../components/magicui/Meteors";
import ShinyButton from "../components/magicui/ShinyButton";
import NumberTicker from "../components/magicui/NumberTicker";
import { FaWhatsapp, FaStar } from "react-icons/fa";
import { FiScissors, FiClock, FiCalendar, FiMapPin } from "react-icons/fi";

import IMG_HERO from '../assets/hero-barber.png';
import IMG_SERVICES from '../assets/services-barber.png';

const tagline = "Tu estilo, nuestra pasión. Cortes premium, ambiente único y atención personalizada.";

const WHATSAPP_BARBER = '9513235437';

const reviews = [
  { name: "Marco A.", body: "El mejor corte que me han hecho. El ambiente del lugar es increíble, muy profesional y el detalle en cada corte se nota." },
  { name: "Daniel R.", body: "Siempre salgo satisfecho. La atención es de primera y el sistema de citas hace todo más fácil, sin esperas." },
  { name: "Carlos G.", body: "Excelente servicio, el barber se toma su tiempo para dejarte exactamente como quieres. 100% recomendado." },
  { name: "Luis M.", body: "Llevé a mi hijo por primera vez y quedó encantado. Muy buen trato y un corte perfecto. Ya somos clientes frecuentes." },
];

const servicios = [
  {
    icon: "✂️",
    title: "Corte Clásico",
    desc: "Corte de cabello personalizado con técnicas profesionales y acabado perfecto.",
    price: "$150",
    duration: "1 hora",
  },
  {
    icon: "🪒",
    title: "Barba",
    desc: "Perfilado y arreglo de barba con navaja y toalla caliente para un look impecable.",
    price: "+$50",
    duration: "Extra",
    isExtra: true,
  },
  {
    icon: "👁️",
    title: "Ceja",
    desc: "Diseño y perfilado de cejas para complementar tu look con un acabado limpio.",
    price: "+$50",
    duration: "Extra",
    isExtra: true,
  },
];

export default function LandingXolos() {
  const irALogin = () => { window.location.href = "/login"; };
  const irARegistro = () => { window.location.href = "/register"; };
  const irAAgendar = () => { window.location.href = "/agendar"; };

  const handleWhatsapp = () => {
    const mensaje = encodeURIComponent("¡Hola! Me gustaría agendar una cita en Xolos Barbershop 💈");
    window.open(`https://wa.me/52${WHATSAPP_BARBER}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-50 font-sans overflow-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-neutral-950/50 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full overflow-hidden bg-[#C5A473] flex items-center justify-center shadow-[0_0_20px_rgba(197,164,115,0.3)]">
            <FiScissors className="text-white text-xl" />
          </div>
          <div className="text-xl md:text-2xl font-black tracking-widest text-white uppercase">
            Xolos <span className="text-[#C5A473]">Barbershop</span>
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
            onClick={irAAgendar}
            className="bg-[#C5A473] text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
          >
            Agendar Cita
          </ShinyButton>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <img src={IMG_HERO} alt="Barbershop" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-neutral-950/60 to-neutral-950" />
        </div>

        {/* Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,164,115,0.15),transparent_50%)]" />

        {/* Partículas */}
        <Particles
          className="absolute inset-0 z-0"
          quantity={300}
          ease={70}
          color="#C5A473"
          refresh
        />

        <div className="z-10 flex flex-col items-center">
          <div className="relative px-4 py-1 rounded-full border border-[#C5A473]/50 bg-[#C5A473]/10 text-[#C5A473] text-xs font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md animate-pulse flex items-center gap-2">
            <FiScissors className="text-sm" /> Barbería Premium
          </div>

          <h1 className="text-6xl md:text-[9rem] font-black text-white mb-6 tracking-tighter uppercase leading-none">
            Xolos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A473] via-[#8C6A3B] to-[#C5A473] drop-shadow-[0_0_35px_rgba(197,164,115,0.5)]">
              Barber
            </span>
          </h1>

          <div className="text-xl md:text-3xl text-white/80 max-w-3xl mx-auto font-medium italic leading-relaxed">
            <TextGenerateEffect words={tagline} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <button
              onClick={irAAgendar}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#C5A473] text-white rounded-full font-black text-sm md:text-base uppercase tracking-widest transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(197,164,115,0.4)]"
            >
              <FiCalendar className="text-xl group-hover:animate-bounce" />
              Agendar Cita
            </button>
            <button
              onClick={handleWhatsapp}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#25D366] text-white rounded-full font-black text-sm md:text-base uppercase tracking-widest transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(37,211,102,0.4)]"
            >
              <FaWhatsapp className="text-xl group-hover:animate-bounce" />
              WhatsApp
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A473]/50 to-transparent" />
      </div>

      {/* SECCIÓN: SERVICIOS */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            Nuestros <span className="text-[#C5A473]">Servicios</span>
          </h2>
          <p className="text-neutral-400 mt-4">Calidad y atención en cada detalle.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {servicios.map((item, i) => (
            <MagicCard key={i} className="relative bg-neutral-900 border-white/10 rounded-[2rem] p-8 text-center flex flex-col items-center justify-between shadow-2xl min-h-[320px]">
              <div className="text-5xl mb-4">{item.icon}</div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">{item.title}</h3>
                <p className="text-neutral-400 mt-4 font-light text-sm">{item.desc}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-3xl font-black ${item.isExtra ? 'text-[#8C6A3B]' : 'text-[#C5A473]'}`}>
                  {item.price}
                </span>
                <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold flex items-center gap-1">
                  <FiClock className="text-sm" /> {item.duration}
                </span>
              </div>
            </MagicCard>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={irAAgendar}
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-white text-black hover:bg-neutral-200 rounded-full font-black text-sm md:text-base uppercase tracking-widest transition-all hover:scale-105"
          >
            <FiCalendar className="text-lg" />
            Agendar Ahora
          </button>
        </div>
      </div>

      {/* SECCIÓN: POR QUÉ ELEGIRNOS */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="relative overflow-hidden w-full min-h-[500px] flex flex-col md:flex-row items-center gap-8 p-8 md:p-16 bg-gradient-to-br from-[#1A1A1A] to-neutral-950 rounded-[3rem] border border-white/5 shadow-2xl">
          <Meteors number={30} />
          
          <div className="flex-1 z-10">
            <img src={IMG_SERVICES} alt="Barbero trabajando" className="w-full max-w-md mx-auto rounded-3xl shadow-2xl shadow-[#C5A473]/10 border border-white/5" />
          </div>

          <div className="flex-1 z-10 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight uppercase leading-tight">
              Agenda sin <span className="text-[#C5A473]">complicaciones</span>
            </h2>
            <p className="text-neutral-400 text-lg mb-8 font-light">
              Olvídate de las filas y la espera. Selecciona el horario que te convenga, 
              recibe confirmación directa del barbero y llega listo para tu corte.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {["Sin esperas", "Horario flexible", "Confirmación directa", "WhatsApp"].map((tag) => (
                <span key={tag} className="px-5 py-2 bg-white/5 rounded-full text-xs font-black uppercase tracking-widest border border-white/10 text-white backdrop-blur-md">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: TESTIMONIOS */}
      <div className="py-20 bg-neutral-900/30 border-y border-white/5 relative z-10 overflow-hidden">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
            Lo que dicen nuestros <span className="text-[#C5A473]">clientes</span>
          </h2>
        </div>
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

      {/* SECCIÓN DE ESTADÍSTICAS */}
      <section className="relative z-10 py-24 bg-neutral-950/50 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={5000} className="text-5xl md:text-7xl font-black text-[#C5A473]" />
                <span className="text-2xl font-bold text-[#C5A473]">+</span>
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">Cortes Realizados</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={100} className="text-5xl md:text-7xl font-black text-white" />
                <span className="text-2xl font-bold text-white">%</span>
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">Satisfacción</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={1500} className="text-5xl md:text-7xl font-black text-[#8C6A3B]" />
                <span className="text-2xl font-bold text-[#8C6A3B]">+</span>
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">Clientes Felices</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <NumberTicker value={5} className="text-5xl md:text-7xl font-black text-white" />
              </div>
              <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">Años de Experiencia</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN CTA FINAL */}
      <div className="relative z-10 py-20 px-6 max-w-6xl mx-auto">
        <div className="relative bg-neutral-900 border border-white/10 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C5A473]/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
              ¿Listo para tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A473] to-[#8C6A3B]">nuevo look?</span>
            </h2>
            <p className="text-neutral-400 text-lg mb-8 max-w-2xl mx-auto font-light">
              Agenda tu cita en segundos. Sin llamar, sin esperar. El barbero confirma directo a tu WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ShinyButton
                onClick={irAAgendar}
                className="bg-[#C5A473] text-white px-10 py-4 rounded-full text-lg font-black uppercase tracking-widest"
              >
                💈 Agendar Cita
              </ShinyButton>
              <ShinyButton
                onClick={irARegistro}
                className="bg-white text-black px-10 py-4 rounded-full text-lg font-black uppercase tracking-widest"
              >
                Crear Cuenta
              </ShinyButton>
            </div>
          </div>
          <BorderBeam size={300} duration={8} colorFrom="#C5A473" colorTo="#8C6A3B" />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 text-center text-neutral-500 border-t border-white/10 bg-black flex flex-col items-center gap-6 relative z-10">
        <div className="h-16 w-16 rounded-full overflow-hidden border border-white/20 bg-[#C5A473] flex items-center justify-center shadow-lg">
          <FiScissors className="text-white text-2xl" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.4em] uppercase font-black text-neutral-400">
            Xolos Barbershop • {new Date().getFullYear()}
          </p>
          <p className="text-[10px] tracking-widest uppercase font-bold text-[#C5A473] flex items-center gap-1 justify-center">
            <FiMapPin className="text-xs" /> Oaxaca de Juárez, México
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