from flask import Flask, request, jsonify
from responder import responder

app = Flask(__name__)

@app.route('/')
def home():
    return "Bot active"

@app.route('/responder', methods=['POST'])
def manejar():
    pregunta = request.json.get('texto', '')
    return jsonify({'respuesta': responder(pregunta)})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)