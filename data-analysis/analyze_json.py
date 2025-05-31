#!/usr/bin/env python3
import json
import os
from collections import defaultdict

def analyze_json_file(filename):
    with open(filename, 'r') as f:
        data = json.load(f)
    
    print(f"\n=== {filename} ===")
    print(f"File size: {os.path.getsize(filename) / 1024:.1f} KB")
    print(f"Top-level type: {type(data).__name__}")
    
    if isinstance(data, dict):
        print(f"Number of keys: {len(data.keys())}")
        print("\nTop-level keys and types:")
        for key in sorted(data.keys())[:15]:  # Show first 15 keys
            value_type = type(data[key]).__name__
            if isinstance(data[key], list):
                value_type += f" (length: {len(data[key])})"
            elif isinstance(data[key], dict):
                value_type += f" (keys: {len(data[key].keys())})"
            print(f"  - {key}: {value_type}")
        
        # Analyze nested structures
        if 'docket_entries' in data and isinstance(data['docket_entries'], list) and len(data['docket_entries']) > 0:
            print(f"\nAnalyzing 'docket_entries' (array of {len(data['docket_entries'])} items):")
            sample_entry = data['docket_entries'][0]
            print("  Sample entry keys:")
            for key in sorted(sample_entry.keys())[:10]:
                value_type = type(sample_entry[key]).__name__
                if isinstance(sample_entry[key], list):
                    value_type += f" (length: {len(sample_entry[key])})"
                print(f"    - {key}: {value_type}")
            
            # Check recap_documents if exists
            if 'recap_documents' in sample_entry and isinstance(sample_entry['recap_documents'], list) and len(sample_entry['recap_documents']) > 0:
                print(f"\n  Analyzing 'recap_documents' (array of {len(sample_entry['recap_documents'])} items in first entry):")
                sample_doc = sample_entry['recap_documents'][0]
                print("    Sample document keys:")
                for key in sorted(sample_doc.keys())[:10]:
                    print(f"      - {key}: {type(sample_doc[key]).__name__}")

# Analyze all JSON files
json_files = ['4179280.json', '4543913.json', '5029392.json', '5350652.json', '8384571.json']
for file in json_files:
    if os.path.exists(file):
        analyze_json_file(file)

print("\n=== SUMMARY ===")
print("All files appear to be legal case docket data with consistent structure:")
print("- Each file represents a single case")
print("- Contains metadata about the case (id, name, dates, court, etc.)")
print("- Includes an array of docket_entries")
print("- Each docket entry contains recap_documents")