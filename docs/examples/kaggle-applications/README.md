# Kaggle-based fake applications

Source: [hadikp/resume-data-pdf](https://www.kaggle.com/datasets/hadikp/resume-data-pdf).

## Import files

- `java-python.json` / `.csv`: four applications for a backend-oriented program.
- `react.json` / `.csv`: two applications for a frontend-oriented program.
- `applications.json` / `.csv`: all six, for testing mixed-profile imports.

Upload one file to the desired program on the Imports page. JSON and CSV are equivalent alternatives; importing both creates another set of applications. No database changes or LLM calls were made when preparing these files.

## What is synthetic

Names, example.com email addresses, target specialties and availability answers are fictional. Each CV field links to its original Kaggle PDF. The original document retains its source identity, which differs from the fictional form identity; this is an intentional limitation of these fixtures. Do not assume the source applicants actually applied. No résumé text or scores are supplied in the form.

## Limits and useful cases

All six selected PDFs are image-based and produce zero text with the current pypdf reader. The import files use public HTTPS individual-file download URLs, not the whole dataset archive, signed storage URLs, local paths or inline résumé text. The actual CV reader was exercised against all six URLs: downloads succeeded, then each raised the expected unreadable/scanned-PDF error. These fixtures test remote downloading and the unreadable-CV review path, not successful extraction. Successful extraction from these PDFs would require OCR, which has not been added.

Python-01 and React-02 have ambiguous availability. Skills, education and experience must come from the downloaded CV; the form deliberately contains no fallback résumé summary. Since extraction fails for these scanned files, the application should retain the form answers and report the CV review warning rather than invent qualifications. A separate text-based PDF sample is needed to test successful extraction and meaningful CV-based scoring.

## Source mapping

| Fake application | Archive member |
| --- | --- |
| java-01 | `Resumes PDF/JavaDeveloper/037d7babd501f4c0.pdf` |
| java-02 | `Resumes PDF/JavaDeveloper/10d343d910cb636b.pdf` |
| python-01 | `Resumes PDF/PythonDeveloper/09567c5893ce64a2.pdf` |
| python-02 | `Resumes PDF/PythonDeveloper/096d7e0c0fbeea99.pdf` |
| react-01 | `Resumes PDF/React/0bf2b665bd649340.pdf` |
| react-02 | `Resumes PDF/React/1d2ae903897437bb.pdf` |
