# Annotator

A webapp to collect annotations for text documnets. Annotators can create an account, and are randomly allocated documents.

Run generate_json.py to turn a folder of mimic txt reports into appropriate format for the database.

Temporal changes, such as a condition worsening, improving or remaining the same, is a vital part of clinical practice and is relevant from diagnosis through to treatment. However, very little machine learning research focuses on understanding temporal data, and as a result there were no suitable benchmarks for temporal classification tasks. This project was originally intended to facilitate the collection of manual annotations of temporal changes, in radiology reports from the MIMIC-CXR dataset.

Stack

- TypeScript
- Remix
- Tailwind
- Prisma SQLite
- auth0
