#!/usr/bin/env python3
"""
Find a good subset of JSON files for sample data.
Criteria:
1. Moderate file sizes (not too small, not too large)
2. Cases with available PDF documents
3. Variety of courts
4. Mix of open and closed cases
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Tuple

def analyze_json_file(filepath: Path) -> Dict:
    """Analyze a JSON file and return key metrics."""
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # Count available documents
        available_docs = 0
        total_docs = 0
        
        if 'docket_entries' in data:
            for entry in data['docket_entries']:
                if 'recap_documents' in entry:
                    for doc in entry['recap_documents']:
                        total_docs += 1
                        if doc.get('is_available') and doc.get('filepath_local'):
                            available_docs += 1
        
        return {
            'id': data.get('id'),
            'case_name': data.get('case_name', 'Unknown'),
            'case_name_short': data.get('case_name_short', 'Unknown'),
            'court': data.get('court', 'Unknown'),
            'date_filed': data.get('date_filed'),
            'date_terminated': data.get('date_terminated'),
            'file_size': filepath.stat().st_size,
            'total_docs': total_docs,
            'available_docs': available_docs,
            'pacer_case_id': data.get('pacer_case_id'),
            'filepath': str(filepath)
        }
    except Exception as e:
        print(f"Error analyzing {filepath}: {e}")
        return None

def find_good_samples(data_dir: Path, target_count: int = 10) -> List[Dict]:
    """Find a good mix of sample cases."""
    json_files = list(data_dir.glob('*.json'))
    print(f"Found {len(json_files)} JSON files to analyze...")
    
    # Analyze a subset for efficiency (every 100th file)
    sample_files = json_files[::100]  # Sample every 100th file
    print(f"Analyzing {len(sample_files)} sample files...")
    
    analyzed = []
    for i, filepath in enumerate(sample_files):
        if i % 10 == 0:
            print(f"Progress: {i}/{len(sample_files)}")
        result = analyze_json_file(filepath)
        if result:
            analyzed.append(result)
    
    # Filter criteria
    good_samples = [
        case for case in analyzed
        if case['available_docs'] >= 5  # Has at least 5 available PDFs
        and case['available_docs'] <= 50  # Not too many PDFs
        and case['file_size'] >= 100_000  # At least 100KB
        and case['file_size'] <= 1_000_000  # Not more than 1MB
    ]
    
    print(f"\nFound {len(good_samples)} cases matching criteria")
    
    # Sort by available docs and select diverse courts
    good_samples.sort(key=lambda x: x['available_docs'], reverse=True)
    
    # Try to get variety of courts
    selected = []
    courts_seen = set()
    
    # First pass: get different courts
    for case in good_samples:
        if case['court'] not in courts_seen and len(selected) < target_count:
            selected.append(case)
            courts_seen.add(case['court'])
    
    # Second pass: fill remaining slots
    for case in good_samples:
        if case not in selected and len(selected) < target_count:
            selected.append(case)
    
    return selected[:target_count]

def main():
    data_dir = Path('/home/devuser/freelaw/data/docket-data')
    
    print("Finding good sample cases...")
    samples = find_good_samples(data_dir)
    
    print("\n=== Selected Sample Cases ===")
    for i, case in enumerate(samples, 1):
        print(f"\n{i}. Case ID: {case['id']}")
        print(f"   Name: {case['case_name_short']}")
        print(f"   Court: {case['court']}")
        print(f"   File size: {case['file_size']:,} bytes")
        print(f"   Available PDFs: {case['available_docs']}")
        print(f"   Date filed: {case['date_filed']}")
        print(f"   Status: {'Closed' if case['date_terminated'] else 'Open'}")
    
    # Save results
    output_file = Path('selected_samples.json')
    with open(output_file, 'w') as f:
        json.dump(samples, f, indent=2)
    
    print(f"\nResults saved to {output_file}")
    
    # Also save just the IDs for easy copying
    ids_file = Path('sample_ids.txt')
    with open(ids_file, 'w') as f:
        for case in samples:
            f.write(f"{case['id']}\n")
    
    print(f"Case IDs saved to {ids_file}")

if __name__ == '__main__':
    main()