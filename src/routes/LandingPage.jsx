import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Bell, 
  Smartphone, 
  Shield, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  MessageSquare,
  FileSpreadsheet,
  Building2,
  UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";
import ChatWidget from "../components/ChatWidget";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Cambiar el título de la página
  useEffect(() => {
    document.title = "ARJA ERP | Sistema de Gestión Empresarial";
  }, []);

  const features = [
    {
      icon: Calendar,
      title: "Gestión de Turnos",
      description: "Calendario intuitivo para gestionar turnos, horarios y disponibilidad de tus profesionales y servicios."
    },
    {
      icon: Users,
      title: "Base de Clientes",
      description: "Administra tu base de clientes con historial completo de servicios y preferencias."
    },
    {
      icon: DollarSign,
      title: "Pagos con Mercado Pago",
      description: "Acepta señas y pagos online de forma segura con integración completa de Mercado Pago."
    },
    {
      icon: Bell,
      title: "Notificaciones Automáticas",
      description: "Recordatorios automáticos por WhatsApp para reducir faltas y mejorar la asistencia."
    },
    {
      icon: Smartphone,
      title: "WhatsApp Integrado",
      description: "Bot inteligente que permite a tus clientes agendar turnos directamente por WhatsApp."
    },
    {
      icon: Shield,
      title: "Seguro y Confiable",
      description: "Datos protegidos con seguridad de nivel empresarial y respaldos automáticos."
    }
  ];

  const pricingPlans = [
    {
      name: "Esencial",
      price: "$14.900",
      period: "mes",
      description: "Para negocios que están comenzando",
      features: [
        "Hasta 2 profesionales",
        "Agenda inteligente de turnos",
        "Recordatorios automáticos",
        "Clientes ilimitados",
        "Reportes básicos"
      ],
      popular: false
    },
    {
      name: "Crecimiento",
      price: "$24.900",
      period: "mes",
      description: "Ideal para equipos en expansión",
      features: [
        "Hasta 6 profesionales",
        "Pagos y señas con Mercado Pago",
        "WhatsApp Bot para reservas",
        "Control de stock y comisiones",
        "Tableros y reportes pro",
        "Soporte prioritario"
      ],
      popular: true
    },
    {
      name: "Escala",
      price: "$44.900",
      period: "mes",
      description: "Operaciones con varias sucursales",
      features: [
        "Profesionales ilimitados",
        "Hasta 2 sucursales operando en simultáneo",
        "Multi-sucursal con roles avanzados",
        "Automatizaciones y campañas",
        "Integración AFIP / ARCA",
        "Dashboards financieros",
        "WhatsApp avanzado + flujos especiales",
        "Onboarding guiado"
      ],
      popular: false
    },
    {
      name: "Pro a medida",
      price: "Consultar",
      period: "",
      description: "Implementación custom y acompañamiento dedicado",
      features: [
        "Arquitectura multi-tenant",
        "Sucursales ilimitadas a medida",
        "API y flujos personalizados",
        "Integraciones externas",
        "Capacitación in-company",
        "SLA y soporte 24/7",
        "Launch plan con especialista"
      ],
      popular: false
    }
  ];

  const stats = [
    {
      value: "100%",
      label: "Automatización",
      description: "De tus procesos de gestión"
    },
    {
      value: "24/7",
      label: "Disponibilidad",
      description: "Para tus clientes y tu negocio"
    },
    {
      value: "99.9%",
      label: "Uptime",
      description: "De disponibilidad del servicio"
    },
    {
      value: "+50",
      label: "Funcionalidades",
      description: "Integradas en un solo sistema"
    }
  ];

  const useCases = [
    {
      icon: Calendar,
      title: "Servicios por Turnos",
      description: "Ideal para negocios que trabajan con citas: salones, barberías, spas, centros de estética, consultorios y más."
    },
    {
      icon: Users,
      title: "Servicios con Equipos",
      description: "Gestiona múltiples profesionales, horarios, disponibilidad y asignación de recursos en tiempo real."
    },
    {
      icon: DollarSign,
      title: "Negocios con Pagos Online",
      description: "Acepta señas, pagos anticipados y membresías recurrentes integrado con Mercado Pago."
    },
    {
      icon: Bell,
      title: "Comunicación Automatizada",
      description: "Recordatorios automáticos, confirmaciones y seguimiento por WhatsApp sin intervención manual."
    },
    {
      icon: FileSpreadsheet,
      title: "Facturación Electrónica",
      description: "Facturación AFIP/ARCA integrada, control de stock, reportes financieros y gestión contable."
    },
    {
      icon: Building2,
      title: "Múltiples Sucursales",
      description: "Administra varias ubicaciones desde un solo sistema con control centralizado y reportes consolidados."
    },
    {
      icon: Zap,
      title: "Servicios Rápidos",
      description: "Para negocios que necesitan agilidad: reservas instantáneas, check-in rápido y gestión eficiente."
    },
    {
      icon: Shield,
      title: "Negocios Regulados",
      description: "Cumplimiento normativo, trazabilidad, respaldos automáticos y seguridad de datos empresarial."
    }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav__container">
          <div className="landing-nav__brand">
            <Logo size="default" showText={true} />
          </div>

          <div className="landing-nav__links">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="landing-nav__link"
            >
              Funcionalidades
            </a>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="landing-nav__link"
            >
              Precios
            </a>
            <a
              href="#use-cases"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("use-cases")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="landing-nav__link"
            >
              Casos de Uso
            </a>
            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                navigate("/docs");
              }}
              className="landing-nav__link"
            >
              Documentación
            </a>
            <div className="landing-nav__auth">
              <ThemeToggle />
              <button
                onClick={() => navigate("/login")}
                className="btn-ghost btn--compact"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => navigate("/onboarding")}
                className="btn-primary btn--compact"
              >
                Comenzar Gratis
              </button>
            </div>
          </div>

          <button
            className="landing-nav__toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="landing-nav__mobile">
            <a
              href="#features"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
            >
              Funcionalidades
            </a>
            <a
              href="#pricing"
              onClick={() => {
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
            >
              Precios
            </a>
            <a
              href="#use-cases"
              onClick={() => {
                document.getElementById("use-cases")?.scrollIntoView({ behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
            >
              Casos de Uso
            </a>
            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                navigate("/docs");
              }}
            >
              Documentación
            </a>
            <div className="landing-nav__mobile-theme">
              <ThemeToggle />
            </div>
            <button
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="btn-ghost w-full"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                navigate("/onboarding");
                setMobileMenuOpen(false);
              }}
              className="btn-primary w-full"
            >
              Comenzar Gratis
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:pt-32 sm:pb-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-4 sm:mb-6"
            >
              Gestiona tu Negocio
              <br />
              <span className="text-gradient">
                de Forma Inteligente
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground-secondary mb-6 sm:mb-8 max-w-3xl mx-auto px-4"
            >
              Sistema ERP completo para gestionar turnos, stock, facturación y más. 
              Con pagos online, notificaciones automáticas y bot de WhatsApp integrado.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
            >
              <button
                onClick={() => navigate("/onboarding")}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
              >
                Comenzar Gratis
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-background-secondary text-foreground rounded-lg font-semibold hover:bg-border transition-colors border border-border text-sm sm:text-base"
              >
                Ver Características
              </button>
            </motion.div>
            <motion.p
              variants={fadeInUp}
              className="text-xs sm:text-sm text-foreground-muted mt-4 sm:mt-6 px-4"
            >
              ✓ Prueba gratuita de 14 días • ✓ Sin tarjeta de crédito • ✓ Cancela cuando quieras
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-foreground-secondary max-w-2xl mx-auto px-4">
              Herramientas poderosas diseñadas para hacer crecer tu negocio
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card card--space-lg"
                >
                  <div className="w-12 h-12 bg-primary-light dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-foreground-secondary">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              Planes que se adaptan a tu negocio
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-foreground-secondary max-w-2xl mx-auto px-4">
              Elige el plan perfecto para tu negocio. Todos incluyen prueba gratuita.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`card p-6 sm:p-8 relative ${
                  plan.popular
                    ? "ring-2 ring-primary sm:scale-105"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Más Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-foreground-secondary text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-foreground-secondary ml-2">/{plan.period}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (plan.name === "Pro a medida") {
                      navigate("/enterprise-request");
                    } else {
                      navigate("/onboarding");
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary-hover"
                      : "bg-background-secondary text-foreground hover:bg-border border border-border"
                  }`}
                >
                  Comenzar Ahora
                </button>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-foreground-secondary mt-8"
          >
            Todos los planes incluyen prueba gratuita de 14 días. Sin tarjeta de crédito.
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              Sistema confiable y robusto
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-foreground-secondary max-w-2xl mx-auto px-4">
              Tecnología de nivel empresarial al alcance de tu negocio
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center px-2"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-1">
                  {stat.label}
                </div>
                <div className="text-xs sm:text-sm text-foreground-secondary">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              Ideal para cualquier negocio de servicios
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-foreground-secondary max-w-2xl mx-auto px-4">
              Desde pequeños emprendimientos hasta empresas con múltiples sucursales
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card card--space-lg"
                >
                  <div className="w-12 h-12 bg-primary-light dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-foreground-secondary">
                    {useCase.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="card card--space-lg sm:card--space-xl card--no-hover text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-foreground-secondary mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Comienza tu prueba gratuita hoy mismo. Sin tarjeta de crédito, sin compromiso.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
              >
                Comenzar Gratis
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => {
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-background-secondary text-foreground rounded-lg font-semibold hover:bg-border transition-colors border border-border text-sm sm:text-base"
              >
                Ver Planes
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="mb-4">
                <Logo size="default" showText={true} />
              </div>
              <p className="text-foreground-secondary text-sm">
                Sistema de gestión ERP para cualquier negocio de servicios. Turnos, stock, facturación, membresías y más.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="#features" className="hover:text-foreground transition-colors">Características</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Precios</a></li>
                <li><a href="#use-cases" className="hover:text-foreground transition-colors">Casos de Uso</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="/docs" onClick={(e) => { e.preventDefault(); navigate("/docs"); }} className="hover:text-foreground transition-colors">Documentación</a></li>
                <li><a href="/help" onClick={(e) => { e.preventDefault(); navigate("/help"); }} className="hover:text-foreground transition-colors">Ayuda</a></li>
                <li><a href="/contact" onClick={(e) => { e.preventDefault(); navigate("/contact"); }} className="hover:text-foreground transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="/terms" onClick={(e) => { e.preventDefault(); navigate("/terms"); }} className="hover:text-foreground transition-colors">Términos</a></li>
                <li><a href="/privacy.html" className="hover:text-foreground transition-colors">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-foreground-secondary">
            <p>&copy; {new Date().getFullYear()} ARJA ERP. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}

