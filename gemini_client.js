import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import dotenv from 'dotenv'
dotenv.config();

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAi.getGenerativeModel({model:"gemini-2.5-pro"});

export async function toASLGlossGemini(text) {

    try {
            const prompt = ` Convert the following English sentence into **ASL Gloss**.
  Rules:
  - Use ALL CAPS.
  - Drop articles ("a", "the", "an") and auxiliary verbs ("is", "are", "will").
  - Keep word order closer to ASL.
  - Output only gloss, no explanations.

  Sentence: "${text}"`;


  const result = await model.generateContent(prompt);
  console.log("result is : ", result);
  return result.response.text().trim();
    } catch (error) {
        console.log("error is : ", error);
        return error;
    }


}
