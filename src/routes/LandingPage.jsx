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
  Star,
  Menu,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Gestión de Turnos",
      description: "Calendario intuitivo para gestionar turnos, horarios y disponibilidad de tus estilistas."
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
      name: "Básico",
      price: "$9.999",
      period: "mes",
      description: "Perfecto para salones pequeños",
      features: [
        "Hasta 2 estilistas",
        "Calendario de turnos",
        "Base de clientes",
        "Notificaciones básicas",
        "Soporte por email"
      ],
      popular: false
    },
    {
      name: "Profesional",
      price: "$19.999",
      period: "mes",
      description: "Ideal para salones en crecimiento",
      features: [
        "Hasta 5 estilistas",
        "Todas las funciones básicas",
        "Pagos con Mercado Pago",
        "Bot de WhatsApp",
        "Comisiones y reportes",
        "Soporte prioritario"
      ],
      popular: true
    },
    {
      name: "Empresarial",
      price: "$39.999",
      period: "mes",
      description: "Para múltiples sucursales",
      features: [
        "Estilistas ilimitados",
        "Múltiples sucursales",
        "Reportes avanzados",
        "API personalizada",
        "Soporte 24/7",
        "Capacitación incluida"
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Directora de Studio Balance",
      content: "Desde que uso el sistema, mis turnos están organizados y no tengo más problemas con las faltas. ¡Totalmente recomendado!",
      rating: 5
    },
    {
      name: "Carlos Rodríguez",
      role: "Salón Men's Cut",
      content: "La integración con Mercado Pago es perfecta. Mis clientes pueden pagar la seña online y todo se actualiza automáticamente.",
      rating: 5
    },
    {
      name: "Ana Martínez",
      role: "Beauty Studio",
      content: "El bot de WhatsApp es increíble. Mis clientes pueden agendar turnos a cualquier hora sin que yo esté presente.",
      rating: 5
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
              href="#testimonials"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="landing-nav__link"
            >
              Recursos
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
              href="#testimonials"
              onClick={() => {
                document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
            >
              Recursos
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
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
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
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6"
            >
              Gestiona tu Negocio
              <br />
              <span className="text-gradient">
                de Forma Inteligente
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-foreground-secondary mb-8 max-w-3xl mx-auto"
            >
              Sistema ERP completo para gestionar turnos, stock, facturación y más. 
              Con pagos online, notificaciones automáticas y bot de WhatsApp integrado.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button
                onClick={() => navigate("/onboarding")}
                className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg"
              >
                Comenzar Gratis
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 bg-background-secondary text-foreground rounded-lg font-semibold hover:bg-border transition-colors border border-border"
              >
                Ver Características
              </button>
            </motion.div>
            <motion.p
              variants={fadeInUp}
              className="text-sm text-foreground-muted mt-6"
            >
              ✓ Prueba gratuita de 14 días • ✓ Sin tarjeta de crédito • ✓ Cancela cuando quieras
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              Herramientas poderosas diseñadas para hacer crecer tu negocio
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Planes que se adaptan a tu negocio
            </h2>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              Elige el plan perfecto para tu negocio. Todos incluyen prueba gratuita.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`card p-8 relative ${
                  plan.popular
                    ? "ring-2 ring-primary scale-105"
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
                    <span className="text-foreground-secondary ml-2">/{plan.period}</span>
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
                  onClick={() => navigate("/onboarding")}
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              Más de 100 negocios confían en nosotros para gestionar sus turnos y operaciones
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card card--space-lg"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-foreground-secondary mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-foreground-muted">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="card card--space-xl card--no-hover text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-xl text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Comienza tu prueba gratuita hoy mismo. Sin tarjeta de crédito, sin compromiso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Comenzar Gratis
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 bg-background-secondary text-foreground rounded-lg font-semibold hover:bg-border transition-colors border border-border"
              >
                Ver Planes
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <Logo size="default" showText={true} />
              </div>
              <p className="text-foreground-secondary text-sm">
                Sistema de gestión ERP para negocios modernos. Turnos, stock, facturación y más.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="#features" className="hover:text-foreground transition-colors">Características</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Precios</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Ayuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="#" className="hover:text-foreground transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-foreground-secondary">
            <p>&copy; {new Date().getFullYear()} ARJA ERP. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

