#!/usr/bin/env python3
import json

# Get all keys from first file to analyze complete structure
with open('4179280.json', 'r') as f:
    data = json.load(f)

print("=== COMPLETE FIELD LIST ===")
print("\nCase Metadata Fields:")
for key in sorted(data.keys()):
    if key not in ['docket_entries', 'claims', 'attorneys', 'parties', 'court_citations', 'other_dates']:
        value = data[key]
        value_type = type(value).__name__
        if value_type == 'str' and value:
            preview = value[:50] + '...' if len(value) > 50 else value
            print(f"  - {key}: {value_type} - '{preview}'")
        elif value_type == 'int' or value_type == 'bool':
            print(f"  - {key}: {value_type} - {value}")
        else:
            print(f"  - {key}: {value_type}")

print("\nArray/List Fields:")
array_fields = ['docket_entries', 'claims', 'attorneys', 'parties', 'court_citations', 'other_dates']
for field in array_fields:
    if field in data:
        print(f"  - {field}: list (length: {len(data[field])})")

# Analyze dates to understand the timeline
print("\n=== DATE FIELDS ===")
date_fields = [k for k in data.keys() if 'date' in k.lower()]
for field in sorted(date_fields):
    print(f"  - {field}: {data[field]}")

# Check parties and attorneys if present
if 'parties' in data and len(data['parties']) > 0:
    print(f"\n=== PARTIES (Total: {len(data['parties'])}) ===")
    for i, party in enumerate(data['parties'][:3]):  # Show first 3
        print(f"  Party {i+1}:")
        for key in sorted(party.keys())[:5]:
            print(f"    - {key}: {party[key]}")
        print()

if 'attorneys' in data and len(data['attorneys']) > 0:
    print(f"\n=== ATTORNEYS (Total: {len(data['attorneys'])}) ===")
    for i, attorney in enumerate(data['attorneys'][:3]):  # Show first 3
        print(f"  Attorney {i+1}:")
        for key in sorted(attorney.keys())[:5]:
            print(f"    - {key}: {attorney[key]}")
        print()