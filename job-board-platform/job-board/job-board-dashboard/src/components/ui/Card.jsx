function Card({ title, description, children, className = '' }) {
  return (
    <div className={`
      bg-gradient-to-b from-slate-900 to-slate-900/80
      border border-slate-800 rounded-2xl p-6 shadow-xl
      ${className}
    `}>
      {title && (
        <h2 className="text-lg font-bold text-white mb-1 tracking-tight">{title}</h2>
      )}
      {description && (
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">{description}</p>
      )}
      {children}
    </div>
  )
}

export default Card
