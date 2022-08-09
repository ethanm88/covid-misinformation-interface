import numpy as np
import lime
import torch
import torch.nn.functional as F
from lime.lime_text import LimeTextExplainer
import os
os.environ['TRANSFORMERS_CACHE'] = '/srv/share5/hf_cache'
from transformers import AutoTokenizer, AutoModel, BertTokenizer
from typing import List
from nltk import word_tokenize
from nltk.tokenize import MWETokenizer
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch import tensor 
import csv
import re
import numpy as np
import pickle

def save_pickle(obj, filename):
    with open(filename, 'wb') as f:
        pickle.dump(obj, f)

class SModel(nn.Module):
  def __init__(self, encoder, num_labels):
    super().__init__()
    self.num_labels = num_labels
    self.encoder = encoder
    self.dropout = nn.Dropout(self.encoder.config.hidden_dropout_prob)
    self.classifer = nn.Linear(self.encoder.config.hidden_size, self.num_labels)
    #self.encoder.init_weights()

  def forward(self, input_ids, token_type_ids=None, attention_mask=None, labels=None, e_span=None):
    output = self.encoder(input_ids)
    sequence_output = output[0]
    batchsize, _, _ = sequence_output.size()
    batch_index = [i for i in range(batchsize)]
    repr = sequence_output[batch_index, e_span]

    cls_token = self.dropout(repr)
    logits = self.classifer(cls_token)
    if labels is not None:
      avg_loss = F.cross_entropy(logits, labels)

      return avg_loss, logits
    else:
      return logits

import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--split', type=str, default='0', help='input file split number')
    parser.add_argument('--text', type=str, default='0', help='input file split number')
    args = parser.parse_args()
    # create an instance of WikidataJsonDump
    split = args.split
    

    tokenizer = AutoTokenizer.from_pretrained("digitalepidemiologylab/covid-twitter-bert-v2")
    encoder = AutoModel.from_pretrained("digitalepidemiologylab/covid-twitter-bert-v2", output_hidden_states=True)
    cp_marker = ['<cp_start>', '<cp_end>']
    tokenizer.add_tokens(cp_marker)
    encoder.resize_token_embeddings(len(tokenizer))
    smodel = SModel(encoder, 3)
    smodel.load_state_dict(torch.load("/srv/share4/emendes3/ctbert_stance_final.pth", map_location=torch.device('cpu')))
    smodel.eval()
    smodel.cuda()
    class_names = ['Agree','Disagree', 'No Stance']

    def find_e_span(inputs: tensor):
        e_span = 0
        for idx, inp in enumerate(inputs):
            if inp == 30522:
                e_span=idx    
        return e_span

    def predictor(texts):
        inputs = tokenizer(texts, return_tensors="pt", padding=True)
        input_ids = inputs['input_ids']
        e_spans = []
        # find the special marker start <cp_start> position
        for input_id in input_ids:
            e_span = find_e_span(input_id)
            e_spans.append(e_span)
        
        results = []
        with torch.no_grad():
          # write a batchwise loop for input_ids and e_spans
          batch_size = 32
          for i in range(0, len(input_ids), batch_size):
            batch_input_ids = input_ids[i:i+batch_size]
            batch_e_spans = e_spans[i:i+batch_size]
            outputs = smodel(torch.tensor(batch_input_ids).to('cuda'), e_span=torch.tensor(batch_e_spans).to('cuda'))
            # output probability
            outputs = F.softmax(outputs).detach().cpu().numpy()
            for j in range(len(batch_input_ids)):
                results.append(outputs[j])
        # stack all outputs together
        results = np.vstack(results)
        return results

    #text = "@BorisJohnson <a> Hydrochloroquine+Azithomycin </a> =IHU (Marseille) = CURE = 2019-nCoV; SARS-CoV-2; COVID-19; hydroxychloroquine; azithomycin;clinical trial. Cholera medecine *QuineQuina MIGHT effect or reduce Coronavirus. Nivaquine/Chloroquine&Beer, Pharmacy at Marseille)."
    
    with open('tweet_final_with_id_360.csv', 'r') as csvfile:
      reader = csv.reader(csvfile)
      tweet = list(reader)
    tweet = tweet[1:]
    tweet_text = [tweet[i][2] for i in range(len(tweet)) if tweet[i][2] != '']

    def remove_special_characters(text):
        t = ''.join([c for c in text if ord(c) < 128])
        return t

    text = tweet_text[int(split)]
    text = remove_special_characters(text)
    text = text.replace('<a>', '<cp_start>')
    text = text.replace('</a>', '<cp_end>')


    import time

    s1 = time.time()
    print(text)
    def split_whitespace(text):
        return text.split()
    
    # use white space tokenization for LIME
    split_function = split_whitespace
    # Lime explanation function, turn of bow because position of word matters here
    explainer = LimeTextExplainer(class_names=class_names, bow=False, split_expression=split_function)
    # num_sampels = 2000, the LIME will create 2000 different input sentences with token randomly replaced by [MASK]
    # set labels to = [0,1,2] so the output has all three stances' explanation
    exp = explainer.explain_instance(text, predictor, num_features=20, num_samples=2000, labels=[0,1,2])
    print('Time: ', time.time() - s1)
    # probability of each stance
    prob = exp.predict_proba
    # explanation score for each stance
    exp0 = exp.as_list(0)
    exp1 = exp.as_list(1)
    exp2 = exp.as_list(2)
    # the output of explanation only tells you a word and it's score
    # we don't know where this word is in the tweet
    
    print(prob)
    print(exp0)
    print(exp1)
    print(exp2)
    save_tmp = {"text": text,  "prob": prob}
    for l in [0, 1, 2]:
      html_data = exp.local_exp[l]
      # use html_data to find the position of each word and score
      # use domain_mapper.indexed_string to find word and string position
      # res = [(word, position, score), ...]
      res = [(exp.domain_mapper.indexed_string.word(x[0]), int(exp.domain_mapper.indexed_string.string_position(x[0])), x[1]) for x in html_data]
      save_tmp[l] = res
    
    # save the data into a pkl file
    save_pickle(save_tmp, 'data/lime_exp_' + split + '.pkl')