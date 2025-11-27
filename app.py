from flask import Flask, render_template, request, jsonify
import os
import random
import time

from algoritmoIngenuo import median_string_bruteforce
from algoritmoEficiente import median_string_local_search
from utils import generate_random_strings

app = Flask(__name__)

# Safety limit to avoid running enormous brute-force searches accidentally.
# If combinations = len(alphabet) ** L exceeds this, brute-force will be skipped
# unless the client sets `force_bruteforce` to true.
MAX_BRUTE_COMBINATIONS = 200_000


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/run', methods=['POST'])
def run_bench():
    data = request.get_json() or {}
    n = int(data.get('n', 6))
    max_len = int(data.get('max_len', 5))
    alphabet = data.get('alphabet', 'ACGT')
    L = int(data.get('L', 4))
    repeats = int(data.get('repeats', 3))
    seed = data.get('seed')

    rng = random.Random()
    if seed is not None:
        rng.seed(int(seed))

    strings = generate_random_strings(n, alphabet, max_len, rng)

    # Decide whether to run brute-force based on combinations and client intent
    alphabet_size = max(1, len(alphabet))
    try:
        combinations = alphabet_size ** int(L)
    except OverflowError:
        combinations = float('inf')

    force_bruteforce = bool(data.get('force_bruteforce', False))

    bruteforce_times = []
    bruteforce_res = None
    bruteforce_skipped = False
    bruteforce_reason = None

    if combinations > MAX_BRUTE_COMBINATIONS and not force_bruteforce:
        bruteforce_skipped = True
        bruteforce_reason = f"combinations ({combinations}) exceed limit {MAX_BRUTE_COMBINATIONS}"
    else:
        # Brute-force benchmark
        for _ in range(repeats):
            t0 = time.perf_counter()
            x, cost = median_string_bruteforce(strings, alphabet, L)
            dt = (time.perf_counter() - t0) * 1000.0
            bruteforce_times.append(dt)
            bruteforce_res = {'x': x, 'cost': cost}

    # Efficient benchmark (local search)
    efficient_times = []
    efficient_res = None
    x_initial = strings[0] if strings else ''
    for _ in range(repeats):
        t0 = time.perf_counter()
        x2, cost2 = median_string_local_search(strings, alphabet, x_initial)
        dt2 = (time.perf_counter() - t0) * 1000.0
        efficient_times.append(dt2)
        efficient_res = {'x': x2, 'cost': cost2}

    return jsonify({
        'strings': strings,
        'combinations': combinations,
        'bruteforce': {
            'times': bruteforce_times,
            'result': bruteforce_res,
            'skipped': bruteforce_skipped,
            'reason': bruteforce_reason,
        },
        'efficient': {'times': efficient_times, 'result': efficient_res},
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
