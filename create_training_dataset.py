import csv
import json
import pandas as pd
import numpy as np

def get_user_annotation(filename, gold_annotations, tweet, saliency_scores):
    with open(filename) as f:
        tweet_dict = json.load(f)
        df = pd.DataFrame.from_dict(tweet_dict, orient="index").dropna()
        df['gold_annotation'] = gold_annotations[:len(df)]
        df['tweet'] = tweet[:len(df)]
        df['saliency_scores'] = saliency_scores[:len(df)]
        df = df.astype({'annotation': 'int32',
                        'gold_annotation': 'int32',
                        'time': 'float64'
                        })
        return df

def get_gold_annotations(filename):
    data = np.genfromtxt(filename, delimiter=',')
    return data[1:]

def get_tweet_info(filename):
    saliency_scores = pd.read_csv(filename)['Saliency Score1']
    tweet = pd.read_csv(filename)['Tweet']
    return tweet.to_numpy(), saliency_scores.to_numpy()



gold_annotations = get_gold_annotations("gold_annotations.csv")
tweet, saliency_scores = get_tweet_info('data/tweet_lime_withid.csv')
file_names = ["alan_80_annotations.json","ethan_80_annotations.json"]
tweet_df = pd.DataFrame()
for filename in file_names:
    tweet_df = tweet_df.append(get_user_annotation(filename, gold_annotations, tweet, saliency_scores), ignore_index=True)
tweet_df.to_csv("initial_data.csv", index=False)