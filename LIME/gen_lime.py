import argparse
import numpy as np
import os
from random import randint
import csv

parser = argparse.ArgumentParser()

## Required parameters
parser.add_argument("--sh_dir", default='run_lime/', type=str)
#parser.add_argument("--output_dir", default='/srv/share4/ychen3411/project_03_model_save/mt5/', type=str)
args = parser.parse_args()


if not os.path.exists(args.sh_dir):
    os.mkdir(args.sh_dir)


current_sbatch_file = os.path.join(args.sh_dir, "p1.sh")
tmp_file = open(current_sbatch_file, 'w')

tmp_file.write('#!/bin/bash -l\n')
tmp_file.write('#SBATCH -J lime\n')
tmp_file.write('#SBATCH --output=log/lime-%a.out\n')
tmp_file.write('#SBATCH --error=log/lime-%a.err\n')
tmp_file.write('#SBATCH -c 6\n')
tmp_file.write('#SBATCH --gres=gpu:1\n')
#tmp_file.write('#SBATCH --partition=short\n')
tmp_file.write('#SBATCH --partition=overcap\n')
tmp_file.write('#SBATCH --account=overcap\n')
tmp_file.write('#SBATCH --constraint="2080_ti|rtx_6000"\n')
tmp_file.write('#SBATCH --time=48:00:00')
tmp_file.write('#SBATCH --exclude="olivaw"\n')
tmp_file.write('#SBATCH -a 1-401\n')
tmp_file.write('#SBATCH --requeue\n')
#tmp_file.write('REPO=$PWD\nDATA_DIR=/srv/scratch/ychen3411/project03_ace_event/few-shot-learning-main/wikiann/data/wikiann/\n')

# Load config file using #SLURM_ARRAY_TASK_ID
# get mask_lang, sparsity_level, idx
tmp_file.write("sid=$SLURM_ARRAY_TASK_ID\n")
tmp_file.write("echo SID:$sid\n")
tmp_file.write("split=$(sed '1q;d' {}/config_$sid.txt)\n".format(args.sh_dir))
tmp_file.write("text=$(sed '1q;d' {}/config_$sid.txt)\n".format(args.sh_dir))


save_model = os.path.join('data/lime_exp_${split}.pkl')
tmp_file.write('MODEL={}\n'.format(save_model))
tmp_file.write('if [ ! -f "$MODEL" ]; then\n'
               'python extract_lime.py --split ${split}\n')
tmp_file.write('\nfi\n')
tmp_file.close()

# create config files
job_id = 1

# open csv file
with open('tweet_final_with_id_360.csv', 'r') as csvfile:
    reader = csv.reader(csvfile)
    tweet = list(reader)

# 3 columns, tweet, treatment, tweet text # skip first line and stop when tweet is empty
tweet = tweet[1:]
print(len(tweet))
tweet_text = [tweet[i][2] for i in range(len(tweet)) if tweet[i][2] != '']
print(len(tweet_text))
for split in range(len(tweet_text)):
    config_tmp = open('{}/config_{}.txt'.format(args.sh_dir, job_id), 'w')
    config_tmp.write('{}\n'.format(split))
    
    config_tmp.close()
    job_id += 1
