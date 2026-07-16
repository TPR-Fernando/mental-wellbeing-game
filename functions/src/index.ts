import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Hard limits can be checked in Firestore or using App Check
const MAX_CALLS_PER_USER_PER_DAY = 3;

export const generateGameEndInsights = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated (Optional for testing, preferable for Prod)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    // }

    const { choices, freeTextMap, who5Score, swemwbsScore } = data;

    // TODO: Verify daily limits here against a user usage document in Firestore

    try {
        // TODO: Call LLM API (OpenAI/Gemini)
        // Parse the choices + text into a prompt.
        // E.g., OpenAI.com/v1/chat/completions ...
        
        // Mock Response to simulate LLM AI return
        const mockResponse = {
            summary: `Based on your responses, you exhibit strong problem-solving skills but seem to be experiencing some minor stress regarding future academic goals. Your WHO-5 score of ${who5Score} suggests generally positive wellbeing.`,
            followUpQuestions: [
                "You mentioned feeling uncertain about the future. What specifically is on your mind?",
                "How do you usually unwind after a long day of studying?"
            ]
        };
        
        return { success: true, data: mockResponse };

    } catch (error) {
        console.error("LLM API Error:", error);

        // Fallback Logic Rule-based
        const fallbackSummary = `Thank you for playing! Your wellbeing indicators show a WHO-5 score of ${who5Score} and SWEMWBS of ${swemwbsScore}.`;
        const fallbackQuestions = [
            "What was the most challenging part of today's story for you?",
            "How did your choices reflect how you actually feel today?"
        ];

        return { 
            success: false, 
            data: { summary: fallbackSummary, followUpQuestions: fallbackQuestions },
            message: "Using fallback mechanism due to API limits/errors."
        };
    }
});