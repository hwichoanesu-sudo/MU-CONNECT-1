const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST: Muconnect AI Assistant & Storefront Generator endpoint
router.post('/chat', async (req, res) => {
    try {
        const { prompt, context_type, user_query } = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(503).json({
                success: false,
                error: 'AI service temporarily unavailable (API key missing).',
                fallback: true
            });
        }

        // Fetch live active product context from Supabase to give the AI real-world awareness
        let marketplaceContext = '';
        if (context_type === 'buyer' || !context_type) {
            const { data: products } = await supabase
                .from('products')
                .select('name, price, category, businesses(business_name)')
                .eq('is_available', true)
                .limit(15);
            
            marketplaceContext = `Available campus products right now: ${JSON.stringify(products || [])}`;
        }

        const systemPrompt = `You are Muconnect AI, the smart, friendly assistant for Muconnect—a premier student marketplace at Mulungushi University in Zambia. You help students discover campus food, tech, fashion, and services, and assist student vendors in optimizing their storefronts. Keep responses concise, energetic, helpful, and localized to campus life. ${marketplaceContext}`;

        // Call Groq API using native server-side fetch
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: user_query || prompt || 'Hello!' }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!groqResponse.ok) {
            const errorBody = await groqResponse.text();
            throw new Error(`Groq API returned status ${groqResponse.status}: ${errorBody}`);
        }

        const aiData = await groqResponse.json();
        const aiMessage = aiData.choices?.[0]?.message?.content || 'Welcome to Muconnect! What are you looking for today?';

        res.status(200).json({
            success: true,
            response: aiMessage
        });

    } catch (err) {
        console.error('AI Route Error:', err.message);
        res.status(500).json({
            success: false,
            error: 'AI assistant is resting right now. Please use the normal search bar below!',
            fallback: true
        });
    }
});

module.exports = router;
