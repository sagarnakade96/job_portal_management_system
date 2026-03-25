function ResponseBlock({ data, error, loading, emptyMessage = 'Awaiting action.' }) {
  const content = () => {
    if (loading) return { text: 'Loading...', color: 'text-slate-400' }
    if (error)   return { text: error, color: 'text-red-300' }
    if (data === null || data === undefined) return { text: emptyMessage, color: 'text-slate-500' }
    return {
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      color: 'text-blue-200'
    }
  }

  const { text, color } = content()

  return (
    <div className="mt-4">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-medium">Response</p>
      <pre className={`
        text-sm leading-relaxed whitespace-pre-wrap break-words
        bg-slate-950/80 border border-slate-800 rounded-xl
        p-4 min-h-[80px] overflow-auto
        ${color}
      `}>
        {text}
      </pre>
    </div>
  )
}

export default ResponseBlock
