import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertOctagon, X, TrendingUp, Shield } from 'lucide-react';

/**
 * WarningAlert Component
 * Yellow background, bold text, pulsing icon
 * Used when risk score crosses the warning threshold
 */
export const WarningAlert = ({ message, score, onDismiss, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 border-amber-300/60 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 shadow-lg shadow-amber-100/50 ${className}`}
    >
        {/* Pulsing Icon */}
        <div className="flex-shrink-0 relative">
            <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shadow-md shadow-amber-300/40">
                <AlertTriangle size={20} className="text-white" strokeWidth={2.5} />
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-200/50 px-2 py-0.5 rounded-full">
                    Warning
                </span>
                {score !== undefined && (
                    <span className="text-[10px] font-black text-amber-700 flex items-center gap-1">
                        <TrendingUp size={10} />
                        {score}% Risk
                    </span>
                )}
            </div>
            <p className="text-sm font-bold text-amber-900 leading-snug">{message}</p>
        </div>

        {/* Dismiss */}
        {onDismiss && (
            <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1.5 rounded-lg text-amber-400 hover:text-amber-700 hover:bg-amber-100 transition-all"
            >
                <X size={16} />
            </button>
        )}
    </motion.div>
);


/**
 * DangerAlert Component
 * Red background, strong border, blinking danger icon
 * Used when risk score is critical / exceeds danger threshold
 */
export const DangerAlert = ({ message, score, onDismiss, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 border-red-400/70 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 shadow-lg shadow-red-100/60 ${className}`}
    >
        {/* Blinking Danger Icon */}
        <div className="flex-shrink-0 relative">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
            <div className="relative w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-md shadow-red-400/40 animate-[pulse_1.5s_ease-in-out_infinite]">
                <AlertOctagon size={20} className="text-white" strokeWidth={2.5} />
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 bg-red-200/50 px-2 py-0.5 rounded-full animate-pulse">
                    Critical
                </span>
                {score !== undefined && (
                    <span className="text-[10px] font-black text-red-700 flex items-center gap-1">
                        <Shield size={10} />
                        {score}% Risk
                    </span>
                )}
            </div>
            <p className="text-sm font-extrabold text-red-900 leading-snug">{message}</p>
        </div>

        {/* Dismiss */}
        {onDismiss && (
            <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-100 transition-all"
            >
                <X size={16} />
            </button>
        )}
    </motion.div>
);


/**
 * RiskAlertBanner — Dynamic alert container
 * Renders a list of WarningAlert and DangerAlert based on the alerts array.
 * Each alert must have { type: 'warning' | 'danger', message: string, score?: number }
 */
export const RiskAlertBanner = ({ alerts = [], onDismiss }) => {
    if (!alerts || alerts.length === 0) return null;

    return (
        <AnimatePresence>
            <div className="space-y-3 mb-6">
                {alerts.map((alert, index) => {
                    const key = `${alert.type}-${index}`;
                    const Component = alert.type === 'danger' ? DangerAlert : WarningAlert;
                    return (
                        <Component
                            key={key}
                            message={alert.message}
                            score={alert.score}
                            onDismiss={onDismiss ? () => onDismiss(index) : undefined}
                        />
                    );
                })}
            </div>
        </AnimatePresence>
    );
};


/**
 * RiskScoreGauge — Visual risk score display with color coding
 */
export const RiskScoreGauge = ({ score, label = 'Risk Score', size = 'md', thresholds }) => {
    const defaultThresholds = thresholds || { warning: 40, danger: 60 };

    let color, bgColor, textColor, ringColor;
    if (score >= defaultThresholds.danger) {
        color = 'bg-red-500';
        bgColor = 'bg-red-50';
        textColor = 'text-red-700';
        ringColor = 'ring-red-200';
    } else if (score >= defaultThresholds.warning) {
        color = 'bg-amber-500';
        bgColor = 'bg-amber-50';
        textColor = 'text-amber-700';
        ringColor = 'ring-amber-200';
    } else {
        color = 'bg-emerald-500';
        bgColor = 'bg-emerald-50';
        textColor = 'text-emerald-700';
        ringColor = 'ring-emerald-200';
    }

    const sizeClasses = {
        sm: { container: 'w-14 h-14', text: 'text-sm', label: 'text-[9px]' },
        md: { container: 'w-20 h-20', text: 'text-xl', label: 'text-[10px]' },
        lg: { container: 'w-28 h-28', text: 'text-3xl', label: 'text-xs' },
    };
    const s = sizeClasses[size] || sizeClasses.md;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`${s.container} ${bgColor} rounded-full flex items-center justify-center ring-4 ${ringColor} relative`}>
                <span className={`${s.text} font-black ${textColor}`}>{Math.round(score)}</span>
                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100" />
                    <circle
                        cx="50" cy="50" r="44" fill="none"
                        stroke="currentColor" strokeWidth="6"
                        strokeDasharray={`${(score / 100) * 276.46} 276.46`}
                        strokeLinecap="round"
                        className={textColor}
                    />
                </svg>
            </div>
            <span className={`${s.label} font-black uppercase tracking-[0.15em] text-gray-500`}>{label}</span>
        </div>
    );
};

export default { WarningAlert, DangerAlert, RiskAlertBanner, RiskScoreGauge };
