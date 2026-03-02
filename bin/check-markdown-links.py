#!/usr/bin/env python3
"""
Markdown Link Checker for docuscribe/llm

Validates that all markdown links in the docuscribe/llm directory point to existing files.
Checks both relative links (./file.md, ../file.md) and absolute links within the repo.
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Set
from dataclasses import dataclass


@dataclass
class LinkIssue:
    """Represents a broken link found in a markdown file."""
    source_file: Path
    line_number: int
    link_text: str
    target_path: str
    reason: str


class MarkdownLinkChecker:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir.resolve()
        self.issues: List[LinkIssue] = []
        # Regex to match markdown links: [text](path)
        # Excludes URLs (http://, https://, mailto:, etc.)
        self.link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
        
    def is_external_link(self, link: str) -> bool:
        """Check if a link is external (URL, mailto, etc.)."""
        external_prefixes = ('http://', 'https://', 'mailto:', 'ftp://', 'tel:', '#')
        return link.startswith(external_prefixes)
    
    def resolve_link(self, source_file: Path, link: str) -> Path:
        """Resolve a relative or absolute link to an absolute path."""
        # Remove anchor fragments (#section)
        link = link.split('#')[0]
        
        if not link:  # Just an anchor
            return source_file
        
        # Resolve relative to the source file's directory
        source_dir = source_file.parent
        target_path = (source_dir / link).resolve()
        
        return target_path
    
    def check_file(self, file_path: Path) -> None:
        """Check all links in a single markdown file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            self.issues.append(LinkIssue(
                source_file=file_path,
                line_number=0,
                link_text="",
                target_path="",
                reason=f"Error reading file: {e}"
            ))
            return
        
        # Process line by line for better error reporting
        lines = content.split('\n')
        for line_num, line in enumerate(lines, start=1):
            # Find all markdown links in this line
            for match in self.link_pattern.finditer(line):
                link_text = match.group(1)
                link_target = match.group(2)
                
                # Skip external links
                if self.is_external_link(link_target):
                    continue
                
                # Resolve the link
                target_path = self.resolve_link(file_path, link_target)
                
                # Check if target exists
                if not target_path.exists():
                    self.issues.append(LinkIssue(
                        source_file=file_path,
                        line_number=line_num,
                        link_text=link_text,
                        target_path=str(target_path),
                        reason="File does not exist"
                    ))
    
    def check_directory(self) -> None:
        """Recursively check all markdown files in the directory."""
        markdown_files = list(self.base_dir.rglob('*.md'))
        
        print(f"Checking {len(markdown_files)} markdown files in {self.base_dir}...\n")
        
        for md_file in markdown_files:
            self.check_file(md_file)
    
    def print_report(self) -> None:
        """Print a formatted report of all issues found."""
        if not self.issues:
            print("[OK] All links are valid!")
            return
        
        print(f"[ERROR] Found {len(self.issues)} broken link(s):\n")
        
        # Group issues by source file
        issues_by_file = {}
        for issue in self.issues:
            rel_path = issue.source_file.relative_to(self.base_dir)
            if rel_path not in issues_by_file:
                issues_by_file[rel_path] = []
            issues_by_file[rel_path].append(issue)
        
        # Print grouped by file
        for file_path in sorted(issues_by_file.keys()):
            print(f"\nFile: {file_path}")
            for issue in issues_by_file[file_path]:
                if issue.line_number > 0:
                    print(f"   Line {issue.line_number}: [{issue.link_text}]")
                    print(f"   Target: {issue.target_path}")
                    print(f"   Reason: {issue.reason}")
                else:
                    print(f"   Reason: {issue.reason}")
        
        # Print summary
        file_count = len(issues_by_file)
        print(f"\nSummary: {len(self.issues)} broken link(s) across {file_count} file(s)")
    
    def get_exit_code(self) -> int:
        """Return appropriate exit code (0 for success, 1 for issues found)."""
        return 1 if self.issues else 0


def main():
    # Determine the base directory
    script_dir = Path(__file__).parent.resolve()
    
    # Default to docuscribe/llm relative to the script location
    default_target = script_dir.parent / 'llm'
    
    # Allow override via command line argument
    if len(sys.argv) > 1:
        target_dir = Path(sys.argv[1]).resolve()
    else:
        target_dir = default_target
    
    if not target_dir.exists():
        print(f"[ERROR] Directory does not exist: {target_dir}")
        sys.exit(1)
    
    if not target_dir.is_dir():
        print(f"[ERROR] Not a directory: {target_dir}")
        sys.exit(1)
    
    # Run the checker
    checker = MarkdownLinkChecker(target_dir)
    checker.check_directory()
    checker.print_report()
    
    sys.exit(checker.get_exit_code())


if __name__ == '__main__':
    main()
