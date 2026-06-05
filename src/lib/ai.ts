export async function getAICoaching(scenario: string) {
  const response = await fetch("/api/ai/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  return response.json();
}

export async function getAIReflection(input: string) {
  const response = await fetch("/api/ai/reflection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  return response.json();
}

export async function getAIDocumentation(notes: string) {
  const response = await fetch("/api/ai/document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
  return response.json();
}

export async function checkAILanguage(text: string) {
  const response = await fetch("/api/ai/language-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return response.json();
}

export async function getAIWellnessSupport(data: { mood: number, energy: number, stress: number, notes?: string }) {
  const response = await fetch("/api/ai/wellness-support", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
