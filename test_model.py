import joblib

model = joblib.load("spam_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

print("Spam Detection System")
print("Type 'exit' to quit\n")

while True:

    email = input("Enter Email: ")

    # Exit condition
    if email.lower() == "exit":
        print("Exiting Spam Detection System...")
        break

    vector = vectorizer.transform([email])

    prediction = model.predict(vector)[0]

    probability = model.predict_proba(vector)[0][1]

    if prediction == 1:
        print(f"🚨 Spam ({probability*100:.2f}%)")
    else:
        print(f"✅ Not Spam ({(1-probability)*100:.2f}%)")