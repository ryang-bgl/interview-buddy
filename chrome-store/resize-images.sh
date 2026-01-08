#!/bin/bash
# Resize images to 1280x800 for Chrome Web Store

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$SCRIPT_DIR" || exit 1

echo "Resizing all .jpg images to 1280x800..."

# Counter for processed files
count=0

# Process all jpg files except already resized ones
for file in *.jpg; do
  # Skip if no files match
  [ -e "$file" ] || continue

  # Skip already resized files
  if [[ "$file" == *_resized.jpg ]]; then
    echo "Skipping already resized file: $file"
    continue
  fi

  # Get base filename without extension
  base="${file%.jpg}"

  echo -n "Resizing $file... "

  # Resize using sips (macOS built-in tool)
  sips -z 800 1280 "$file" --out "${base}_resized.jpg" > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
    ((count++))
  else
    echo "✗ Failed"
  fi
done

echo ""
echo "Done! Resized $count images."
echo "Resized files are saved as *_resized.jpg"
