from utils import levenshtein

def median_string_bruteforce(strings, alphabet, L):
    mejor_x = None
    mejor_costo = float("inf")

    # Generar todas las cadenas posibles de longitud <= L
    from itertools import product

    for length in range(1, L + 1):
        for x_tuple in product(alphabet, repeat=length):
            x = "".join(x_tuple)

            # Calcular costo total de x
            costo = 0
            for s in strings:
                costo += levenshtein(x, s)

            # Actualización de la mejor cadena encontrada
            if costo < mejor_costo:
                mejor_costo = costo
                mejor_x = x

    return mejor_x, mejor_costo