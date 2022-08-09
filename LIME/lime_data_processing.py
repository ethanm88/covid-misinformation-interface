# Tweet,Treatment,Probability1, stance1, Saliency Score1, probability2, stance2, saliency score2, Span of Treatment,id
import csv
import pickle
import numpy as np

import re
# open csv file
with open('tweet_final_with_id_360.csv', 'r') as csvfile:
    reader = csv.reader(csvfile)
    tweet = list(reader)

# 3 columns, tweet, treatment, tweet text # skip first line and stop when tweet is empty
tweet = tweet[1:]
print(len(tweet))
tweet_text = [tweet[i][2] for i in range(len(tweet)) if tweet[i][2] != '']
treatment = [tweet[i][1] for i in range(len(tweet)) if tweet[i][2] != '']
ids = [tweet[i][-1] for i in range(len(tweet)) if tweet[i][2] != '']

def open_pickle(filename):
    with open(filename, 'rb') as f:
        return pickle.load(f)


labels = ['Supporting', 'Refuting', 'No Stance']

support_res = []
nosupport_res = []
for split in range(360):
    # open LIME explanation pickle file
    tmp = open_pickle('data/lime_exp_{}.pkl'.format(split))
    probability = tmp['prob'] # proba of all predictions
    print(probability)
    top12 = np.argsort(probability)[::-1] # arg sort to find top1/2 stance
    print(top12)
    top1 = top12[0] # top 1 explanation index
    top2 = top12[1] # top2 explanation index

    text = tmp['text']
    print(tmp[top1])
    print(tmp[top2])
    print(text)
    print(probability)

    # split text and find character index of each token
    tokens = text.split()
    print(tokens)
    def find_char_index(tokens, text):
        token_char_list = []
        start_idx = 0
        for token in tokens:
            idx = text.find(token, start_idx)
            token_char_list.append((idx, idx + len(token)))
            start_idx = idx + len(token)
        return token_char_list
    # find character index of each tokens in the tweet
    token_char_list = find_char_index(tokens, text)
    # prepare top1 and top1/2 explanation score for each token
    score_showtop1 = [0 for _ in range(len(tokens))]
    score_showtop2 = [0 for _ in range(len(tokens))]

    num_score = 0
    # from the pickle file, we previously saved [(text, start_idx, score),...] using extract_lime.py
    # now we are trying to find the where this word is in the tweet (a list of token)
    # and assign a score to the token
    for exp in tmp[top1]:
        # text, start_idx, score
        text, start_idx, score_lime = exp
        end_idx = start_idx + len(text)

        for char_idx in token_char_list:
            if char_idx[0] >= start_idx and char_idx[1] <= end_idx:
                if score_lime > 0 and text not in ['<cp_start>', '<cp_end>']:
                    # assign lime score, positive score means important token, so we only use score_lime > 0
                    score_showtop1[token_char_list.index(char_idx)] = score_lime
                    score_showtop2[token_char_list.index(char_idx)] = score_lime
                    num_score += 1
        if num_score >= 5:
            # only show 5 explained token (too many words look messy and may result in meaningless explanation)
            break

    num_score = 0
    # do the same for top1/2 explanation score
    for exp in tmp[top2]:
        # text, start_idx, score
        text, start_idx, score_lime = exp
        end_idx = start_idx + len(text)

        for char_idx in token_char_list:
            if char_idx[0] >= start_idx and char_idx[1] <= end_idx:
                if score_lime > 0 and text not in ['<cp_start>', '<cp_end>']:
                    # here we turn the score to negative, to indicate it is the explanatioin of top-2 predicted stance
                    score_showtop2[token_char_list.index(char_idx)] = -score_lime
                    num_score += 1
        # again, only show 5 explanation score
        if num_score >= 5:
            break

    new_tokens = []
    new_scoretop1 = []
    new_scoretop2 = []
    span_treatment = []
    # find the span of treatment
    for idx, tok in enumerate(tokens):
        if tok not in ['<cp_start>', '<cp_end>']:
            new_tokens.append(tok)
            new_scoretop1.append(score_showtop1[idx])
            new_scoretop2.append(score_showtop2[idx])
        elif tok == '<cp_start>':
            # span start index of treatment
            span_treatment.append(idx)
        elif tok == '<cp_end>':
            # span end index of treatment
            span_treatment.append(idx-1)
    if ids[split] == 'NA':
        id_tmp = 'NA' + str(split)
    else:
        id_tmp = ids[split]
    # Tweet,Treatment,Probability1, stance1, Saliency Score1, probability2, stance2, saliency score2, Span of Treatment,id
    res = [' '.join(new_tokens), treatment[split], round(100 *probability[top1]), labels[top1], ' '.join([str(round(i, 2)) for i in new_scoretop1]), round(100*probability[top2]), labels[top2], ' '.join([str(round(i, 2)) for i in new_scoretop2]), ' '.join([str(i) for i in span_treatment]), id_tmp]

    if labels[top1] ==  'Supporting':
        support_res.append(res)
    else:
        # some tweets are classified as non-supporting --> save them into a separate file
        nosupport_res.append(res)

# calculate the threshold of using adaptive explanation
# the threshold is the median value of probabilities of all tweet (support stance)
probs_median = []
for r in support_res:
    probs_median.append(float(r[2]))
# find median
median_prob = np.median(probs_median)
print(median_prob)
for res in support_res:
    prob = res[2]
    if prob < median_prob:
        # this indicates the model is not confident, so we need to show top1/2 explanation
        # use 0 to represent
        res.append('0')
    else:
        # this indicates the model is confident, so we only show top1 explanation
        # use 1 to represent
        res.append('1')

# save results to csv file
with open('tweet_lime_withid.csv', 'w') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['Tweet', 'Treatment', 'Probability1', 'Stance1', 'Saliency Score1', 'Probability2', 'Stance2', 'Saliency Score2', 'Span of Treatment', 'id', 'Adaptive'])
    writer.writerows(support_res)

with open('tweet_lime_withid_nosupport.csv', 'w') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['Tweet', 'Treatment', 'Probability1', 'Stance1', 'Saliency Score1', 'Probability2', 'Stance2', 'Saliency Score2', 'Span of Treatment', 'id'])
    writer.writerows(nosupport_res)

