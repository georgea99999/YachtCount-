export interface StockTakeLine { name: string; box: string; expected: number; counted: number }
export interface StockTakeRecord { id?: string; countedBy?: string | null; startedAt: string; finishedAt: string; lines: StockTakeLine[] }

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function stockTakeDifferences(lines: StockTakeLine[]) {
  return lines.filter(l => l.counted !== l.expected);
}

export function openStockTakePdf(rec: StockTakeRecord, vesselName = '') {
  const date = new Date(rec.finishedAt).toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const diffs = stockTakeDifferences(rec.lines);
  const rows = [...rec.lines].sort((a, b) => a.box.localeCompare(b.box) || a.name.localeCompare(b.name)).map(l => {
    const d = l.counted - l.expected;
    return `<tr${d ? ' class="diff"' : ''}><td>${esc(l.box)}</td><td>${esc(l.name)}</td><td>${l.expected}</td><td>${l.counted}</td><td>${d > 0 ? '+' + d : d || '–'}</td></tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><title>Stock Take - ${esc(date)}</title><style>
body{font-family:Arial,sans-serif;padding:40px;padding-top:70px;color:#152238}h1{margin-bottom:4px}.meta{color:#666;margin-bottom:24px}
table{width:100%;border-collapse:collapse}th{background:#5f8b9a;color:#fff;padding:10px 8px;text-align:left}td{padding:8px;border-bottom:1px solid #ddd}
tr.diff td{background:#fff4e5;font-weight:600}.nav{position:fixed;top:0;left:0;right:0;background:#152238;color:#fff;padding:12px 24px;display:flex;justify-content:space-between}
.nav button{padding:8px 18px;border:none;border-radius:6px;font-weight:600;cursor:pointer;background:#5f8b9a;color:#fff;margin-left:8px}@media print{.nav{display:none}body{padding-top:40px}}
</style></head><body><div class="nav"><b>Stock Take Report</b><div><button onclick="window.print()">Print / Save PDF</button><button onclick="window.close()">Close</button></div></div>
<h1>YachtCount – Stock Take${vesselName ? ' · ' + esc(vesselName) : ''}</h1>
<p class="meta">Finished ${esc(date)}${rec.countedBy ? ' · Counted by ' + esc(rec.countedBy) : ''}<br>${rec.lines.length} items counted · ${diffs.length} differences</p>
<table><thead><tr><th>Box</th><th>Product</th><th>Expected</th><th>Counted</th><th>Difference</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Allow pop-ups to view the report'); return; }
  w.document.write(html); w.document.close();
}
