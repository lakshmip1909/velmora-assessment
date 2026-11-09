
const productsUrl = "data/products.json";

const shippingDays = {
  UK: [3, 5],
  EU: [5, 8]
};

let products = [];
let searchNumber = 0;

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function normalise(value) {
  return String(value ?? "").trim().toLowerCase();
}

function showMessage(message) {
  document.getElementById("stylist-results").textContent = message;
}

function populateOccasions() {
  const select = document.getElementById("occasion-input");

  const occasions = [...new Set(
    products.flatMap(product => product.occasions || [])
  )].sort();

  select.innerHTML =
    '<option value="">Choose an occasion</option>';

  occasions.forEach(occasion => {
    const option = document.createElement("option");
    option.value = occasion;
    option.textContent = occasion;
    select.appendChild(option);
  });
}

function populateFits() {
  const select = document.getElementById("fit-input");

  const fits = [...new Set(
    products.map(product => product.fit).filter(Boolean)
  )].sort();

  select.innerHTML = '<option value="">Any fit</option>';

  fits.forEach(fit => {
    const option = document.createElement("option");
    option.value = fit;
    option.textContent = fit;
    select.appendChild(option);
  });
}

async function loadProducts() {
  try {
    const response = await fetch(productsUrl);

    if (!response.ok) {
      throw new Error("Unable to load products");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid product catalogue");
    }

    products = data;
    populateOccasions();
    populateFits();

  } catch (error) {
    showMessage(
      "The collection could not be loaded. Please try again."
    );
  }
}

function getDeliveryRange(product, region) {
  if (!region || !shippingDays[region]) return null;

  if (
    product.lead_time_days === null ||
    product.lead_time_days === undefined ||
    product.lead_time_days === ""
  ) {
    return null;
  }

  const leadTime = Number(product.lead_time_days);

  if (!Number.isFinite(leadTime) || leadTime < 0) {
    return null;
  }

  const [shipMin, shipMax] = shippingDays[region];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    earliest: addDays(today, leadTime + shipMin),
    latest: addDays(today, leadTime + shipMax)
  };
}

function getDeliveryStatus(product, region, eventDate) {
  if (!region || !eventDate) return null;

  const range = getDeliveryRange(product, region);

  if (!range) {
    return {
      rank: 3,
      message: "Delivery timing cannot be confirmed."
    };
  }

  const deadline = new Date(eventDate + "T23:59:59");

  if (range.latest <= deadline) {
    return {
      rank: 0,
      message:
        "Estimated to arrive before your event, but not guaranteed."
    };
  }

  if (range.earliest <= deadline) {
    return {
      rank: 1,
      message:
        "May arrive in time, but cannot be confirmed."
    };
  }

  return {
    rank: 2,
    message:
      "Unlikely to arrive before your event."
  };
}

