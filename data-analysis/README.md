# Data Analysis Tools

This directory contains Python scripts used for analyzing and understanding the structure of the legal document data. These are development-time tools, separate from the production build scripts.

## Purpose

These scripts were created to:
- Understand the JSON data structure of legal cases
- Analyze patterns and statistics in the dataset
- Create representative sample data for development
- Explore the data before building processing logic

## Scripts

### analyze_json.py
Provides a high-level structural overview of multiple JSON docket files. It analyzes file sizes, data types, and common patterns across cases.

**Usage:**
```bash
python analyze_json.py
```

### detailed_analysis.py
Performs in-depth analysis of a single JSON file, showing all fields with sample values, date fields, and array structures.

**Usage:**
```bash
python detailed_analysis.py
```

### find_sample_data.py
Intelligently selects a subset of cases for sample data based on criteria like document count, file size, and court variety.

**Output:**
- `selected_samples.json` - Full metadata about selected cases
- `sample_ids.txt` - Just the case IDs

**Usage:**
```bash
python find_sample_data.py
```

### create_sample_data.py
Creates the sample-data directory structure by copying selected cases and their PDFs based on the output from `find_sample_data.py`.

**Usage:**
```bash
python find_sample_data.py  # First, to select cases
python create_sample_data.py # Then, to create sample data
```

## Note

These scripts are for development and analysis only. The production build scripts that create search indices are located in the `scripts/` directory and are written in TypeScript.

For detailed documentation about these scripts, see [ANALYSIS_SCRIPTS_DOCUMENTATION.md](./ANALYSIS_SCRIPTS_DOCUMENTATION.md).