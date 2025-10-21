#!/usr/bin/env python3
"""
Clear Python cache files to force reload of updated modules
"""

import os
import shutil
from pathlib import Path

def clear_pycache():
    """Remove all __pycache__ directories and .pyc files"""
    
    print("="*60)
    print("PYTHON CACHE CLEANER")
    print("="*60)
    print("\nSearching for cache files...\n")
    
    current_dir = Path('.')
    removed_count = 0
    
    # Find and remove __pycache__ directories
    for pycache_dir in current_dir.rglob('__pycache__'):
        try:
            print(f"🗑️  Removing: {pycache_dir}")
            shutil.rmtree(pycache_dir)
            removed_count += 1
        except Exception as e:
            print(f"   ⚠️  Error: {e}")
    
    # Find and remove .pyc files
    for pyc_file in current_dir.rglob('*.pyc'):
        try:
            print(f"🗑️  Removing: {pyc_file}")
            pyc_file.unlink()
            removed_count += 1
        except Exception as e:
            print(f"   ⚠️  Error: {e}")
    
    # Find and remove .pyo files (optimized bytecode)
    for pyo_file in current_dir.rglob('*.pyo'):
        try:
            print(f"🗑️  Removing: {pyo_file}")
            pyo_file.unlink()
            removed_count += 1
        except Exception as e:
            print(f"   ⚠️  Error: {e}")
    
    print("\n" + "="*60)
    if removed_count > 0:
        print(f"✅ Removed {removed_count} cache files/directories")
    else:
        print("✅ No cache files found (already clean)")
    print("="*60)
    print("\nYou can now run your script:")
    print("  python main_gemini.py --posts 1 --status draft")
    print("="*60 + "\n")


if __name__ == "__main__":
    clear_pycache()
