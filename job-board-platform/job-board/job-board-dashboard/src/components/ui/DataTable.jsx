function DataTable({ rows = [] }) {
  if (!rows.length) {
    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm italic">
        No records found.
      </div>
    )
  }

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach(k => set.add(k))
      return set
    }, new Set())
  )

  return (
    <div className="overflow-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="bg-slate-950/90">
            {columns.map(col => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold text-sky-400 uppercase tracking-wider border-b border-slate-800"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
            >
              {columns.map(col => (
                <td key={col} className="px-4 py-3 text-slate-300 align-top">
                  {Array.isArray(row[col])
                    ? row[col].join(', ')
                    : typeof row[col] === 'boolean'
                    ? row[col] ? '✓' : '—'
                    : row[col] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
