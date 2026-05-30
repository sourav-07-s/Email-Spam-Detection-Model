from flask import Flask, request, jsonify, render_template
import joblib

app = Flask(__name__)

model = joblib.load("spam_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        sender = data.get("sender", "")
        body = data.get("body", "")

        text = sender + " " + body

        if not text.strip():

            return jsonify({
                "status": "error",
                "message": "Email content required"
            })

        vector = vectorizer.transform([text])

        prediction = model.predict(vector)[0]

        probability = model.predict_proba(vector)[0][1]

        result = "Spam" if prediction == 1 else "Not Spam"

        return jsonify({

            "status": "success",

            "prediction": result,

            "confidence":
                round(probability * 100, 2),

            "words":
                len(body.split()),

            "characters":
                len(body)

        })

    except Exception as e:

        return jsonify({

            "status": "error",

            "message": str(e)

        })


if __name__ == "__main__":
    app.run(debug=True)