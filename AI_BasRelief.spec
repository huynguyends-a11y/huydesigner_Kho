# -*- mode: python ; coding: utf-8 -*-
# ===============================================================================
# AI BAS RELIEF → STL: PYINSTALLER SPECIFICATION FILE
# File: AI_BasRelief.spec
# ===============================================================================

import sys
import os
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT

block_cipher = None

project_dir = os.path.abspath(os.path.dirname(__file__))

added_files = [
    (os.path.join(project_dir, 'assets'), 'assets'),
    (os.path.join(project_dir, 'app'), 'app'),
]

hidden_imports = [
    'PySide6',
    'PySide6.QtCore',
    'PySide6.QtGui',
    'PySide6.QtWidgets',
    'cv2',
    'numpy',
    'trimesh',
    'trimesh.repair',
    'trimesh.exchange.stl',
    'scipy',
    'scipy.spatial',
    'scipy.ndimage',
    'PIL',
    'PIL.Image',
]

a = Analysis(
    [os.path.join(project_dir, 'app', 'main.py')],
    pathex=[project_dir],
    binaries=[],
    datas=added_files,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'IPython', 'notebook'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='AI_BasRelief',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # No terminal window when launched
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(project_dir, 'assets', 'icon.ico') if os.path.exists(os.path.join(project_dir, 'assets', 'icon.ico')) else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='AI_BasRelief',
)
