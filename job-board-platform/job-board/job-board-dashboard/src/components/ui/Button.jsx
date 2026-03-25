const VARIANTS = {
  primary: 'bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 hover:from-sky-500 hover:to-cyan-400 shadow-lg shadow-sky-500/20',
  secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600',
  warning: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 hover:from-amber-600 hover:to-yellow-500',
  danger: 'bg-gradient-to-r from-rose-500 to-red-400 text-slate-900 hover:from-rose-600 hover:to-red-500',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 border border-slate-700',
}

function Button({ children, variant = 'primary', onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2.5 rounded-xl font-semibold text-sm
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export default Button
