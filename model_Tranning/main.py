import numpy as np
import pandas as pd
import sklearn
from sklearn.preprocessing import LabelEncoder


df = pd.read_csv('spam.csv');

#Remove duplicate values 
df.drop_duplicates(inplace=True);

#encode the message
encoder =LabelEncoder()

# convert the spam and ham to the 1 and 0
df['label'] = encoder.fit_transform(df['label'])

df['num_characters'] = df['text'].apply(len)

print(df.info())
