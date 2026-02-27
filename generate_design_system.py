import sys
import os

# Insert path to ui-ux-pro-max scripts
SCRIPT_DIR = os.path.abspath(r'c:\Users\tough\Documents\projetos\five_storev3\~\.gemini\antigravity\skills\skills\ui-ux-pro-max\scripts')
sys.path.insert(0, SCRIPT_DIR)

from design_system import generate_design_system

output_file = r'C:\Users\tough\.gemini\antigravity\brain\aadb434d-2c64-4e91-9b46-0178935decef\design_system.md'

# Generate the design system directly using the internal function
result = generate_design_system('ecommerce store minimal elegant clean modern', 'Five Store', 'markdown')

# Write output to file with explicit UTF-8 encoding
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(result)

print(f"Design system successfully written to {output_file}")
