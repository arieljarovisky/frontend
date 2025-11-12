import { useId } from "react";

export default function Logo({ size = "default", showText = true, className = "" }) {
  const sizes = {
    small: "w-8 h-8",
    default: "w-10 h-10 sm:w-12 sm:h-12",
    large: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const textSizes = {
    small: "text-sm",
    default: "text-base sm:text-xl",
    large: "text-2xl sm:text-3xl",
    xl: "text-3xl sm:text-4xl"
  };

  const leftGradId = typeof useId === "function" ? `${useId()}-left` : "arja-logo-left";
  const rightGradId = typeof useId === "function" ? `${useId()}-right` : "arja-logo-right";
  const circuitGradId = typeof useId === "function" ? `${useId()}-circuit` : "arja-logo-circuit";

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Símbolo ARJA */}
      <div className={`${sizes[size]} relative flex-shrink-0`}>
        <div className="w-full h-full rounded-xl bg-white shadow-[0_18px_28px_rgba(15,35,59,0.2)] flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            className="w-4/5 h-4/5"
            role="img"
            aria-label="Logotipo ARJA"
          >
            <defs>
              <linearGradient id={leftGradId} x1="10%" y1="90%" x2="80%" y2="10%">
                <stop offset="0%" stopColor="#0B1D33" />
                <stop offset="100%" stopColor="#1A3352" />
              </linearGradient>
              <linearGradient id={rightGradId} x1="20%" y1="10%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#D2D6DB" />
                <stop offset="100%" stopColor="#8D96A4" />
              </linearGradient>
              <linearGradient id={circuitGradId} x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#B9BEC6" />
                <stop offset="100%" stopColor="#7E848C" />
              </linearGradient>
            </defs>

            {/* Pierna izquierda */}
            <path
              d="M32 92L54 28c1.3-3.6 4.7-6 8.5-6h9.5L51 92H32Z"
              fill={`url(#${leftGradId})`}
            />

            {/* Pierna derecha */}
            <path
              d="M68 22h12c3.5 0 6.7 1.9 8.4 5l-27.3 65H40.6L68 22Z"
              fill={`url(#${rightGradId})`}
            />

            {/* Traviesa */}
            <path
              d="M48 55h50c2.2 0 4 1.8 4 4v6c0 2.2-1.8 4-4 4H48c-2.2 0-4-1.8-4-4v-6c0-2.2 1.8-4 4-4Z"
              fill="#0F233B"
            />

            {/* Vaciado interior */}
            <path
              d="M60 48h10l-12 28H48l12-28Z"
              fill="#F4F6F8"
            />

            {/* Circuitos */}
            {[40, 58, 76].map((y) => (
              <g key={y}>
                <line
                  x1="86"
                  y1={y}
                  x2="110"
                  y2={y}
                  stroke={`url(#${circuitGradId})`}
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="114" cy={y} r="6" fill="#7E848C" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Texto: ARJA ERP */}
      {showText && (
        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-baseline gap-1 text-primary ${textSizes[size]} leading-tight`}>
            <h1 className="font-semibold tracking-tight">
              ARJA
            </h1>
            <span className={`font-medium text-accent ${size === 'small' ? 'text-xs leading-none' : 'text-sm sm:text-base'} `}>
              ERP
            </span>
          </div>
          {size !== 'small' && (
            <p className="text-[10px] sm:text-xs text-foreground-muted leading-tight mt-0.5 uppercase tracking-[0.12em] whitespace-normal break-words">
              Gestión Empresarial Inteligente
            </p>
          )}
        </div>
      )}
    </div>
  );
}

