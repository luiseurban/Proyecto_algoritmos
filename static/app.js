document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bench-form');
  const summary = document.getElementById('summary');
  const datasetEl = document.getElementById('dataset');
  const ctx = document.getElementById('timeChart').getContext('2d');
  let chart = null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    summary.textContent = 'Ejecutando...';
    const payload = {
      n: document.getElementById('n').value,
      max_len: document.getElementById('max_len').value,
      alphabet: document.getElementById('alphabet').value,
      L: document.getElementById('L').value,
      repeats: document.getElementById('repeats').value,
    };

    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    datasetEl.textContent = JSON.stringify(data.strings, null, 2);

    const bfTimes = data.bruteforce.times;
    const efTimes = data.efficient.times;
    const bfMean = (bfTimes.reduce((a,b)=>a+b,0)/bfTimes.length).toFixed(2);
    const efMean = (efTimes.reduce((a,b)=>a+b,0)/efTimes.length).toFixed(2);

    summary.innerHTML = `<b>Fuerza bruta</b>: media ${bfMean} ms — resultado: ${data.bruteforce.result.x} (cost ${data.bruteforce.result.cost})<br>` +
                        `<b>Eficiente</b>: media ${efMean} ms — resultado: ${data.efficient.result.x} (cost ${data.efficient.result.cost})`;

    const labels = bfTimes.map((_,i)=>`run ${i+1}`);
    const datasets = [
      { label: 'Fuerza bruta (ms)', data: bfTimes, backgroundColor: 'rgba(220,50,50,0.6)' },
      { label: 'Eficiente (ms)', data: efTimes, backgroundColor: 'rgba(50,120,220,0.6)' }
    ];

    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  });
});
