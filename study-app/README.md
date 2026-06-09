This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Study App

This is a web application to study for multiple-choice certification exams.

### JSON Import Schema for Questions

To bulk-add questions to the database, you can use a JSON file with the following structure. This is useful for generating questions with an LLM and importing them easily.

```json
{
  "certificationName": "Adobe Certified Professional - Photoshop",
  "description": "Questions for the Adobe Photoshop certification exam.",
  "questions": [
    {
      "questionText": "Which tool is used to select areas of similar color?",
      "options": [
        {
          "optionText": "Lasso Tool",
          "isCorrect": false
        },
        {
          "optionText": "Magic Wand Tool",
          "isCorrect": true,
          "explanation": "The Magic Wand Tool is designed to select pixels based on tone and color."
        },
        {
          "optionText": "Pen Tool",
          "isCorrect": false
        },
        {
          "optionText": "Brush Tool",
          "isCorrect": false
        }
      ]
    },
    {
      "questionText": "What does the acronym 'RGB' stand for?",
      "options": [
        {
          "optionText": "Red, Green, Blue",
          "isCorrect": true,
          "explanation": "RGB stands for Red, Green, and Blue, the primary colors of light."
        },
        {
          "optionText": "Red, Grey, Black",
          "isCorrect": false
        },
        {
          "optionText": "Rose, Gold, Bronze",
          "isCorrect": false
        }
      ]
    }
  ]
}
```
