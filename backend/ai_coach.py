import json

import httpx

# ── Consistency controls ───────────────────────────────────────────────────────
# 1. Models are pinned to exact versions (not floating aliases) so provider
#    updates don't silently change output behavior.
# 2. Low temperature (0.3) keeps plans nearly deterministic for the same input.
# 3. The prompt forces an exact markdown skeleton, so all three providers
#    return the same structure even though prose style differs.

PINNED_MODELS = {
    "openai": "gpt-4o-2024-08-06",
    "anthropic": "claude-sonnet-4-20250514",
    "gemini": "gemini-2.5-flash",
}
TEMPERATURE = 0.3
MAX_TOKENS = 4000

SUPPORTED_PROVIDERS = set(PINNED_MODELS.keys())


def build_prompt(workout_history: list, goal: str, days_per_week: int, notes: str = "") -> str:
    history_str = json.dumps(workout_history, indent=2, default=str)
    return f"""You are an expert strength and conditioning coach. Based on the user's recent workout history, generate a personalized weekly training plan.

User goal: {goal}
Days per week available: {days_per_week}
Additional notes: {notes or "None"}

Recent workout history (last 10 sessions):
{history_str}

Respond using EXACTLY this markdown template. Do not add sections, do not remove sections, do not change the headers. Fill in every placeholder:

## Weekly Split
[One line naming the split, e.g. "4-day Upper/Lower"]

## Day-by-Day Plan
### Day 1 — [focus]
- [Exercise] — [sets] x [rep range or duration] @ [intensity guidance]
(list 4-6 exercises per day; repeat the "### Day N" block for each of the {days_per_week} training days)

## Insights From Your History
1. [Insight tied to a specific exercise or pattern in the logged data]
2. [Second insight]
3. [Third insight]

## Progressive Overload Tip
[One specific, numeric recommendation based on their current logged weights or times]

Rules: reference the user's actual logged exercises and numbers wherever possible. Keep each bullet to one line. Do not include any text before the first header or after the last section."""


async def get_ai_coaching(prompt: str, provider: str, api_key: str) -> str:
    """All providers are bring-your-own-key. Keys are used for this one request
    and never stored or logged server-side."""
    provider = (provider or "").lower().strip()
    if provider not in SUPPORTED_PROVIDERS:
        raise ValueError(f"Unsupported provider '{provider}'. Choose one of: {', '.join(sorted(SUPPORTED_PROVIDERS))}.")
    if not api_key or not api_key.strip():
        raise ValueError("An API key is required. Paste your key in the AI Coach form.")
    api_key = api_key.strip()

    if provider == "anthropic":
        return await _call_anthropic(prompt, api_key)
    if provider == "gemini":
        return await _call_gemini(prompt, api_key)
    return await _call_openai(prompt, api_key)


async def _call_openai(prompt: str, api_key: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model=PINNED_MODELS["openai"],
        messages=[{"role": "user", "content": prompt}],
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
    )
    return response.choices[0].message.content


async def _call_anthropic(prompt: str, api_key: str) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model=PINNED_MODELS["anthropic"],
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def _call_gemini(prompt: str, api_key: str) -> str:
    # Gemini's REST API — no extra SDK needed, httpx is already a dependency.
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{PINNED_MODELS['gemini']}:generateContent"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": TEMPERATURE,
            "maxOutputTokens": MAX_TOKENS,
            # Gemini 2.5 is a "thinking" model — reasoning tokens count against
            # maxOutputTokens. Disable thinking so the full budget goes to the plan.
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            url,
            headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
            json=payload,
        )
    if resp.status_code in (401, 403):
        raise ValueError("Gemini rejected the API key. Check that it's valid.")
    resp.raise_for_status()
    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise ValueError("Gemini returned an unexpected response. Try again.")
