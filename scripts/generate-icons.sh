#!/bin/bash

# 元となる高解像度アイコン（512x512）が必要
SOURCE_ICON="assets/icons/icon-512x512.png"
DEST_DIR="public/icons"

# 出力ディレクトリを作成
mkdir -p "$DEST_DIR"

# 既存のアイコンをコピー
cp assets/icons/icon-108x108.png "$DEST_DIR/"
cp assets/icons/icon-512x512.png "$DEST_DIR/"

echo "Icon generation complete!"
echo "Note: To generate all sizes, you'll need ImageMagick installed:"
echo "  brew install imagemagick"
echo ""
echo "Then uncomment the following lines in this script:"
echo ""
echo "# convert \"\$SOURCE_ICON\" -resize 72x72 \"\$DEST_DIR/icon-72x72.png\""
echo "# convert \"\$SOURCE_ICON\" -resize 96x96 \"\$DEST_DIR/icon-96x96.png\""
echo "# convert \"\$SOURCE_ICON\" -resize 128x128 \"\$DEST_DIR/icon-128x128.png\""
echo "# convert \"\$SOURCE_ICON\" -resize 144x144 \"\$DEST_DIR/icon-144x144.png\""
echo "# convert \"\$SOURCE_ICON\" -resize 152x152 \"\$DEST_DIR/icon-152x152.png\""
echo "# convert \"\$SOURCE_ICON\" -resize 180x180 \"\$DEST_DIR/icon-180x180.png\""
echo "# convert \"\$SOURCE_ICON\" -resize 192x192 \"\$DEST_DIR/icon-192x192.png\""
echo "# convert \"\$SOURCE_ICON\" -resize 384x384 \"\$DEST_DIR/icon-384x384.png\""