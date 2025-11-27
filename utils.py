def levenshtein(a: str, b: str) -> int:
    """Compute Levenshtein distance between strings a and b (iterative, O(min(n,m)) memory)."""
    if a == b:
        return 0
    la, lb = len(a), len(b)
    if la == 0:
        return lb
    if lb == 0:
        return la

    # Ensure that b is the shorter to use less memory
    if la < lb:
        a, b = b, a
        la, lb = lb, la

    previous_row = list(range(lb + 1))
    for i, ca in enumerate(a, start=1):
        current_row = [i] + [0] * lb
        for j, cb in enumerate(b, start=1):
            cost = 0 if ca == cb else 1
            insertions = previous_row[j] + 1
            deletions = current_row[j - 1] + 1
            substitutions = previous_row[j - 1] + cost
            current_row[j] = min(insertions, deletions, substitutions)
        previous_row = current_row
    return previous_row[lb]


def generate_random_strings(n, alphabet, max_len, rng):
    import random
    return [
        "".join(rng.choice(alphabet) for _ in range(rng.randint(1, max_len)))
        for _ in range(n)
    ]
