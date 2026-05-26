import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")


def build_prompt(workout_history: list, goal: str, days_per_week: int, notes: str = "") -> str:
    history_str = json.dumps(workout_history, indent=2, default=str)
    return f"""You are an expert strength and conditioning coach. Based on the user's recent workout history, generate a personalized weekly training plan.

User goal: {goal}
Days per week available: {days_per_week}
Additional notes: {notes or "None"}

Recent workout history (last 10 sessions):
{history_str}

Please provide:
1. A weekly training split (e.g. Push/Pull/Legs, Upper/Lower, etc.)
2. Specific exercises for each day with sets and rep ranges
3. 2-3 actionable insights based on the workout history (e.g. muscle groups to prioritize, rest suggestions)
4. One progressive overload tip based on their current numbers

Format your response clearly with headers for each day and section. Be specific and encouraging."""


async def get_ai_coaching(prompt: str) -> str:
    provider = AI_PROVIDER.lower()

    if provider == "anthropic":
        return await _call_anthropic(prompt)
    elif provider == "bedrock":
        return await _call_bedrock(prompt)
    else:
        return await _call_openai(prompt)


async def _call_openai(prompt: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
    )
    return response.choices[0].message.content


async def _call_anthropic(prompt: str) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def _call_bedrock(prompt: str) -> str:
    import boto3
    import json as _json

    client = boto3.client(
        "bedrock-runtime",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")
    body = _json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1500,
        "messages": [{"role": "user", "content": prompt}],
    })
    response = client.invoke_model(modelId=model_id, body=body)
    result = _json.loads(response["body"].read())
    return result["content"][0]["text"]
