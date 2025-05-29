# Sample Data Directory

This directory contains a subset of the full legal document dataset for development and testing.

## Contents

- **10 JSON case files** in `docket-data/`
- **PDF documents** for the first case in `sata/recap/`

## Selected Cases

1. Case 14560346: Nicholas Sandmann v. WP Company LLC
   - Court: kyed
   - Filed: 2019-02-19
   - Available PDFs: 50

2. Case 4191590: Sajfr v. BBG Communications, Inc
   - Court: casd
   - Filed: 2010-11-12
   - Available PDFs: 47

3. Case 4413643: Wolf, Virginia v. Walker, Scott
   - Court: wiwd
   - Filed: 2014-02-03
   - Available PDFs: 45

4. Case 4180354: Schaeffer v. Gregory Village Partners, L.P.
   - Court: cand
   - Filed: 2013-09-19
   - Available PDFs: 45

5. Case 4161037: Repro-Med Systems, Inc. v. Emed Technologies Corporation
   - Court: caed
   - Filed: 2013-09-20
   - Available PDFs: 44

6. Case 4514028: Diocese of Duluth - Adversary Proceeding
   - Court: mnb
   - Filed: 2016-06-24
   - Available PDFs: 39

7. Case 8427455: Weaver v. Champion Petfoods USA Inc
   - Court: wied
   - Filed: 2018-12-18
   - Available PDFs: 37

8. Case 4150031: Timothy L Salmas v. Midland Funding LLC
   - Court: cacd
   - Filed: 2013-04-30
   - Available PDFs: 32

9. Case 15992337: American Broadcasting Companies, Inc. v. Goodfriend
   - Court: nysd
   - Filed: 2019-07-31
   - Available PDFs: 29

10. Case 4306148: Activision TV, Inc. v. Pinnacle Bancorp, Inc.
   - Court: ned
   - Filed: 2013-07-12
   - Available PDFs: 27


## Usage

This sample data can be used to develop and test the legal document browser
without needing the full dataset. The structure mirrors the production data:

```
sample-data/
├── docket-data/        # JSON metadata files
└── sata/recap/         # PDF court documents
```
