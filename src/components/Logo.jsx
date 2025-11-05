import { Calendar, TrendingUp } from "lucide-react";

export default function Logo({ size = "default", showText = true, className = "" }) {
  const sizes = {
    small: "w-8 h-8",
    default: "w-10 h-10 sm:w-12 sm:h-12",
    large: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const textSizes = {
    small: "text-sm",
    default: "text-lg sm:text-xl",
    large: "text-2xl sm:text-3xl",
    xl: "text-3xl sm:text-4xl"
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Icono: Calendario con gráfico de crecimiento */}
      <div className={`${sizes[size]} relative flex-shrink-0`}>
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center shadow-lg">
          {/* Calendario */}
          <Calendar className="w-3/5 h-3/5 text-white" strokeWidth={2.5} />
          
          {/* Gráfico de crecimiento dentro */}
          <div className="absolute inset-0 flex items-end justify-center pb-1.5">
            <div className="flex items-end gap-0.5 h-2/5">
              {/* Barras del gráfico */}
              <div className="w-1 bg-white/60 rounded-t" style={{ height: '30%' }}></div>
              <div className="w-1 bg-white/80 rounded-t" style={{ height: '50%' }}></div>
              <div className="w-1 bg-white rounded-t" style={{ height: '70%' }}></div>
            </div>
            {/* Línea y flecha */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3/5 h-0.5 bg-white/80"></div>
            <TrendingUp className="absolute top-0.5 right-0.5 w-2 h-2 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Texto: Agendly ERP */}
      {showText && (
        <div className="min-w-0 flex-shrink-0">
          <div className={`flex items-baseline gap-1.5 ${textSizes[size]}`}>
            <h1 className="font-bold text-blue-900 dark:text-blue-100">
              Agendly
            </h1>
            <span className={`font-semibold text-blue-700 dark:text-blue-300 ${size === 'small' ? 'text-xs' : 'text-sm sm:text-base'}`}>
              ERP
            </span>
          </div>
          {size !== 'small' && (
            <p className="text-[10px] sm:text-xs text-foreground-muted leading-tight mt-0.5">
              Sistema de Gestión
            </p>
          )}
        </div>
      )}
    </div>
  );
}

