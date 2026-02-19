# Food Tracker MCP - Motivation & Core Use Cases

## Core Requirements

1. Read QR/barcodes and serial numbers from images (at least 2D codes)
2. Accept images from Claude and pass them through to the MCP server
3. Look up nutritional information via API using barcode, product name, or other identifiers
4. Handle unpackaged foods (bananas, potatoes, raw chicken) that have no barcode
5. Persist user data: custom entries, product photos, and associations between images and items so the system recognizes them on future encounters

## The Key Idea

Read data off the back of any item without requiring a barcode. Recognize store-bought and unpackaged foods from pictures. Learn from user corrections and build a personalized food database over time.

## Use Cases

### 1. Store-Bought Product (Unknown at First)

I buy a protein shake from Coop. I tell the system "I bought a protein shake from Coop."

- It doesn't recognize the exact product. It searches and suggests similar matches.
- **If one matches**: I confirm, and it uses the existing nutritional data. If nutritional data is missing, it asks me to provide it — I can either type it out or take a photo of the label and it will read the values off the image.
- **If none match**: I say no, and send it a photo of the product. It saves the image, associates it with a new entry, and asks me for nutritional values (again, by text or photo of the label).
- **Next time**: A week later I'm drinking the same shake. I take a photo and send it. The system matches it against saved images (via image recognition, embedding similarity, or agentic search) and says "I found this — is it the Coop protein shake you had before?" I confirm, and it logs the entry instantly.

### 2. Unpackaged / Raw Food with Weight

I buy raw chicken and take a photo.

- The system recognizes it as raw chicken and looks up nutritional values. If it can't find them, it asks me to provide them (text or photo, same flow as above).
- It also reads the weight off the packaging if visible in the image.
- It asks: "Are you eating all of this, or a portion?" I say "half," and it calculates accordingly.

### 3. Contextual Recognition from History

I place rice on a kitchen scale showing 100g and take a photo.

- The system identifies rice and reads the weight from the scale.
- It checks my history and notices that 19 out of the last 20 times I logged rice, it was Coop Prix Garantie Basmati.
- It asks: "Is this the Coop Prix Garantie Basmati you usually eat?" I confirm, and it logs 100g with the correct nutritional values.
