from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Allows cross-origin requests from your frontend

# Example cost logic — adjust as needed
MATERIAL_COSTS = {
    "PLA": 0.05,
    "ABS": 0.07,
    "PETG": 0.06
}

@app.route('/calculate', methods=['POST'])
def calculate_cost():
    data = request.get_json()
    material = data.get('material')
    infill = float(data.get('infill', 0)) / 100
    volume = float(data.get('volume', 0))

    if material not in MATERIAL_COSTS:
        return jsonify({'error': 'Invalid material'}), 400

    density = 1.24  # g/cm³ (adjust per material if needed)
    grams = volume * infill * density
    cost = grams * MATERIAL_COSTS[material]

    return jsonify({'cost': round(cost, 2)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)