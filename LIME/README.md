# Extracting explanation from model predictions using LIME
## Environment
```python
conda activate /srv/scratch/ychen3411/anaconda3/envs/better
```

## Extraction of explanation
extract explanation for a single tweet and save results into a single '.pkl' file.
Loading the tweets from tweet_final_with_id_360.csv (tweets with tweetID and also treatment encoded with special markers)
```python
python extract_lime.py
```
You can use the cluster to run the extraction for all tweets.
Use gen_lime.py to generate sbatch files.

## Post-processing LIME explanation
After we get explanation, we need to map score of each word into tokens.
Run 
```python
python lime_data_processing.py
```
 to process explanation data and save into the csv file.

## Final outputs
You can find csv files in tweet_lime_withid.csv (all supporting stance).