#!/usr/bin/env python3
import os
import json
import re
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple, Set
import argparse
import fnmatch


def remove_jsonc_comments(content: str) -> str:
    """Remove comments from JSONC content."""
    # Remove single-line comments
    content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
    # Remove multi-line comments
    content = re.sub(r'/\*[\s\S]*?\*/', '', content)
    return content


def extract_all_translations(file_path: str) -> List[Dict]:
    """Extract all translations from a JSON/JSONC file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            raw_content = f.read()
        
        # Remove comments for JSONC files
        cleaned_content = remove_jsonc_comments(raw_content)
        content = json.loads(cleaned_content)
    except Exception as e:
        raise Exception(f"Failed to parse {file_path}: {str(e)}")
    
    translations = []
    
    def traverse(obj, key_path=[]):
        if isinstance(obj, dict):
            for key, value in obj.items():
                current_path = key_path + [key]
                
                if isinstance(value, dict):
                    traverse(value, current_path)
                elif isinstance(value, str):
                    translations.append({
                        'key': '.'.join(current_path),
                        'value': value,
                        'normalized_value': value.strip().lower()
                    })
    
    traverse(content)
    return translations


def should_exclude_file(file_path: str, exclude_patterns: List[str]) -> bool:
    """Check if a file should be excluded based on patterns."""
    if not exclude_patterns:
        return False
    
    # Convert to Path for easier comparison
    file_path_obj = Path(file_path)
    
    for pattern in exclude_patterns:
        # Support both relative and absolute patterns
        pattern_path = Path(pattern)
        
        # Try exact match (relative or absolute)
        if file_path_obj == pattern_path or str(file_path_obj) == pattern:
            return True
        
        # Try relative match from current directory
        try:
            rel_path = file_path_obj.relative_to(Path.cwd())
            if str(rel_path) == pattern or rel_path == pattern_path:
                return True
        except ValueError:
            pass
        
        # Try glob-style pattern matching
        if fnmatch.fnmatch(str(file_path_obj), pattern):
            return True
        
        # Try matching just the filename
        if fnmatch.fnmatch(file_path_obj.name, pattern):
            return True
        
        # Try matching against relative path
        try:
            rel_path = file_path_obj.relative_to(Path.cwd())
            if fnmatch.fnmatch(str(rel_path), pattern):
                return True
        except ValueError:
            pass
    
    return False


def find_json_files(root_dir: str, exclude_patterns: List[str] = None) -> List[str]:
    """Recursively find all JSON and JSONC files in locales folders."""
    json_files = []
    root_path = Path(root_dir)
    
    # Skip these directories
    skip_dirs = {'node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv'}
    
    for path in root_path.rglob('*'):
        # Skip if any parent directory is in skip_dirs
        if any(part in skip_dirs for part in path.parts):
            continue
        
        # Check if it's in a locales folder and is a json/jsonc file
        if 'locales' in path.parts and path.suffix in ['.json', '.jsonc']:
            # Skip symlinks
            if not path.is_symlink():
                file_path = str(path)
                
                # Check if file should be excluded
                if not should_exclude_file(file_path, exclude_patterns):
                    json_files.append(file_path)
    
    return json_files


def get_locale_from_path(file_path: str) -> str:
    """Extract locale from filename (e.g., en.json -> en)."""
    filename = Path(file_path).stem
    return filename


def group_files_by_locale(files: List[str]) -> Dict[str, List[str]]:
    """Group files by their locale."""
    locale_groups = defaultdict(list)
    
    for file in files:
        locale = get_locale_from_path(file)
        locale_groups[locale].append(file)
    
    return dict(locale_groups)


def find_duplicates_within_file(file_path: str) -> List[Dict]:
    """Find duplicate translations within a single file."""
    try:
        translations = extract_all_translations(file_path)
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}", file=sys.stderr)
        return []
    
    value_map = defaultdict(list)
    
    for trans in translations:
        value_map[trans['normalized_value']].append(trans['key'])
    
    duplicates = []
    for normalized_value, keys in value_map.items():
        if len(keys) > 1:
            # Get original value
            original = next(t for t in translations if t['normalized_value'] == normalized_value)
            duplicates.append({
                'value': original['value'],
                'keys': keys,
                'count': len(keys)
            })
    
    return duplicates


def find_duplicates_across_files_in_locale(files: List[str]) -> List[Dict]:
    """Find duplicate translations across multiple files in the same locale."""
    value_map = defaultdict(list)
    
    for file in files:
        try:
            translations = extract_all_translations(file)
            
            for trans in translations:
                value_map[trans['normalized_value']].append({
                    'file': file,
                    'key': trans['key'],
                    'value': trans['value']
                })
        except Exception as e:
            print(f"Error processing {file}: {str(e)}", file=sys.stderr)
            continue
    
    duplicates = []
    for normalized_value, occurrences in value_map.items():
        if len(occurrences) > 1:
            duplicates.append({
                'value': occurrences[0]['value'],
                'occurrences': [
                    {
                        'file': os.path.relpath(occ['file']),
                        'key': occ['key']
                    }
                    for occ in occurrences
                ],
                'count': len(occurrences)
            })
    
    return duplicates


def analyze_translations(root_dir: str, target_locales: Set[str] = None, exclude_patterns: List[str] = None):
    """Analyze translations for duplicates."""
    all_files = find_json_files(root_dir, exclude_patterns)
    
    if not all_files:
        print('⚠️  No translation files found in locales folders')
        return None
    
    print(f'Found {len(all_files)} translation file(s) to analyze...\n')
    
    # Group files by locale
    locale_groups = group_files_by_locale(all_files)
    
    # Filter by target locales if specified
    if target_locales:
        locale_groups = {
            locale: files 
            for locale, files in locale_groups.items() 
            if locale in target_locales
        }
        
        if not locale_groups:
            print(f'⚠️  No files found for specified locale(s): {", ".join(target_locales)}')
            return None
    
    locales_str = ', '.join(sorted(locale_groups.keys()))
    print(f'Analyzing {len(locale_groups)} locale(s): {locales_str}\n')
    
    results = {
        'within_file': {},
        'across_files_per_locale': {}
    }
    
    # Find duplicates within individual files
    for locale, files in locale_groups.items():
        for file in files:
            duplicates = find_duplicates_within_file(file)
            if duplicates:
                results['within_file'][file] = duplicates
    
    # Find duplicates across files for each locale
    for locale, files in locale_groups.items():
        if len(files) > 1:
            duplicates = find_duplicates_across_files_in_locale(files)
            if duplicates:
                results['across_files_per_locale'][locale] = duplicates
    
    return results


def print_results(results):
    """Print the analysis results."""
    if not results:
        return
    
    has_issues = False
    
    # Report duplicates within files
    if results['within_file']:
        has_issues = True
        print('🔍 DUPLICATES WITHIN INDIVIDUAL FILES:\n')
        
        for file, duplicates in results['within_file'].items():
            rel_path = os.path.relpath(file)
            print(f'📄 {rel_path}')
            for dup in duplicates:
                print(f'  ⚠️  "{dup["value"]}" appears {dup["count"]} times:')
                for key in dup['keys']:
                    print(f'     - {key}')
            print()
    
    # Report duplicates across files per locale
    if results['across_files_per_locale']:
        has_issues = True
        print('\n🔍 DUPLICATES ACROSS FILES (PER LOCALE):\n')
        
        for locale, duplicates in sorted(results['across_files_per_locale'].items()):
            print(f'🌐 Locale: {locale.upper()}')
            print('─' * 50)
            
            for dup in duplicates:
                print(f'\n  ⚠️  "{dup["value"]}" appears in {dup["count"]} file(s):')
                for occ in dup['occurrences']:
                    print(f'     - {occ["key"]} in {occ["file"]}')
            print('\n')
    
    if not has_issues:
        print('✅ No duplicates found!')
        return 0
    else:
        return 1


def main():
    parser = argparse.ArgumentParser(
        description='Find duplicate translations in i18n JSON/JSONC files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s                                    # Analyze all locales in src/
  %(prog)s --dir src/client                   # Analyze specific directory
  %(prog)s --locale en                        # Only analyze English translations
  %(prog)s --locale en --locale de            # Analyze English and German
  %(prog)s -l en -l de                        # Short form
  %(prog)s --exclude src/locales/common/en.json  # Exclude specific file
  %(prog)s --exclude "*/common/*.json"        # Exclude pattern (glob)
  %(prog)s -x "*/common/*" -x "*/legacy/*"    # Exclude multiple patterns
  %(prog)s -l de -x src/features/old/locales/de.json  # Combine options
        '''
    )
    
    parser.add_argument(
        '--dir',
        default='src',
        help='Root directory to search for translation files (default: src)'
    )
    
    parser.add_argument(
        '--locale', '-l',
        action='append',
        dest='locales',
        help='Specific locale(s) to analyze (can be used multiple times). If not specified, analyzes all locales.'
    )
    
    parser.add_argument(
        '--exclude', '-x',
        action='append',
        dest='excludes',
        help='''File or pattern to exclude (can be used multiple times). 
        Supports: relative paths (src/locales/common/en.json), 
        glob patterns (*/common/*.json), 
        or just filenames (en.json).'''
    )
    
    args = parser.parse_args()
    
    # Convert locale list to set, or None if not specified
    target_locales = set(args.locales) if args.locales else None
    
    # Show excluded patterns if any
    if args.excludes:
        print(f'Excluding patterns: {", ".join(args.excludes)}\n')
    
    # Run analysis
    results = analyze_translations(args.dir, target_locales, args.excludes)
    
    # Print results and exit with appropriate code
    exit_code = print_results(results) if results else 0
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
