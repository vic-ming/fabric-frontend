#!/usr/bin/env python3
"""把客戶交付的素材整理成前端可用的 public/assets/。

交付原檔動輒單張 30–47 MB，無法直接上網頁，因此貼圖與圖案會在此縮圖轉檔；
模型與 HDR 為二進位原檔，直接複製。

用法: python3 scripts/prepare-assets.py [--force]
"""

import argparse
import json
import os
import shutil
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DELIVERY = os.path.join(ROOT, 'TTRI to VJINC')
ASSET_SRC = os.path.join(DELIVERY, 'Asset 檔案')
OUT = os.path.join(ROOT, 'public', 'assets')

TEXTURE_MAX = 2048      # PBR 貼圖邊長上限
PATTERN_MAX = 2048      # 內建圖案邊長上限
THUMB_MAX = 320         # 縮圖邊長
SWATCH_MAX = 1024       # 組織瀏覽圖邊長上限
JPEG_QUALITY = 85

# 需要保留 alpha 的貼圖通道（ALPHA 本身是灰階遮罩，仍以 jpg 輸出即可）
_stats = {'copied': 0, 'converted': 0, 'skipped': 0, 'bytes_in': 0, 'bytes_out': 0}


def ensure(path):
    os.makedirs(path, exist_ok=True)
    return path


def up_to_date(src, dst, force):
    if force or not os.path.exists(dst):
        return False
    return os.path.getmtime(dst) >= os.path.getmtime(src)


def copy_file(src, dst, force):
    if up_to_date(src, dst, force):
        _stats['skipped'] += 1
        return
    ensure(os.path.dirname(dst))
    shutil.copy2(src, dst)
    _stats['copied'] += 1
    _stats['bytes_in'] += os.path.getsize(src)
    _stats['bytes_out'] += os.path.getsize(dst)


def convert_image(src, dst, max_side, quality=JPEG_QUALITY, force=False):
    if up_to_date(src, dst, force):
        _stats['skipped'] += 1
        return
    ensure(os.path.dirname(dst))
    with Image.open(src) as im:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
        if dst.endswith('.jpg'):
            if im.mode not in ('RGB', 'L'):
                im = im.convert('RGB')
            im.save(dst, 'JPEG', quality=quality, optimize=True, progressive=True)
        else:
            im.save(dst, optimize=True)
    _stats['converted'] += 1
    _stats['bytes_in'] += os.path.getsize(src)
    _stats['bytes_out'] += os.path.getsize(dst)


def sync_models(force):
    src = os.path.join(ASSET_SRC, 'Model')
    dst = ensure(os.path.join(OUT, 'models'))
    for name in sorted(os.listdir(src)):
        if name.lower().endswith('.glb'):
            copy_file(os.path.join(src, name), os.path.join(dst, name), force)

    # Specs2VS 回傳的 Name（如 2-0000033-3）對應的物性預測模型
    vs_src = os.path.join(DELIVERY, 'API Documents for Models, Physics & U3Ma', '3D_Models', 'VS02')
    if os.path.isdir(vs_src):
        vs_dst = ensure(os.path.join(OUT, 'vs-models'))
        for name in sorted(os.listdir(vs_src)):
            if name.lower().endswith('.obj'):
                copy_file(os.path.join(vs_src, name), os.path.join(vs_dst, name), force)


def sync_hdr(force):
    src = os.path.join(ASSET_SRC, 'HDR')
    dst = ensure(os.path.join(OUT, 'hdr'))
    for name in sorted(os.listdir(src)):
        if name.lower().endswith('.hdr'):
            copy_file(os.path.join(src, name), os.path.join(dst, name), force)


def sync_swatches(force):
    src = os.path.join(ASSET_SRC, '組織瀏覽圖')
    dst = ensure(os.path.join(OUT, 'swatches'))
    for name in sorted(os.listdir(src)):
        if name.endswith('_G.png'):
            convert_image(os.path.join(src, name), os.path.join(dst, name), SWATCH_MAX, force=force)


