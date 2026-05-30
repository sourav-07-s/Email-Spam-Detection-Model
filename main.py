import pandas as pd
import re
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("spam.csv")

print("Dataset Shape:", df.shape)

# =========================
# REMOVE DUPLICATES
# =========================

df.drop_duplicates(inplace=True)

print("After Removing Duplicates:", df.shape)

# =========================
# LABEL ENCODING
# ham = 0
# spam = 1
# =========================

df["label"] = df["label"].map({
    "ham": 0,
    "spam": 1
})

# =========================
# TEXT CLEANING
# =========================

def clean_text(text):

    text = str(text).lower()

    text = re.sub(r"http\S+", "", text)

    text = re.sub(r"[^a-zA-Z\s]", "", text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()

df["text"] = df["text"].apply(clean_text)

# =========================
# FEATURE ENGINEERING
# =========================

df["num_characters"] = df["text"].apply(len)

df["num_words"] = df["text"].apply(
    lambda x: len(x.split())
)

# =========================
# INPUT AND OUTPUT
# =========================

X = df["text"]

y = df["label"]

# =========================
# TF-IDF
# =========================

vectorizer = TfidfVectorizer(
    stop_words="english",
    max_features=5000,
    ngram_range=(1, 2)
)

X = vectorizer.fit_transform(X)

# =========================
# TRAIN TEST SPLIT
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# =========================
# MODEL
# =========================

model = LogisticRegression(
    max_iter=1000
)

model.fit(
    X_train,
    y_train
)

# =========================
# PREDICTIONS
# =========================

predictions = model.predict(
    X_test
)

# =========================
# ACCURACY
# =========================

accuracy = accuracy_score(
    y_test,
    predictions
)

print("\nAccuracy:")
print(round(accuracy * 100, 2), "%")

# =========================
# REPORT
# =========================

print("\nClassification Report:\n")

print(
    classification_report(
        y_test,
        predictions
    )
)

# =========================
# CONFUSION MATRIX
# =========================

print("\nConfusion Matrix:\n")

print(
    confusion_matrix(
        y_test,
        predictions
    )
)

# =========================
# SAVE MODEL
# =========================

joblib.dump(
    model,
    "spam_model.pkl"
)

joblib.dump(
    vectorizer,
    "vectorizer.pkl"
)

print("\nModel Saved Successfully")