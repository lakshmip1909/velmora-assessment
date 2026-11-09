
const productsUrl = "data/products.json";

const shippingDays = {
  UK: [3, 5],
  EU: [5, 8]
};

let products = [];

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

function showMessage(message) {
  document.getElementById("stylist-results").textContent = message;
}

function populateOccasions() {
  const select = document.getElementById("occasion-input");
  const occasions = [...new Set(
    products.flatMap(product => product.occasions)
  )].sort();

  occasions.forEach(occasion => {
    const option = document.createElement("option");
    option.value = occasion;
    option.textContent = occasion;
    select.appendChild(option);
  });
}

async function loadProducts() {
  try {
    const response = await fetch(productsUrl);

    if (!response.ok) {
      throw new Error("Unable to load products");
    }

    products = await response.json();
    populateOccasions();

  } catch (error) {
    showMessage(
      "The collection could not be loaded. Please try again."
    );
  }
}

function findProducts(event) {
  event.preventDefault();

  const occasion = document.getElementById("occasion-input").value;
  const budget = Number(document.getElementById("budget-input").value);
  const size = document.getElementById("size-input").value;
  const region = document.getElementById("region-input").value;
  const eventDate = document.getElementById("date-input").value;
  const results = document.getElementById("stylist-results");

  results.replaceChildren();

  if (!occasion) {
    showMessage("Please choose an occasion.");
    return;
  }

  if (eventDate && !region) {
    showMessage("Choose UK or EU to estimate delivery.");
    return;
  }

  const matches = products.filter(product => {
    const occasionMatch = product.occasions.includes(occasion);
    const budgetMatch = !budget || product.price_gbp <= budget;
    const sizeMatch = !size || product.sizes.includes(size);
    const clothingMatch = product.category !== "accessory";

    return occasionMatch && budgetMatch &&
           sizeMatch && clothingMatch;
  });

  matches.sort((a, b) => a.price_gbp - b.price_gbp);

  if (matches.length === 0) {
    showMessage(
      "No products match these preferences in the current catalogue. Try a higher budget or a different size."
    );
    return;
  }

  matches.slice(0, 3).forEach(product => {
    const card = document.createElement("article");
    card.className = "stylist-product";

    const title = document.createElement("h3");
    title.textContent = product.name;

    const details = document.createElement("p");
    details.textContent =
      `${product.id} · £${product.price_gbp} · ${product.fabric}`;

    card.append(title, details);

    const lead = document.createElement("p");
    lead.textContent =
      `Production lead time: ${product.lead_time_days} days`;
    card.appendChild(lead);

    if (region) {
      const [shipMin, shipMax] = shippingDays[region];
      const earliest = addDays(
        new Date(),
        product.lead_time_days + shipMin
      );
      const latest = addDays(
        new Date(),
        product.lead_time_days + shipMax
      );

      const delivery = document.createElement("p");
      delivery.textContent =
        `Estimated delivery: ${formatDate(earliest)} – ${formatDate(latest)}. Not guaranteed.`;
      card.appendChild(delivery);

      if (eventDate) {
        const deadline = new Date(eventDate + "T23:59:59");
        const warning = document.createElement("p");

        warning.textContent =
          latest <= deadline
            ? "Estimated to arrive before your event, but not guaranteed."
            : earliest > deadline
              ? "Unlikely to arrive before your event."
              : "May arrive in time, but cannot be confirmed.";

        card.appendChild(warning);
      }
    }

    if (product.id === "VLM-008") {
      const link = document.createElement("a");
      link.href = "product.html";
      link.textContent = "View Vela dress";
      card.appendChild(link);
    }

    results.appendChild(card);
  });
}

document.getElementById("stylist-form")
  .addEventListener("submit", findProducts);

loadProducts();