def sync_fabric_u3m(force):
    src_root = os.path.join(ASSET_SRC, '組織')
    dst_root = ensure(os.path.join(OUT, 'fabrics'))
    for code in sorted(os.listdir(src_root)):
        src = os.path.join(src_root, code)
        if not os.path.isdir(src):
            continue
        dst = ensure(os.path.join(dst_root, code))

        for name in sorted(os.listdir(src)):
            path = os.path.join(src, name)
            if name.endswith('.u3m') or name.endswith('.json'):
                copy_file(path, os.path.join(dst, name), force)
            elif name == f'{code}.png':                      # u3m 內的 preview
                convert_image(path, os.path.join(dst, name), THUMB_MAX * 2, force=force)
            elif name.endswith('.png') and '_' in name:      # BEAUTY / Crumpled / Folded 情境圖
                label = os.path.splitext(name)[0][len(code) + 1:].split('(')[0].strip('_').lower()
                convert_image(path, os.path.join(dst, f'{label}.jpg'), PATTERN_MAX, force=force)

        tex_src = os.path.join(src, 'textures')
        if os.path.isdir(tex_src):
            tex_dst = ensure(os.path.join(dst, 'textures'))
            for name in sorted(os.listdir(tex_src)):
                if name.lower().endswith(('.jpg', '.jpeg', '.png', '.tif', '.tiff')):
                    out_name = os.path.splitext(name)[0] + '.jpg'
                    convert_image(os.path.join(tex_src, name), os.path.join(tex_dst, out_name),
                                  TEXTURE_MAX, force=force)


def sync_patterns(force):
    src = os.path.join(ASSET_SRC, 'Pattern')
    dst = ensure(os.path.join(OUT, 'patterns'))
    thumbs = ensure(os.path.join(dst, 'thumbs'))

    manifest = []
    for name in sorted(os.listdir(src)):
        if not name.lower().endswith(('.png', '.jpg', '.jpeg')):
            continue
        stem = os.path.splitext(name)[0]
        slug = stem.replace(' ', '-')
        path = os.path.join(src, name)
        with Image.open(path) as im:
            width, height = im.size

        convert_image(path, os.path.join(dst, f'{slug}.jpg'), PATTERN_MAX, force=force)
        convert_image(path, os.path.join(thumbs, f'{slug}.jpg'), THUMB_MAX, force=force)
        manifest.append({
            'id': slug,
            'name': stem,
            'file': f'/assets/patterns/{slug}.jpg',
            'thumb': f'/assets/patterns/thumbs/{slug}.jpg',
            'sourceWidth': width,
            'sourceHeight': height,
            'square': abs(width - height) <= max(width, height) * 0.02,
        })
    return manifest


def write_pattern_module(manifest):
    path = os.path.join(ROOT, 'src', 'data', 'pattern-assets.js')
    body = json.dumps(manifest, ensure_ascii=False, indent=2)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write('// 本檔由 scripts/prepare-assets.py 依 Asset 檔案/Pattern 自動產生，請勿手動編輯。\n\n')
        fh.write('// 客戶交付的為測試圖，尚未分「圖案來源 / 圖案類型」分類，square 僅表示原圖是否接近正方形。\n')
        fh.write(f'export const builtInPatterns = {body};\n\n')
        fh.write('export const patternById = Object.fromEntries(builtInPatterns.map((item) => [item.id, item]));\n')
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--force', action='store_true', help='忽略時間戳記，全部重做')
    args = parser.parse_args()

    if not os.path.isdir(ASSET_SRC):
        sys.exit(f'找不到素材資料夾: {ASSET_SRC}')

    ensure(OUT)
    sync_models(args.force)
    sync_hdr(args.force)
    sync_swatches(args.force)
    sync_fabric_u3m(args.force)
    manifest = sync_patterns(args.force)
    module = write_pattern_module(manifest)

    total = sum(
        os.path.getsize(os.path.join(root, f))
        for root, _, files in os.walk(OUT) for f in files
    )
    print(f'複製 {_stats["copied"]} 檔、轉檔 {_stats["converted"]} 檔、略過 {_stats["skipped"]} 檔')
    print(f'處理來源 {_stats["bytes_in"] / 1048576:.0f} MB -> 輸出 {_stats["bytes_out"] / 1048576:.0f} MB')
    print(f'public/assets 總計 {total / 1048576:.0f} MB')
    print(f'{os.path.relpath(module, ROOT)}  內建圖案 {len(manifest)} 張')


if __name__ == '__main__':
    main()
