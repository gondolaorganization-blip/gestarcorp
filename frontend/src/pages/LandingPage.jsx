import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    id: "basico",
    name: "Básico",
    price: 49,
    annual: 39,
    desc: "Para agentes residentes independientes",
    color: "#10B981",
    features: [
      "Hasta 25 sociedades",
      "Alertas de vencimiento",
      "Obligaciones fiscales",
      "Portal cliente básico",
      "1 usuario agente",
      "Soporte por email",
    ],
    notIncluded: ["Screening / KYC", "Plantillas personalizadas", "Reportes avanzados"],
  },
  {
    id: "profesional",
    name: "Profesional",
    price: 99,
    annual: 79,
    desc: "Para firmas de agentes residentes",
    color: "#10B981",
    popular: true,
    features: [
      "Hasta 150 sociedades",
      "Screening AML/KYC integrado",
      "Plantillas de documentos",
      "Portal cliente completo",
      "5 usuarios agente",
      "Reportes de cumplimiento",
      "Soporte prioritario",
    ],
    notIncluded: ["Sociedades ilimitadas", "API pública"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    annual: 159,
    desc: "Para grandes firmas y grupos corporativos",
    color: "#10B981",
    features: [
      "Sociedades ilimitadas",
      "Usuarios ilimitados",
      "API pública documentada",
      "Integración con bancos",
      "Panel de cumplimiento avanzado",
      "Gerente de cuenta dedicado",
      "Onboarding personalizado",
    ],
    notIncluded: [],
  },
];

const FEATURES = [
  { icon: "🏢", title: "Gestión de Sociedades", desc: "Ficha completa de cada sociedad: directores, accionistas, capital, tomo y folio del Registro Público. Todo actualizado." },
  { icon: "⚠️", title: "Alertas de Vencimiento", desc: "Tasa Única, Aviso de Operación, Declaración de Renta y beneficiarios finales — alertas automáticas antes de cada vencimiento." },
  { icon: "🔍", title: "Screening y KYC", desc: "Verificación contra listas OFAC, ONU y PEPs. Cumplimiento con la Ley 23 de Panamá y estándares GAFI sin salir del sistema." },
  { icon: "🌐", title: "Portal del Cliente", desc: "Tus clientes acceden a sus sociedades, obligaciones y documentos en un portal seguro y profesional con tu marca." },
  { icon: "📋", title: "Cumplimiento y ARCO", desc: "Gestiona formularios de debida diligencia, ARCO, beneficiarios finales y toda la documentación regulatoria exigida." },
  { icon: "📄", title: "Plantillas de Documentos", desc: "Genera actas, resoluciones, poderes y cartas de renuncia desde plantillas preconfiguradas para el derecho societario panameño." },
];

const TESTIMONIALS = [
  { name: "Lic. Roberto Alfaro", role: "Agente Residente, Ciudad de Panamá", text: "Antes manejaba 80 sociedades en Excel. Ahora con GestarCorp tengo todo en orden y mis clientes me ven más profesional. Las alertas me han salvado de multas.", avatar: "RA" },
  { name: "Lcda. Verónica Sosa", role: "Firma Sosa & Méndez, Panamá", text: "El portal del cliente es lo que más valoran mis clientes. Pueden ver el estado de sus sociedades y descargar documentos en cualquier momento.", avatar: "VS" },
  { name: "Dr. Carlos Montoya", role: "Abogado Corporativo", text: "El módulo de screening me da la tranquilidad de que cada cliente pasa por la debida diligencia correcta. Indispensable para cumplimiento AML.", avatar: "CM" },
];

