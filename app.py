from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from analyzer import DigitalBalanceAnalyzer

app = Flask(__name__)
CORS(app)

analyzer = DigitalBalanceAnalyzer()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze/day", methods=["POST"])
def analyze_day():
    data = request.json
    result = analyzer.analyze_day_data(data)
    return jsonify(result)


@app.route("/analyze/week", methods=["POST"])
def analyze_week():
    data = request.json
    result = analyzer.analyze_week_data(data)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
