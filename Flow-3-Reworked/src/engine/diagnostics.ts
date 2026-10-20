/** Dev-only frame-interval evidence. No pointer or personal data is retained. */
export function startDiagnostics() {
  if (document.getElementById('frame-diagnostics')) return
  const report = document.createElement('output')
  report.hidden = true
  report.id = 'frame-diagnostics'
  document.body.append(report)
  const samples: number[] = []
  let previous = 0
  let began = 0
  function frame(now: number) {
    if (!began) began = now
    if (previous && document.visibilityState === 'visible') samples.push(now - previous)
    previous = now
    if (now - began < 8000) requestAnimationFrame(frame)
    else {
      const sorted = [...samples].sort((a, b) => a - b)
      const percentile = (q: number) => Number((sorted[Math.floor((sorted.length - 1) * q)] ?? 0).toFixed(2))
      report.dataset.report = JSON.stringify({ samples: samples.length, p50: percentile(.5), p95: percentile(.95), p99: percentile(.99), max: percentile(1), over33ms: samples.filter(n => n > 33.4).length, viewport: [innerWidth, innerHeight] })
    }
  }
  requestAnimationFrame(frame)
}
