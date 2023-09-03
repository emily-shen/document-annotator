import os
import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--input', type=str, required=True)
parser.add_argument('--output', type=str, required=True)
args = parser.parse_args()

values = []

for study in os.listdir(args.input): 
  item = {}
  item["studyId"] = study.replace(".txt","")
  with open(os.path.join(args.input,study), "r") as f:
    contents = f.read().strip()
  item["contents"] = contents
  values.append(item)


with open(args.output, 'w') as f:
    json.dump(values, f)