// Ask the AI to explain products already selected by our catalogue rules.
async function addAIExplanations(matches, preferences, currentSearch) {
  const results = document.getElementById("stylist-results");

  const section = document.createElement("section");
  section.setAttribute("aria-label", "AI styling insights");

  const heading = document.createElement("h3");
  heading.textContent = "AI Styling Insights";

  const status = document.createElement("p");
  status.textContent = "Preparing AI styling insights...";

  section.append(heading, status);
  results.appendChild(section);

  const selectedProducts = matches.slice(0, 3).map(product => {
    const deliveryStatus = preferences.eventDate
      ? getDeliveryStatus(
          product,
          preferences.region,
          preferences.eventDate
        )
      : null;

    return {
      id: product.id,
      name: product.name,
      price_gbp: product.price_gbp,
      fabric: product.fabric,
      fit: product.fit,
      delivery_status: deliveryStatus
        ? deliveryStatus.message
        : ""
    };
  });

  try {
    const response = await fetch(
      "/.netlify/functions/stylist-ai",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          occasion: preferences.occasion,
          budget: preferences.budget,
          size: preferences.size,
          products: selectedProducts
        })
      }
    );

    if (!response.ok) {
      throw new Error("AI unavailable");
    }

    const data = await response.json();

    if (!Array.isArray(data.explanations)) {
      throw new Error("Invalid AI response");
    }

    // Ignore an old AI response if the user has searched again.
    if (currentSearch !== searchNumber) return;

    const explanationList = document.createElement("div");

    data.explanations.forEach(item => {
      const product = selectedProducts.find(
        product => product.id === item.id
      );

      if (!product || typeof item.text !== "string") return;

      const paragraph = document.createElement("p");
      const strong = document.createElement("strong");

      strong.textContent =
        `${product.name} (${product.id}): `;

      paragraph.appendChild(strong);
      paragraph.appendChild(
        document.createTextNode(item.text)
      );

      explanationList.appendChild(paragraph);
    });

    if (!explanationList.children.length) {
      throw new Error("No valid explanations");
    }

    status.replaceWith(explanationList);

    const disclaimer = document.createElement("p");
    disclaimer.textContent =
      "AI-generated explanations are supplementary. " +
      "Product facts and delivery estimates above take priority.";

    section.appendChild(disclaimer);

  } catch (error) {
    if (currentSearch !== searchNumber) return;

    status.textContent =
      "AI styling insights are currently unavailable. " +
      "The catalogue recommendations above remain available.";
  }
}

