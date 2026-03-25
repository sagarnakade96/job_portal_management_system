function Textarea({ label, id, value, onChange, placeholder = '', rows = 4, className = '' }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-slate-300 font-medium">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full bg-slate-900/60 border border-slate-700 text-slate-200
          rounded-xl px-4 py-2.5 text-sm outline-none resize-vertical
          placeholder:text-slate-500
          focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20
          transition-all duration-200
          ${className}
        `}
      />
    </div>
  )
}

export default Textarea