const FAQS = [
  { q: "¿Está alineado con la regulación panameña?", a: "Sí. GestarCorp está diseñado conforme a la Ley 23 de 2015 (AML/CFT), Ley 254 (beneficiarios finales), y los requerimientos del Registro Público de Panamá. Incluye los formularios y plazos vigentes." },
  { q: "¿Cómo funciona el portal del cliente?", a: "Cada sociedad puede tener acceso portal independiente. El cliente entra con su email y contraseña y ve sus obligaciones, documentos y el estado de su sociedad en tiempo real." },
  { q: "¿Puedo importar mis sociedades existentes?", a: "Sí. Ofrecemos importación desde Excel o CSV. Para el plan Enterprise el proceso es asistido sin costo adicional." },
  { q: "¿El screening está conectado a listas internacionales?", a: "Sí. El módulo de screening verifica contra OFAC SDN, listas de la ONU, PEPs panameños e internacionales. Las listas se actualizan automáticamente." },
  { q: "¿Hay período de prueba?", a: "Sí. 14 días de acceso completo sin tarjeta de crédito. Al finalizar puedes elegir tu plan o contactarnos." },
  { q: "¿Mis datos y los de mis clientes están seguros?", a: "Encriptación AES-256, backups automáticos diarios, acceso 2FA y auditoría completa de accesos. Cumplimos con la Ley 81 de Protección de Datos Personales de Panamá." },
];

