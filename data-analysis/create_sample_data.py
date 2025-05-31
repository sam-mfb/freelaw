#!/usr/bin/env python3
"""
Create sample-data directory with selected JSON files and their PDFs.
"""

import json
import os
import shutil
from pathlib import Path

def create_sample_data():
    # Load selected samples
    with open('selected_samples.json', 'r') as f:
        samples = json.load(f)
    
    # Create sample-data directory structure
    sample_root = Path('sample-data')
    sample_docket_dir = sample_root / 'docket-data'
    sample_recap_dir = sample_root / 'sata' / 'recap'
    
    # Create directories
    sample_docket_dir.mkdir(parents=True, exist_ok=True)
    sample_recap_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Creating sample data with {len(samples)} cases...")
    
    # Copy JSON files
    for i, case in enumerate(samples):
        case_id = case['id']
        source_json = Path(case['filepath'])
        dest_json = sample_docket_dir / f"{case_id}.json"
        
        print(f"\n{i+1}. Copying case {case_id}: {case['case_name_short'] or case['case_name'][:50]}")
        print(f"   Court: {case['court']}, Available PDFs: {case['available_docs']}")
        
        # Copy JSON file
        shutil.copy2(source_json, dest_json)
        print(f"   ✓ Copied JSON file")
        
        # For the first case with reasonable PDFs, copy all its PDF files
        if i == 0 and case['available_docs'] > 10:
            print(f"   Copying PDFs for this case (court: {case['court']}, pacer_id: {case['pacer_case_id']})")
            
            # Read JSON to get PDF paths
            with open(source_json, 'r') as f:
                data = json.load(f)
            
            pdf_count = 0
            pdf_dirs = set()
            
            # Find all PDF references
            for entry in data.get('docket_entries', []):
                for doc in entry.get('recap_documents', []):
                    if doc.get('is_available') and doc.get('filepath_local'):
                        pdf_path = doc['filepath_local']
                        # Extract directory name from path like "recap/gov.uscourts.cacd.560539/..."
                        if pdf_path.startswith('recap/'):
                            parts = pdf_path.split('/')
                            if len(parts) >= 3:
                                pdf_dir = parts[1]  # e.g., "gov.uscourts.cacd.560539"
                                pdf_dirs.add(pdf_dir)
            
            # Copy entire PDF directories
            for pdf_dir in pdf_dirs:
                source_pdf_dir = Path('data/sata/recap') / pdf_dir
                dest_pdf_dir = sample_recap_dir / pdf_dir
                
                if source_pdf_dir.exists():
                    print(f"   Copying PDF directory: {pdf_dir}")
                    shutil.copytree(source_pdf_dir, dest_pdf_dir, dirs_exist_ok=True)
                    pdf_files = list(dest_pdf_dir.glob('*.pdf'))
                    pdf_count += len(pdf_files)
                    print(f"   ✓ Copied {len(pdf_files)} PDFs")
                else:
                    print(f"   ⚠ PDF directory not found: {source_pdf_dir}")
            
            print(f"   Total PDFs copied: {pdf_count}")
    
    print(f"\n✅ Sample data created in: {sample_root}")
    print(f"   - {len(samples)} JSON files in {sample_docket_dir}")
    print(f"   - PDF files in {sample_recap_dir}")
    
    # Create a README for the sample data
    readme_content = f"""# Sample Data Directory

This directory contains a subset of the full legal document dataset for development and testing.

## Contents

- **{len(samples)} JSON case files** in `docket-data/`
- **PDF documents** for the first case in `sata/recap/`

## Selected Cases

"""
    
    for i, case in enumerate(samples):
        readme_content += f"{i+1}. Case {case['id']}: {case['case_name']}\n"
        readme_content += f"   - Court: {case['court']}\n"
        readme_content += f"   - Filed: {case['date_filed']}\n"
        readme_content += f"   - Available PDFs: {case['available_docs']}\n\n"
    
    readme_content += """
## Usage

This sample data can be used to develop and test the legal document browser
without needing the full dataset. The structure mirrors the production data:

```
sample-data/
├── docket-data/        # JSON metadata files
└── sata/recap/         # PDF court documents
```
"""
    
    with open(sample_root / 'README.md', 'w') as f:
        f.write(readme_content)
    
    print(f"\n✅ Created README.md in sample-data/")

if __name__ == '__main__':
    create_sample_data()