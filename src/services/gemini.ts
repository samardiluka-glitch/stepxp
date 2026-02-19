/**
 * Mock Gemini service (no API key required)
 */

export const geminiModel = {
    generateContent: async (prompt: string) => ({
        response: {
            text: () => "Keep pushing! You're doing great. Mock AI response."
        }
    })
};

export async function askGemini(prompt: string): Promise<string> {
    // Simulate delay
    await new Promise(r => setTimeout(r, 1000));

    if (prompt.includes('quote')) {
        const quotes = [
            "The only bad workout is the one that didn't happen.",
            "Your body can stand almost anything. It’s your mind that you have to convince.",
            "Fitness is not about being better than someone else. It’s about being better than you were yesterday.",
            "Success usually comes to those who are too busy to be looking for it."
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    return "Great job staying active! Keep hitting those step goals to level up your fitness journey.";
}
