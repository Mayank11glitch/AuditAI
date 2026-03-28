import glob
import os

files = glob.glob('frontend/src/**/*.tsx', recursive=True) + glob.glob('frontend/src/**/*.ts', recursive=True)

for f in files:
    with open(f, 'r') as file:
        lines = file.readlines()
    
    # Filter out exactly the two lines we appended
    new_lines = [line for line in lines if not line.startswith('/* eslint-disable @typescript-eslint/no-explicit-any */') and not line.startswith('/* eslint-disable @typescript-eslint/no-unused-vars */')]
    
    if len(lines) != len(new_lines):
        with open(f, 'w') as file:
            file.writelines(new_lines)

print('Cleaned up inline disables.')
