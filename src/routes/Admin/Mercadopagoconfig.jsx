// src/routes/Admin/MercadoPagoConfig.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
    CreditCard,
    DollarSign,
    Percent,
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    LogOut,
    Loader2,
    CheckCircle,
    XCircle
} from 'lucide-react';

export default function MercadoPagoConfig() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [config, setConfig] = useState({
        deposit_enabled: false,
        deposit_percentage: 20,
        deposit_amount_fixed: null,
    });

    const [mpStatus, setMpStatus] = useState({
        connected: false,
        userId: null,
        loading: true,
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [connectingMP, setConnectingMP] = useState(false);

    useEffect(() => {
        loadConfig();
        checkMPStatus();
    }, []);

    // Manejar parámetros de URL después de OAuth
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'true') {
            setMessage('mp_connected');
            checkMPStatus(); // Recargar estado
            // Limpiar URL
            navigate(window.location.pathname, { replace: true });
            setTimeout(() => setMessage(''), 5000);
        }

        if (error) {
            if (error === 'cancelled') {
                setMessage('mp_cancelled');
            } else {
                setMessage('mp_error');
            }
            navigate(window.location.pathname, { replace: true });
            setTimeout(() => setMessage(''), 5000);
        }
    }, [searchParams, navigate]);

    const loadConfig = async () => {
        try {
            const data = await apiClient.getConfig();
            setConfig(prev => ({ ...prev, ...data }));
        } catch (err) {
            console.error('Error cargando config:', err);
        }
    };

    const checkMPStatus = async () => {
        try {
            setMpStatus(prev => ({ ...prev, loading: true }));
            const data = await apiClient.getMPStatus();
            setMpStatus({
                connected: data.connected || false,
                userId: data.userId || null,
                loading: false,
            });
        } catch (err) {
            console.error('Error verificando estado MP:', err);
            setMpStatus({ connected: false, userId: null, loading: false });
        }
    };

    const handleConnectMP = async () => {
        try {
            setConnectingMP(true);
            setMessage('');

            // Verificar que tengamos autenticación
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.tenantId) {
                setMessage('error');
                setConnectingMP(false);
                return;
            }

            const data = await apiClient.getMPAuthUrl();

            if (data.ok && data.authUrl) {
                window.location.href = data.authUrl;
            } else {
                setMessage('error');
                setConnectingMP(false);
            }
        } catch (err) {
            console.error('Error conectando MP:', err);
            setMessage('error');
            setConnectingMP(false);
        }
    };

    const handleDisconnectMP = async () => {
        if (!confirm('¿Estás seguro de desconectar Mercado Pago?')) return;

        try {
            const data = await apiClient.disconnectMP();
            if (data.ok) {
                setMpStatus({ connected: false, userId: null, loading: false });
                setMessage('mp_disconnected');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error('Error desconectando MP:', err);
            setMessage('error');
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage('');
            await apiClient.updateConfig(config);
            setMessage('success');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('error');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    const depositType = config.deposit_amount_fixed ? 'fixed' : 'percentage';

    // Mensajes
    const getMessageComponent = () => {
        const messages = {
            success: { icon: CheckCircle2, color: 'green', text: '¡Configuración guardada!' },
            error: { icon: XCircle, color: 'red', text: 'Error al guardar' },
            mp_connected: { icon: CheckCircle, color: 'green', text: '¡Mercado Pago conectado exitosamente!' },
            mp_disconnected: { icon: CheckCircle, color: 'green', text: 'Mercado Pago desconectado' },
            mp_cancelled: { icon: AlertCircle, color: 'yellow', text: 'Conexión cancelada' },
            mp_error: { icon: XCircle, color: 'red', text: 'Error al conectar con Mercado Pago' },
        };

        if (!message || !messages[message]) return null;

        const { icon: Icon, color, text } = messages[message];
        const colorClasses = {
            green: 'bg-green-500/10 border-green-500/30 text-green-400',
            red: 'bg-red-500/10 border-red-500/30 text-red-400',
            yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        };

        return (
            <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm animate-in slide-in-from-top-2 ${colorClasses[color]}`}>
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{text}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <CreditCard className="w-6 h-6 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Mercado Pago</h1>
                    </div>
                    <p className="text-gray-400">Configurá los pagos y señas para tu negocio</p>
                </div>

                {/* Mensajes */}
                {getMessageComponent()}

                <div className="grid gap-6">

                    {/* Card de conexión OAuth */}
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Conexión con Mercado Pago</h3>

                            {mpStatus.loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                                </div>
                            ) : mpStatus.connected ? (
                                // Conectado
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-white font-medium">Cuenta conectada</p>
                                            <p className="text-sm text-gray-400">Usuario MP: {mpStatus.userId}</p>
                                        </div>
                                        <button
                                            onClick={handleDisconnectMP}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Desconectar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // No conectado
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                        <p className="text-gray-300 mb-4">
                                            Conectá tu cuenta de Mercado Pago para empezar a recibir pagos de señas de forma segura.
                                        </p>
                                        <button
                                            onClick={handleConnectMP}
                                            disabled={connectingMP}
                                            className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30"
                                        >
                                            {connectingMP ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Conectando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                    </svg>
                                                    Conectar con Mercado Pago
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                                        <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-gray-400">
                                            <p className="mb-2">Al conectar, Mercado Pago te pedirá autorización para:</p>
                                            <ul className="space-y-1 list-disc list-inside ml-2">
                                                <li>Crear preferencias de pago</li>
                                                <li>Recibir notificaciones de pagos</li>
                                                <li>Acceder a información de transacciones</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card principal de configuración */}
                    {mpStatus.connected && (
                        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">

                            {/* Toggle de activación */}
                            <div className="p-6 border-b border-gray-700/50">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <DollarSign className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Requerir pago de seña</h3>
                                            <p className="text-sm text-gray-400">Los clientes deberán pagar antes de confirmar</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={config.deposit_enabled}
                                            onChange={e => setConfig({ ...config, deposit_enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
                                    </div>
                                </label>
                            </div>

                            {/* Configuración de seña */}
                            {config.deposit_enabled && (
                                <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">

                                    {/* Divisor */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-700/50"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-gray-800 px-4 text-gray-400">Configuración de seña</span>
                                        </div>
                                    </div>

                                    {/* Tipo de seña - Cards */}
                                    <div className="grid md:grid-cols-2 gap-4">

                                        {/* Porcentaje */}
                                        <button
                                            onClick={() => setConfig({ ...config, deposit_amount_fixed: null })}
                                            className={`p-6 rounded-xl border-2 transition-all text-left group ${depositType === 'percentage'
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2 rounded-lg ${depositType === 'percentage'
                                                    ? 'bg-blue-500/20'
                                                    : 'bg-gray-700/50 group-hover:bg-gray-700'
                                                    }`}>
                                                    <Percent className={`w-5 h-5 ${depositType === 'percentage' ? 'text-blue-400' : 'text-gray-400'
                                                        }`} />
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${depositType === 'percentage'
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-600'
                                                    }`}>
                                                    {depositType === 'percentage' && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                            <h4 className="font-semibold text-white mb-1">Porcentaje</h4>
                                            <p className="text-sm text-gray-400">Calcula la seña como % del servicio</p>
                                        </button>

                                        {/* Monto fijo */}
                                        <button
                                            onClick={() => setConfig({ ...config, deposit_amount_fixed: 1000 })}
                                            className={`p-6 rounded-xl border-2 transition-all text-left group ${depositType === 'fixed'
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2 rounded-lg ${depositType === 'fixed'
                                                    ? 'bg-purple-500/20'
                                                    : 'bg-gray-700/50 group-hover:bg-gray-700'
                                                    }`}>
                                                    <DollarSign className={`w-5 h-5 ${depositType === 'fixed' ? 'text-purple-400' : 'text-gray-400'
                                                        }`} />
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${depositType === 'fixed'
                                                    ? 'border-purple-500 bg-purple-500'
                                                    : 'border-gray-600'
                                                    }`}>
                                                    {depositType === 'fixed' && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                            <h4 className="font-semibold text-white mb-1">Monto fijo</h4>
                                            <p className="text-sm text-gray-400">Misma seña para todos los servicios</p>
                                        </button>
                                    </div>

                                    {/* Input de valor */}
                                    <div className="space-y-2">
                                        {depositType === 'percentage' ? (
                                            <>
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                                    <Percent className="w-4 h-4" />
                                                    Porcentaje de seña
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={config.deposit_percentage || 20}
                                                        onChange={e => setConfig({ ...config, deposit_percentage: parseFloat(e.target.value) })}
                                                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                                                        placeholder="20"
                                                        min="1"
                                                        max="100"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Ejemplo: Servicio $5000 → Seña ${((5000 * (config.deposit_percentage || 20)) / 100).toFixed(0)}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                                    <DollarSign className="w-4 h-4" />
                                                    Monto fijo de seña
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                                    <input
                                                        type="number"
                                                        value={config.deposit_amount_fixed || ''}
                                                        onChange={e => setConfig({ ...config, deposit_amount_fixed: parseFloat(e.target.value) || null })}
                                                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pl-10"
                                                        placeholder="1000"
                                                        min="0"
                                                        step="100"
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Todos los servicios requerirán ${config.deposit_amount_fixed || 1000} de seña
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Footer con botón */}
                            <div className="p-6 bg-gray-900/30 border-t border-gray-700/50">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30"
                                >
                                    {saving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Guardando...
                                        </span>
                                    ) : (
                                        'Guardar configuración'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Info card */}
                    <div className="bg-blue-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold text-blue-400">Información importante</h3>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                                        <span>La conexión es segura y no compartimos tus credenciales</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                                        <span>Podés desconectar tu cuenta en cualquier momento</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                                        <span>MP cobra una comisión por transacción (~4-5%)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                                        <span>Los pagos se acreditan en 24-48hs hábiles</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}