export default function GestarCorpLanding() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const pricingRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToPricing = () => pricingRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "#F4F6F8", color: "#111827", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --emerald: #10B981;
          --emerald-dark: #059669;
          --navy: #0A1628;
          --navy2: #0F2C4C;
          --text: #111827;
          --muted: #6B7280;
        }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        .btn-emerald {
          background: var(--emerald); color: #fff; border: none; border-radius: 10px;
          padding: 13px 28px; font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'Outfit', sans-serif; transition: all 0.18s ease;
          box-shadow: 0 4px 20px rgba(16,185,129,0.35);
        }
        .btn-emerald:hover { background: var(--emerald-dark); transform: translateY(-1px); }
        .btn-ghost {
          background: transparent; color: rgba(255,255,255,0.85); border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 10px; padding: 12px 24px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.15s ease;
        }
        .btn-ghost:hover { border-color: var(--emerald); color: var(--emerald); }
        .btn-ghost-dark {
          background: transparent; color: var(--navy); border: 1.5px solid #D1D5DB;
          border-radius: 10px; padding: 9px 20px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.15s ease;
        }
        .btn-ghost-dark:hover { border-color: var(--emerald); color: var(--emerald); }
        .plan-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.12); }
        .faq-item { cursor: pointer; transition: background 0.15s; border-radius: 12px; }
        .faq-item:hover { background: #F3F4F6; }
        .feature-card { transition: all 0.2s ease; }
        .feature-card:hover { background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.07); transform: translateY(-2px); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .badge-popular {
          position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, #10B981, #059669);
          color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 0.08em;
          text-transform: uppercase; padding: 4px 16px; border-radius: 20px;
          white-space: nowrap; box-shadow: 0 4px 16px rgba(16,185,129,0.4);
        }
        .toggle-track { width: 44px; height: 24px; border-radius: 12px; background: #E5E7EB; position: relative; cursor: pointer; transition: background 0.2s; }
        .toggle-track.on { background: var(--emerald); }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
        .toggle-track.on .toggle-thumb { left: 23px; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "none",
        padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.25s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0A1628 0%, #10B981 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" }}>G</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: scrolled ? "#0A1628" : "#fff", letterSpacing: "-0.02em" }}>
            Gestar <span style={{ color: "#10B981" }}>Corp</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Funciones", "Precios", "FAQ"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              style={{ fontSize: 14, fontWeight: 600, color: scrolled ? "#4B5563" : "rgba(255,255,255,0.75)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => e.target.style.color = "#10B981"}
              onMouseLeave={e => e.target.style.color = scrolled ? "#4B5563" : "rgba(255,255,255,0.75)"}
            >{item}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost-dark" onClick={() => navigate("/login")}>Iniciar sesión</button>
          <button className="btn-emerald" style={{ padding: "9px 20px", fontSize: 13 }} onClick={scrollToPricing}>Empezar gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(150deg, #0A1628 0%, #0F2C4C 50%, #0A2018 100%)",
        position: "relative", overflow: "hidden", paddingTop: 80,
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "absolute", top: "20%", left: "8%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />

        <div style={{ textAlign: "center", maxWidth: 820, padding: "0 24px", position: "relative", zIndex: 1 }}>
          <div className="fade-up" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 20, padding: "6px 18px", marginBottom: 32,
          }}>
            <span style={{ fontSize: 10, color: "#10B981", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>🇵🇦 Gestión Corporativa · Panamá</span>
          </div>

          <h1 className="fade-up" style={{
            fontSize: "clamp(34px, 5.5vw, 64px)", fontWeight: 900, color: "#FFFFFF",
            lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24, animationDelay: "0.1s",
          }}>
            Administra tus sociedades<br />
            <span style={{ background: "linear-gradient(90deg, #10B981, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              con total cumplimiento
            </span>
          </h1>

          <p className="fade-up" style={{
            fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.7,
            maxWidth: 580, margin: "0 auto 40px", animationDelay: "0.2s",
          }}>
            La plataforma para agentes residentes y firmas corporativas en Panamá. Gestión de sociedades, cumplimiento AML, portal cliente y alertas de vencimiento en un solo sistema.
          </p>

          <div className="fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", animationDelay: "0.3s" }}>
            <button className="btn-emerald" style={{ fontSize: 16, padding: "15px 36px" }} onClick={scrollToPricing}>
              Empezar 14 días gratis
            </button>
            <button className="btn-ghost" style={{ fontSize: 16, padding: "15px 32px" }} onClick={() => navigate("/login")}>
              Iniciar sesión →
            </button>
          </div>

          <div className="fade-up" style={{ marginTop: 48, display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap", animationDelay: "0.4s" }}>
            {[["AML", "Integrado"], ["GAFI", "Cumplimiento"], ["OFAC", "Screening"], ["ARCO", "Formularios"]].map(([t, s]) => (
              <div key={t} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#10B981", fontFamily: "'DM Mono', monospace" }}>{t}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500, letterSpacing: "0.06em" }}>{s}</div>
              </div>
            ))}
          </div>

          {/* Dashboard mockup */}
          <div style={{ marginTop: 56, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 120px rgba(0,0,0,0.5)", background: "#111620" }}>
            <div style={{ background: "#0D1117", padding: "10px 16px", display: "flex", gap: 6, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["#FF6B6B", "#F5A623", "#10B981"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 18, marginLeft: 8, display: "flex", alignItems: "center", paddingLeft: 8 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>corp.gestarsoft.com/dashboard</span>
              </div>
            </div>
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { l: "Sociedades", v: "142", c: "#10B981" },
                { l: "Vencen 30 días", v: "8", c: "#F5A623" },
                { l: "Alertas activas", v: "3", c: "#FF6B6B" },
                { l: "Screening OK", v: "139", c: "#4E9AF1" },
              ].map(k => (
                <div key={k.l} style={{ background: "#0D1117", borderRadius: 8, padding: "12px 14px", border: `1px solid ${k.c}18` }}>
                  <div style={{ fontSize: 9, color: "#4B5675", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{k.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#E8EDFF", fontFamily: "'DM Mono', monospace" }}>{k.v}</div>
                  <div style={{ marginTop: 6, height: 2, background: `${k.c}22`, borderRadius: 1 }}>
                    <div style={{ height: "100%", width: "75%", background: k.c, borderRadius: 1 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funciones" style={{ padding: "100px 48px", background: "#F4F6F8" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-block", background: "#D1FAE5", color: "#059669", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 20, marginBottom: 16 }}>Funcionalidades</div>
            <h2 style={{ fontSize: 38, fontWeight: 900, color: "#0A1628", letterSpacing: "-0.025em", marginBottom: 14 }}>
              Todo lo que necesita un agente residente moderno
            </h2>
            <p style={{ fontSize: 16, color: "#6B7280", maxWidth: 500, margin: "0 auto" }}>Diseñado conforme a la legislación societaria panameña y los estándares internacionales de cumplimiento.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card" style={{ background: "#ECEFF2", borderRadius: 14, padding: "28px 24px", border: "1px solid transparent" }}>
                <div style={{ fontSize: 26, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0A1628", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" ref={pricingRef} style={{ padding: "100px 48px", background: "#0A1628" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", background: "rgba(16,185,129,0.12)", color: "#10B981", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 20, marginBottom: 16 }}>Precios</div>
            <h2 style={{ fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", marginBottom: 16 }}>Planes para cada tamaño de firma</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>Sin contratos. Cancela cuando quieras.</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: !annual ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>Mensual</span>
              <div className={`toggle-track${annual ? " on" : ""}`} onClick={() => setAnnual(!annual)}>
                <div className="toggle-thumb" />
              </div>
              <span style={{ fontSize: 14, color: annual ? "#10B981" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                Anual <span style={{ fontSize: 11, background: "rgba(16,185,129,0.15)", color: "#10B981", borderRadius: 10, padding: "2px 8px", fontWeight: 700 }}>−20%</span>
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
            {PLANS.map(plan => (
              <div key={plan.id} className="plan-card" style={{
                background: plan.popular ? "#fff" : "rgba(255,255,255,0.04)",
                border: plan.popular ? "2px solid #10B981" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "28px 22px", position: "relative",
              }}>
                {plan.popular && <div className="badge-popular">⭐ Más popular</div>}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: plan.popular ? "#0A1628" : "#fff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{plan.name}</div>
                  <p style={{ fontSize: 12, color: plan.popular ? "#6B7280" : "rgba(255,255,255,0.4)" }}>{plan.desc}</p>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 38, fontWeight: 900, color: plan.popular ? "#0A1628" : "#fff", fontFamily: "'DM Mono', monospace" }}>
                      B/. {annual ? plan.annual : plan.price}
                    </span>
                    <span style={{ fontSize: 13, color: plan.popular ? "#9CA3AF" : "rgba(255,255,255,0.35)", marginBottom: 8 }}>/mes</span>
                  </div>
                  {annual && <div style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>Ahorras B/. {(plan.price - plan.annual) * 12}/año</div>}
                </div>
                <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginBottom: 10, textAlign: "center" }}>✓ 14 días gratis · Sin tarjeta</div>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    width: "100%", marginBottom: 20, padding: "12px", fontSize: 13, fontWeight: 700,
                    borderRadius: 10, border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.15)",
                    background: plan.popular ? "#10B981" : "rgba(255,255,255,0.06)",
                    color: "#fff", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                    boxShadow: plan.popular ? "0 4px 20px rgba(16,185,129,0.4)" : "none",
                    transition: "all 0.15s",
                  }}
                >Comenzar prueba gratis</button>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#10B981", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 12, color: plan.popular ? "#374151" : "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map(f => (
                    <div key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, flexShrink: 0 }}>✗</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "100px 48px", background: "#F4F6F8" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: "#0A1628", letterSpacing: "-0.025em" }}>Lo que dicen los agentes residentes</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 18, color: "#10B981", marginBottom: 12, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #0A1628, #10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0A1628" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: "100px 48px", background: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: "#0A1628", letterSpacing: "-0.025em" }}>Preguntas frecuentes</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{faq.q}</span>
                  <span style={{ fontSize: 18, color: "#10B981", flexShrink: 0, transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </div>
                {openFaq === i && <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginTop: 10, paddingRight: 32 }}>{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 48px", background: "linear-gradient(135deg, #0A1628 0%, #0F2C4C 60%, #0A2018 100%)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 16 }}>Tu agencia corporativa, organizada</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", marginBottom: 36, lineHeight: 1.7 }}>
            Únete a los agentes residentes que ya gestionan sus sociedades, cumplen con AML y brindan un portal moderno a sus clientes.
          </p>
          <button className="btn-emerald" style={{ fontSize: 16, padding: "16px 44px" }} onClick={scrollToPricing}>
            Empezar 14 días gratis →
          </button>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 14 }}>Sin tarjeta · Sin contratos · Cancela cuando quieras</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#060C14", padding: "40px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #0A1628, #10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>G</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Gestar Corp · GestarSoft</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="mailto:soporte@gestarsoft.com" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Soporte</a>
          <a href="https://gestarsoft.com" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>GestarSoft.com</a>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2026 GestarSoft · Panamá</span>
      </footer>
    </div>
  );
}
