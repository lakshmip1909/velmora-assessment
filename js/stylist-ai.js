
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

let extractorPromise = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import(
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
      );

      return pipeline("feature-extraction", MODEL_ID, {
        dtype: "q8",
        device: "wasm"
      });
    })().catch(error => {
      extractorPromise = null;
      throw error;
    });
  }

  return extractorPromise;
}

function describeProduct(product) {
  return [
    product.name,
    product.category,
    product.fit,
    product.fabric,
    ...(product.occasions || [])
  ].filter(Boolean).join(". ");
}

function similarity(a, b) {
  let score = 0;

  for (let i = 0; i < a.length; i++) {
    score += a[i] * b[i];
  }

  return score;
}

export async function rankWithAI(matches, preferences) {
  if (matches.length < 2) {
    return matches;
  }

  const extractor = await getExtractor();

  const customerDescription = [
    preferences.occasion,
    preferences.category,
    preferences.fit,
    "evening wear outfit"
  ].filter(Boolean).join(". ");

  const descriptions = [
    customerDescription,
    ...matches.map(describeProduct)
  ];

  const embeddings = await extractor(descriptions, {
    pooling: "mean",
    normalize: true
  });

  const vectors = embeddings.tolist();
  const customerVector = vectors[0];

  return matches.map((product, index) => ({
    product,
    score: similarity(customerVector, vectors[index + 1]),
    originalRank: index
  }))
    .sort((a, b) =>
      b.score - a.score || a.originalRank - b.originalRank
    )
    .map(item => item.product);
}
