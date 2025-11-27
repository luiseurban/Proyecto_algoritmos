from utils import levenshtein


def median_string_local_search(strings, alphabet, x_inicial):
    x_actual = x_inicial
    costo_actual = sum(levenshtein(x_actual, s) for s in strings)

    mejora = True
    while mejora:
        mejora = False
        mejores_vecinos = []

        # Generar vecinos por sustitución
        for i in range(len(x_actual)):
            for c in alphabet:
                if c != x_actual[i]:
                    vecino = x_actual[:i] + c + x_actual[i+1:]
                    costo = sum(levenshtein(vecino, s) for s in strings)
                    mejores_vecinos.append((vecino, costo))

        # Generar vecinos por inserción
        for i in range(len(x_actual) + 1):
            for c in alphabet:
                vecino = x_actual[:i] + c + x_actual[i:]
                costo = sum(levenshtein(vecino, s) for s in strings)
                mejores_vecinos.append((vecino, costo))

        # Generar vecinos por eliminación
        if len(x_actual) > 1:
            for i in range(len(x_actual)):
                vecino = x_actual[:i] + x_actual[i+1:]
                costo = sum(levenshtein(vecino, s) for s in strings)
                mejores_vecinos.append((vecino, costo))

        # Elegir el mejor vecino
        vecino_mejor, costo_mejor = min(mejores_vecinos, key=lambda x: x[1])

        if costo_mejor < costo_actual:
            x_actual, costo_actual = vecino_mejor, costo_mejor
            mejora = True

    return x_actual, costo_actual