# 🎨 Landing Page - Página Principal de Ventas

## 📋 Descripción

Página principal de marketing/ventas para promocionar el sistema de gestión de turnos para peluquerías. Diseñada para convertir visitantes en clientes.

## 🎯 Características

### ✅ Secciones Implementadas

1. **Hero Section**
   - Título principal impactante
   - Descripción breve del producto
   - CTAs (Call to Action) principales
   - Información de prueba gratuita

2. **Features Section**
   - 6 características principales del sistema
   - Iconos visuales
   - Descripción clara de cada funcionalidad

3. **Pricing Section**
   - 3 planes de precios (Básico, Profesional, Empresarial)
   - Plan "Profesional" destacado como más popular
   - Lista de características por plan
   - CTAs por plan

4. **Testimonials Section**
   - 3 testimonios de clientes
   - Calificaciones con estrellas
   - Información de los clientes

5. **CTA Final**
   - Llamada a la acción final
   - Botones para comenzar o ver planes

6. **Footer**
   - Enlaces organizados por categorías
   - Información de contacto y legal
   - Copyright

### 🎨 Diseño

- **Tema Dark**: Consistente con el resto de la aplicación
- **Glass Morphism**: Efectos de vidrio esmerilado modernos
- **Animaciones**: Transiciones suaves con Framer Motion
- **Responsive**: Adaptado para móvil, tablet y desktop
- **Gradientes**: Uso de gradientes para destacar elementos importantes

## 🚀 Uso

### Ruta

La landing page está disponible en la ruta raíz:
```
http://localhost:5173/
```

### Navegación

- **Hero**: Botón "Comenzar Gratis" → redirige a `/login`
- **Features**: Scroll suave a sección de características
- **Pricing**: Botones "Comenzar Ahora" → redirige a `/login`
- **CTA Final**: Botones principales → redirigen a `/login` o `/pricing`

### Menú de Navegación

- **Desktop**: Menú horizontal con todas las opciones
- **Mobile**: Menú hamburguesa desplegable
- **Enlaces**: Scroll suave a secciones correspondientes

## 🎨 Personalización

### Cambiar Precios

Edita el array `pricingPlans` en `LandingPage.jsx`:

```jsx
const pricingPlans = [
  {
    name: "Básico",
    price: "$9.999",  // Cambia aquí
    // ...
  }
];
```

### Cambiar Características

Edita el array `features` en `LandingPage.jsx`:

```jsx
const features = [
  {
    icon: Calendar,
    title: "Título",
    description: "Descripción"
  }
];
```

### Cambiar Testimonios

Edita el array `testimonials` en `LandingPage.jsx`:

```jsx
const testimonials = [
  {
    name: "Nombre",
    role: "Rol",
    content: "Testimonio",
    rating: 5
  }
];
```

## 📱 Responsive

La página está completamente responsive:
- **Mobile**: Columnas apiladas, menú hamburguesa
- **Tablet**: 2 columnas para features/pricing
- **Desktop**: 3 columnas, diseño completo

## 🔗 Integración con App

### Flujo de Usuario

1. Usuario visita `/` → Ve la landing page
2. Hace clic en "Comenzar Gratis" → Va a `/login`
3. Si no está autenticado → Ve formulario de login
4. Si está autenticado → Redirige a `/{tenantSlug}/dashboard`

### Protección de Rutas

- `/` → Pública (landing page)
- `/login` → Pública (pero redirige si ya está autenticado)
- `/:tenantSlug/*` → Protegida (requiere autenticación)

## 🎯 Mejoras Futuras

Posibles mejoras:
- [ ] Formulario de contacto integrado
- [ ] Chat en vivo
- [ ] Video demo del producto
- [ ] Blog/recursos
- [ ] Integración con analytics
- [ ] A/B testing de CTAs
- [ ] Formulario de registro directo desde landing

## 📝 Notas

- Todos los botones de CTA redirigen a `/login` por ahora
- Puedes agregar un formulario de registro directo si lo necesitas
- Los precios están en pesos argentinos (ARS)
- Los testimonios son ejemplos y pueden ser reemplazados