function findProducts(event) {
  event.preventDefault();

  searchNumber += 1;
  const currentSearch = searchNumber;

  const occasion =
    document.getElementById("occasion-input").value;

  const category =
    document.getElementById("category-input").value;

  const fit =
    document.getElementById("fit-input").value;

  const budgetText =
    document.getElementById("budget-input").value.trim();

  const budget =
    budgetText === "" ? null : Number(budgetText);

  const size =
    document.getElementById("size-input").value;

  const region =
    document.getElementById("region-input").value;

  const eventDate =
    document.getElementById("date-input").value;

  const results =
    document.getElementById("stylist-results");

  results.replaceChildren();

  if (!products.length) {
    showMessage("The collection is not available at the moment.");
    return;
  }

  if (!occasion) {
    showMessage("Please choose an occasion.");
    return;
  }

  if (
    budget !== null &&
    (!Number.isFinite(budget) || budget <= 0)
  ) {
    showMessage("Please enter a valid maximum budget.");
    return;
  }

  if (eventDate && !region) {
    showMessage("Choose UK or EU to estimate delivery.");
    return;
  }

  if (eventDate) {
    const selectedDate = new Date(eventDate + "T23:59:59");

    if (
      !Number.isFinite(selectedDate.getTime()) ||
      selectedDate < new Date()
    ) {
      showMessage("Please choose a current or future event date.");
      return;
    }
  }

  const matches = products.filter(product => {
    const occasionMatch = (product.occasions || [])
      .some(item => normalise(item) === normalise(occasion));

    const categoryMatch =
      !category ||
      normalise(product.category) === normalise(category);

    const fitMatch =
      !fit ||
      normalise(product.fit) === normalise(fit);

    const price = Number(product.price_gbp);

    const validPrice =
      product.price_gbp !== null &&
      product.price_gbp !== undefined &&
      product.price_gbp !== "" &&
      Number.isFinite(price) &&
      price >= 0;

    const budgetMatch =
      budget === null || (validPrice && price <= budget);

    const sizeMatch =
      !size ||
      (product.sizes || []).some(
        item => normalise(item) === normalise(size)
      );

    const clothingMatch =
      normalise(product.category) !== "accessory";

    return (
      occasionMatch &&
      categoryMatch &&
      fitMatch &&
      budgetMatch &&
      sizeMatch &&
      clothingMatch &&
      validPrice
    );
  });

  matches.sort((a, b) => {
    if (eventDate && region) {
      const aStatus = getDeliveryStatus(a, region, eventDate);
      const bStatus = getDeliveryStatus(b, region, eventDate);

      if (aStatus.rank !== bStatus.rank) {
        return aStatus.rank - bStatus.rank;
      }

      const aLead = Number(a.lead_time_days);
      const bLead = Number(b.lead_time_days);

      if (
        Number.isFinite(aLead) &&
        Number.isFinite(bLead) &&
        aLead !== bLead
      ) {
        return aLead - bLead;
      }
    }

    return Number(a.price_gbp) - Number(b.price_gbp);
  });

  if (!matches.length) {
    showMessage(
      "No products match these preferences in the current " +
      "catalogue. Try a different category, fit, size or budget."
    );
    return;
  }

  if (eventDate && region) {
    const onTimeCount = matches.filter(product =>
      getDeliveryStatus(product, region, eventDate).rank === 0
    ).length;

    if (onTimeCount === 0) {
      const notice = document.createElement("p");

      notice.textContent =
        "Important: No matching product has an estimated " +
        "delivery range entirely before your event. " +
        "The pieces below are shown for comparison, " +
        "not as confirmed event-ready options.";

      results.appendChild(notice);
    }
  }

  const introduction = document.createElement("p");

  introduction.textContent =
    `Showing up to 3 pieces from the Velmora catalogue ` +
    `(${matches.length} match${matches.length === 1 ? "" : "es"} found).`;

  results.appendChild(introduction);

  matches.slice(0, 3).forEach(product => {
    const card = document.createElement("article");
    card.className = "stylist-product";

    const title = document.createElement("h3");
    title.textContent = product.name;

    const details = document.createElement("p");
    details.textContent =
      `${product.id} · £${product.price_gbp} · ` +
      `${product.fabric || "Fabric not specified"}`;

    card.append(title, details);

    const suitability = document.createElement("p");

    let explanation =
      `Why this piece: ${product.name} is listed for ${occasion}`;

    if (product.fabric) {
      explanation += ` and is made from ${product.fabric}`;
    }

    if (product.fit) {
      explanation += `, with a ${product.fit} fit`;
    }

    explanation += `. Priced at £${product.price_gbp}`;

    if (budget !== null) {
      explanation += `, within your £${budget} budget`;
    }

    if (size) {
      explanation += `, with ${size} listed for this piece`;
    }

    explanation += ".";

    suitability.textContent = explanation;
    card.appendChild(suitability);

    const lead = document.createElement("p");
    const leadTime = Number(product.lead_time_days);

    lead.textContent =
      product.lead_time_days !== null &&
      product.lead_time_days !== undefined &&
      product.lead_time_days !== "" &&
      Number.isFinite(leadTime) &&
      leadTime >= 0
        ? `Production lead time: ${leadTime} days`
        : "Production lead time is not available.";

    card.appendChild(lead);

    if (region) {
      const range = getDeliveryRange(product, region);
      const delivery = document.createElement("p");

      delivery.textContent = range
        ? `Estimated delivery: ${formatDate(range.earliest)} – ` +
          `${formatDate(range.latest)}. Not guaranteed.`
        : "Delivery timing cannot be confirmed.";

      card.appendChild(delivery);

      if (eventDate) {
        const status = getDeliveryStatus(
          product,
          region,
          eventDate
        );

        const warning = document.createElement("p");
        warning.textContent = status.message;
        card.appendChild(warning);
      }
    } else {
      const deliveryNote = document.createElement("p");

      deliveryNote.textContent =
        "Choose a delivery destination for an estimated arrival range.";

      card.appendChild(deliveryNote);
    }

    if (product.id === "VLM-008") {
      const link = document.createElement("a");
      link.href = "product.html";
      link.textContent = "View Vela dress";
      card.appendChild(link);
    }

    results.appendChild(card);
  });

  addAIExplanations(matches, {
    occasion,
    budget,
    size,
    region,
    eventDate
  }, currentSearch);
}

document.getElementById("stylist-form")
  .addEventListener("submit", findProducts);

loadProducts();
