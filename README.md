
# Receipt Processing System

A full-stack system for processing `.heic` receipts, built with NestJS, React, and AWS. Uses Llama 3.2 Vision for smart receipt analysis.

## What it does

- Handles bulk `.heic` receipt uploads
- Converts images and extracts data using AWS Textract
- Uses Llama 3.2 Vision for smart categorization
- Stores everything in MongoDB for easy querying
- Shows insights through a React dashboard

## Tech Stack

### Frontend
- React + Vite
- TanStack Query for data fetching
- Shadcn components (dark mode included!)

### Backend
- NestJS running on Vercel
- MongoDB for storage
- Redis + BullMQ for job queues
- AWS S3 + Textract

## Why these choices?

I previously built something similar at EngineRay using Tesseract OCR, but it was a pain to get reliable data extraction. After experimenting with different OCR solutions, AWS Textract consistently gave the best results for receipt data.

Adding Llama 3.2 Vision was a game-changer - it catches things that pure OCR misses, like understanding if a "chicken sandwich" should be categorized under "lunch" or "groceries" based on the receipt context.

### The Llama 3.2 Vision tradeoff

The good:
- Actually understands what it's looking at
- Great at categorizing items
- Can handle messy receipts

The not-so-good:
- Takes more compute power
- Slower than pure OCR
- More expensive to run


## System design
![image](https://github.com/user-attachments/assets/23350ff8-0565-4de8-98de-fd8af12acf97)

## Under the hood

### Performance tweaks
- Lazy loading for all the heavy UI components
- Smart caching with TanStack Query
- Vercel for that sweet auto-scaling

### Processing pipeline
1. Frontend handles `.heic` uploads
2. Files land in S3
3. Queue system converts images
4. Textract does initial OCR
5. Llama 3.2 Vision adds smart categorization
6. Everything gets saved to MongoDB
7. Frontend updates via TanStack Query

### Security & scaling
- CORS and HTTPS configured
- Serverless setup handles traffic spikes nicely
- Queue system prevents overload during bulk uploads

## Future enhancements

-  User-specific receipt collections
-  Smart alerts for weird spending patterns
- Real-time processing notifications
-  More granular spending insights
-  Export options
