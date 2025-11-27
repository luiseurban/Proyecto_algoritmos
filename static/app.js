document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bench-form');
  const summary = document.getElementById('summary');
  const datasetEl = document.getElementById('dataset');
  const ctx = document.getElementById('timeChart').getContext('2d');
  let chart = null;

  const downloadJson = document.getElementById('downloadJson');
  const downloadCsv = document.getElementById('downloadCsv');
  downloadJson.disabled = true;
  downloadCsv.disabled = true;

  function safeMean(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a,b)=>a+b,0)/arr.length;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const runBtn = document.getElementById('runBtn');
    runBtn.disabled = true;
    const prevBtnText = runBtn.textContent;
    runBtn.textContent = 'Ejecutando...';
    summary.textContent = '';
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'inline-block';
    document.getElementById('warning').style.display = 'none';

    const payload = {
      n: document.getElementById('n').value,
      max_len: document.getElementById('max_len').value,
      alphabet: document.getElementById('alphabet').value,
      L: document.getElementById('L').value,
      repeats: document.getElementById('repeats').value,
    };

    // Pre-check brute-force combinations and ask for confirmation if large
    const alphabet = payload.alphabet || '';
    const L = Number(payload.L) || 0;
    let combinations = Math.pow(Math.max(1, alphabet.length), L);
    const MAX_SAFE = 200000;
    if (combinations > MAX_SAFE) {
      const proceed = confirm(`La fuerza bruta intentará ${combinations} combinaciones — esto puede tardar mucho.\nPresiona Aceptar para forzar la ejecución, o Cancelar para omitir.`);
      if (!proceed) {
        payload.force_bruteforce = false;
      } else {
        payload.force_bruteforce = true;
      }
    }

    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    datasetEl.textContent = JSON.stringify(data.strings, null, 2);

    const bfTimes = (data.bruteforce && data.bruteforce.times) || [];
    const efTimes = (data.efficient && data.efficient.times) || [];
    const bfMean = safeMean(bfTimes).toFixed(2);
    const efMean = safeMean(efTimes).toFixed(2);

    const bfResultText = data.bruteforce && data.bruteforce.result ? `${data.bruteforce.result.x} (cost ${data.bruteforce.result.cost})` : '—';
    const efResultText = data.efficient && data.efficient.result ? `${data.efficient.result.x} (cost ${data.efficient.result.cost})` : '—';

    summary.innerHTML = `<b>Fuerza bruta</b>: media ${bfMean} ms — resultado: ${bfResultText}<br>` +
                        `<b>Eficiente</b>: media ${efMean} ms — resultado: ${efResultText}`;

    const labels = [];
    const maxRuns = Math.max(bfTimes.length, efTimes.length);
    for (let i=0;i<maxRuns;i++) labels.push(`run ${i+1}`);

    const datasets = [];
    if (bfTimes.length) datasets.push({ label: 'Fuerza bruta (ms)', data: bfTimes, backgroundColor: 'rgba(220,50,50,0.6)' });
    if (efTimes.length) datasets.push({ label: 'Eficiente (ms)', data: efTimes, backgroundColor: 'rgba(50,120,220,0.6)' });

    if(chart) chart.destroy();
    // Respect user's chart type selection
    const chartTypeSel = document.getElementById('chartType');
    const chartType = chartTypeSel ? chartTypeSel.value : 'bar';
    let chartConfigType = chartType === 'horizontal' ? 'bar' : chartType;
    let chartOptions = { responsive: true, scales: { y: { beginAtZero: true } } };

    let chartDatasets = datasets;
    if (chartType === 'horizontal') {
      chartOptions.indexAxis = 'y';
    }

    chart = new Chart(ctx, {
      type: chartConfigType,
      data: { labels, datasets: chartDatasets },
      options: chartOptions
    });

    // Show backend warning if brute-force skipped
    const warningEl = document.getElementById('warning');
    if (data.bruteforce && data.bruteforce.skipped) {
      warningEl.textContent = `Fuerza bruta omitida: ${data.bruteforce.reason}`;
      warningEl.style.display = 'block';
    } else {
      warningEl.style.display = 'none';
    }

    runBtn.disabled = false;
    runBtn.textContent = prevBtnText;
    spinner.style.display = 'none';

    // Enable export buttons and attach handlers
    downloadJson.disabled = false;
    downloadCsv.disabled = false;

    const resultsBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadJson.onclick = () => {
      const url = URL.createObjectURL(resultsBlob);
      const a = document.createElement('a');
      a.href = url; a.download = 'benchmark_results.json'; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    };

    downloadCsv.onclick = () => {
      // Build a simple CSV: dataset rows and timings
      let csv = 'type,run,value,extra\n';
      data.strings.forEach((s,i)=>{ csv += `string,${i+1},"${s}",\n`; });
      (data.bruteforce && data.bruteforce.times || []).forEach((t,i)=>{ csv += `bruteforce,${i+1},${t},cost:${(data.bruteforce.result||{}).cost||''}\n`; });
      (data.efficient && data.efficient.times || []).forEach((t,i)=>{ csv += `efficient,${i+1},${t},cost:${(data.efficient.result||{}).cost||''}\n`; });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'benchmark_results.csv'; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    };
  });
});
