#!/usr/bin/env python3
"""Remove leftover Hostinger FTP HiddenStores temp files.

Hostinger writes each FTP upload to a hidden file named `.in.<filename>.`
then renames it into place. If a deploy is interrupted or two deploys overlap,
those temp files stay on the server and the next upload of the same file fails:

    FTPError: 550 ... Temporary hidden file /public_html/.../.in.index.html. already exists

This script lists directories we are about to publish (from dist/) and deletes
any leftover `.in.*.` files so FTP-Deploy-Action can upload cleanly.
"""

from __future__ import annotations

import ftplib
import os
import ssl
import sys
import time
from pathlib import Path


def is_hostinger_temp(name: str) -> bool:
    """True for Hostinger HiddenStores leftovers like `.in.index.html.`."""
    base = os.path.basename(name)
    return base.startswith('.in.') and base.endswith('.') and len(base) > 5


def collect_dist_dirs(dist_dir: Path) -> list[str]:
    """Return posix-relative directory paths under dist/ (including '')."""
    if not dist_dir.is_dir():
        print(f'⚠️ dist directory not found at {dist_dir} — skipping remote cleanup')
        return []

    dirs = {''}
    for path in dist_dir.rglob('*'):
        if path.is_dir():
            rel = path.relative_to(dist_dir).as_posix()
            if rel != '.':
                dirs.add(rel)
        elif path.is_file():
            rel_dir = path.parent.relative_to(dist_dir).as_posix()
            if rel_dir != '.':
                dirs.add(rel_dir)
    return sorted(dirs)


def connect_ftps(host: str, user: str, password: str, port: int) -> ftplib.FTP_TLS:
    ctx = ssl._create_unverified_context()
    ftp = ftplib.FTP_TLS(context=ctx, timeout=45)
    ftp.connect(host, port)
    ftp.login(user, password)
    ftp.prot_p()
    ftp.set_pasv(True)
    return ftp


def list_names(ftp: ftplib.FTP_TLS, directory: str) -> list[str]:
    try:
        ftp.cwd(directory)
    except ftplib.error_perm:
        return []

    names: list[str] = []
    try:
        ftp.retrlines('NLST', lambda line: names.append(line.strip()))
    except ftplib.error_perm:
        return []
    return [os.path.basename(name) for name in names if name and name not in ('.', '..')]


def cleanup(ftp: ftplib.FTP_TLS, server_dir: str, dist_dirs: list[str], deadline: float) -> int:
    deleted = 0
    scanned = 0

    for rel_dir in dist_dirs:
        if time.time() > deadline:
            print(f'⚠️ Cleanup time budget reached after {scanned} directories; continuing deploy')
            break

        remote_dir = server_dir if not rel_dir else f'{server_dir}/{rel_dir}'
        scanned += 1
        names = list_names(ftp, remote_dir)
        temps = [name for name in names if is_hostinger_temp(name)]
        if not temps:
            continue

        for name in temps:
            remote_path = f'{remote_dir}/{name}'
            try:
                ftp.delete(name)
                deleted += 1
                print(f'🗑️  Deleted leftover temp file: {remote_path}')
            except ftplib.error_perm as err:
                print(f'⚠️  Could not delete {remote_path}: {err}')

    print(f'✅ Scanned {scanned} remote directories, removed {deleted} leftover Hostinger temp file(s)')
    return deleted


def self_test() -> None:
    assert is_hostinger_temp('.in.index.html.') is True
    assert is_hostinger_temp('.in.AdvertisePage-abc.js.') is True
    assert is_hostinger_temp('index.html') is False
    assert is_hostinger_temp('.htaccess') is False
    assert is_hostinger_temp('.ftp-deploy-sync-state.json') is False
    assert is_hostinger_temp('.in.') is False
    print('✅ Hostinger temp-file matcher self-test passed')


def main() -> int:
    self_test()

    host = os.environ.get('FTP_SERVER', '').strip()
    user = os.environ.get('FTP_USERNAME', '').strip()
    password = os.environ.get('FTP_PASSWORD', '')
    port = int(os.environ.get('FTP_PORT', '21'))
    server_dir = os.environ.get('FTP_SERVER_DIR', '/public_html').rstrip('/') or '/public_html'
    dist_dir = Path(os.environ.get('DIST_DIR', 'dist'))
    budget = int(os.environ.get('CLEANUP_TIMEOUT_SEC', '90'))

    if not host or not user or not password:
        print('⚠️ FTP credentials not set — skipping leftover temp-file cleanup')
        return 0

    dist_dirs = collect_dist_dirs(dist_dir)
    if not dist_dirs:
        return 0

    print(f'🧹 Checking {len(dist_dirs)} dist directories on {server_dir} for leftover .in.*. files')
    ftp = None
    try:
        ftp = connect_ftps(host, user, password, port)
        cleanup(ftp, server_dir, dist_dirs, time.time() + budget)
    except Exception as err:
        print(f'⚠️ FTP cleanup failed (deploy will still be attempted): {err}')
        return 0
    finally:
        if ftp is not None:
            try:
                ftp.quit()
            except Exception:
                try:
                    ftp.close()
                except Exception:
                    pass
    return 0


if __name__ == '__main__':
    sys.exit(main())
