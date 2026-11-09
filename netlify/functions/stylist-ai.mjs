
export default async (request) => {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { occasion, budget, size, products } = body;

    if (
      typeof occasion !== "string" ||
      !Array.isArray(products) ||
      products.length < 1 ||
      products.length > 3
    ) {
      return Response.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Accept only a small amount of product information.
    const safeProducts = products.map(product => ({
      id: String(product.id || "").slice(0, 40),
      name: String(product.name || "").slice(0, 100),
      price_gbp: Number(product.price_gbp),
      fabric: String(product.fabric || "").slice(0, 100),
      fit: String(product.fit || "").slice(0, 100),
      delivery_status: String(
        product.delivery_status || ""
      ).slice(0, 150)
    }));

    const instructions = `
You are Velmora's concise shopping assistant.

Use ONLY the product facts supplied in the user message.

Write one short, useful explanation per product.

Rules:
- Do not invent products, prices, sizes, colours, reviews,
  stock availability, fabric properties or delivery dates.
- Never promise arrival before an event.
- Do not make unsupported quality or sustainability claims.
- If a delivery warning exists, respect it.
- Do not recommend purchasing a piece for an event
  if its delivery status says it is unlikely to arrive.
- Use warm, understated British English.
- Return ONLY a JSON object with this structure:
  {"explanations":[{"id":"SKU","text":"Explanation"}]}
- Each explanation must be no more than 45 words.
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions,
          input: JSON.stringify({
            occasion: occasion.slice(0, 100),
            budget,
            size: String(size || "").slice(0, 30),
            products: safeProducts
          }),
          text: {
            format: {
              type: "json_object"
            }
          },
          max_output_tokens: 400
        })
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: "AI service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();

    const outputText = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("");

    const parsed = JSON.parse(outputText);

    if (!Array.isArray(parsed.explanations)) {
      throw new Error("Invalid AI response");
    }

    // Only return explanations for supplied SKUs.
    const allowedIds = new Set(
      safeProducts.map(product => product.id)
    );

    const explanations = parsed.explanations
      .filter(item =>
        allowedIds.has(item.id) &&
        typeof item.text === "string" &&
        item.text.length <= 350
      )
      .map(item => ({
        id: item.id,
        text: item.text
      }));

    return Response.json({ explanations });

  } catch (error) {
    return Response.json(
      { error: "AI explanation unavailable" },
      { status: 500 }
    );
  }
};
