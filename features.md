# Food Tracker MCP - Features

## Image Input & Recognition

- **Barcode/QR reading**: Extract 2D barcodes and QR codes from user-submitted images server-side
- **Nutrition label reading**: Claude reads nutritional values directly off product label photos
- **Weight reading**: Claude reads weight from packaging or kitchen scales visible in photos
- **Food identification**: Claude identifies unpackaged/raw foods from photos (e.g., raw chicken, rice, bananas)
- **Product identification**: Claude identifies store-bought products from branding, packaging, and visible text

## Nutritional Lookup

- **Barcode-based lookup**: Query a nutritional API (e.g., Open Food Facts) using extracted barcodes
- **Name-based lookup**: Search for products by name/description when no barcode is available
- **Unpackaged food support**: Look up generic nutritional data for foods without barcodes (fruits, vegetables, raw meat, grains, etc.)

## Keyword-Based Product Matching

- **Keyword generation**: When a product is first encountered, Claude generates a chain of keywords from most specific to least specific (e.g., "Coop High Protein Shake Chocolate 500ml" → "Protein Shake" → "Shake")
- **Specificity levels**: Each keyword is stored with a specificity level (0 = most specific, N = least specific) so exact matches score higher
- **Weighted search**: When a new image comes in, Claude generates keywords and the MCP searches stored keywords, scoring by specificity match, usage frequency, and recency
- **Visual confirmation**: Top candidates are returned with their stored image so Claude can visually compare and confirm the match

## User Interaction Flow

- **Suggestion-first**: On a new entry, the system searches and suggests possible matches before asking the user to create anything new
- **User confirmation**: The user confirms or rejects suggestions; confirmed matches log instantly
- **Correction flow**: If no suggestion matches, the user provides a photo and/or description. The system creates a new entry and asks for nutritional values if not found
- **Flexible nutritional input**: User can provide nutritional values by plain text, or by taking a photo of the label — Claude reads either
- **Portion handling**: System detects or asks about weight/quantity, then asks if the user is eating all of it or a portion, and calculates accordingly
- **Contextual history suggestions**: System checks the user's history and proactively suggests the most likely product (e.g., "Is this the Coop Basmati you usually eat?" based on past frequency)

## Data Persistence

- **Custom product entries**: Store user-defined products with nutritional data, keywords, and specificity levels
- **Image storage**: Save product photos and associate them with entries for future recognition
- **User food log**: Record what the user ate, when, and how much
- **Usage history**: Track frequency and recency of each product to improve future suggestions
