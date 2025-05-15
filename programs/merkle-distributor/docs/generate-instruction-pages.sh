#!/bin/bash

# This script extracts instruction sections from the original index.html file
# and creates separate HTML files for each instruction.

ORIGINAL_INDEX="index.html"
OUTPUT_DIR="./instructions"
TEMPLATE_FILE="$OUTPUT_DIR/template.html"

# Make sure the output directory exists
mkdir -p $OUTPUT_DIR

# Define the instruction IDs and their corresponding filenames
declare -A INSTRUCTIONS=(
    ["claim-locked"]="claim-locked.html"
    ["clawback"]="clawback.html"
    ["close-distributor"]="close-distributor.html"
    ["close-claim-status"]="close-claim-status.html"
    ["set-enable-slot"]="set-enable-slot.html"
    ["set-clawback-receiver"]="set-clawback-receiver.html"
    ["set-admin"]="set-admin.html"
    ["set-clawback-start-ts"]="set-clawback-start-ts.html"
)

echo "Extracting instruction sections and generating individual HTML files..."

# Loop through each instruction
for INSTRUCTION_ID in "${!INSTRUCTIONS[@]}"; do
    FILENAME="${INSTRUCTIONS[$INSTRUCTION_ID]}"
    OUTPUT_FILE="$OUTPUT_DIR/$FILENAME"
    
    echo "Processing: $INSTRUCTION_ID -> $OUTPUT_FILE"
    
    # Extract the section content for this instruction from the original index.html
    SECTION_START=$(grep -n "<section id=\"$INSTRUCTION_ID\"" "$ORIGINAL_INDEX" | cut -d: -f1)
    SECTION_END=$(sed -n "$SECTION_START,\$p" "$ORIGINAL_INDEX" | grep -n "</section>" | head -1 | cut -d: -f1)
    SECTION_END=$((SECTION_START + SECTION_END - 1))
    
    # Extract the section content
    CONTENT=$(sed -n "${SECTION_START},${SECTION_END}p" "$ORIGINAL_INDEX")
    
    # Get the title from the section content
    TITLE=$(echo "$CONTENT" | grep -o "<h1>.*</h1>" | sed 's/<h1>\(.*\)<\/h1>/\1/')
    
    # Read the template
    TEMPLATE=$(cat "$TEMPLATE_FILE")
    
    # Replace the template placeholders with the actual content
    RESULT=$(echo "$TEMPLATE" | sed "s|{{TITLE}}|$TITLE|g" | sed "s|{{CONTENT}}|$CONTENT|g")
    
    # Add the active class to the current instruction link in the sidebar
    RESULT=$(echo "$RESULT" | sed "s|href=\"$FILENAME\" class=\"nav-link\"|href=\"$FILENAME\" class=\"nav-link active\"|g")
    
    # Write the result to the output file
    echo "$RESULT" > "$OUTPUT_FILE"
    
    echo "Created: $OUTPUT_FILE"
done

echo "Done! All instruction pages have been generated." 