from difflib import get_close_matches
import json

with open('base_datos.json') as f:
    data = json.load(f)

def responder(pregunta):
    claves = data.keys()
    match = get_close_matches(pregunta.lower(), claves, n=1, cutoff=0.4)
    if match:
        return data[match[0]]
    return "Lo siento, no entendí tu pregunta."