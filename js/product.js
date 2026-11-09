
const PRODUCT_ID = "VLM-008";

const SHIPPING = {
  UK: [3, 5],
  EU: [5, 8]
};

let currentProduct = null;

function getElement(id) {
  return document.getElementById(id);
}

function capitalise(text) {
  return String(text)
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function addCalendarDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function displayDate(date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function fillSelect(id, values) {
  const select = getElement(id);

  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = capitalise(value);
    select.appendChild(option);
  });
}

function updateDelivery() {
  if (!currentProduct) return;

  const region = getElement("product-region").value;
  const eventDate = getElement("product-event-date").value;
  const result = getElement("product-delivery-result");

  const shipping = SHIPPING[region];

  if (!shipping) {
    result.textContent = "Delivery estimate unavailable.";
    return;
  }

  const lead = Number(currentProduct.lead_time_days);

  if (!Number.isFinite(lead)) {
    result.textContent = "Production time unavailable.";
    return;
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const earliest = addCalendarDays(
    today,
    lead + shipping[0]
  );

  const latest = addCalendarDays(
    today,
    lead + shipping[1]
  );

  getElement("delivery-summary").textContent =
    `${lead} days production + ${shipping[0]}–${shipping[1]} days shipping to ${region}. Estimated arrival: ${displayDate(earliest)} – ${displayDate(latest)}. Not guaranteed.`;

  let message =
    `Estimated arrival: ${displayDate(earliest)} – ${displayDate(latest)}. These dates are indicative, not guaranteed.`;

  if (eventDate) {
    const deadline = new Date(eventDate + "T12:00:00");

    if (latest <= deadline) {
      message +=
        " Estimated to arrive before your event, but not guaranteed.";
    } else if (earliest > deadline) {
      message +=
        " This piece is unlikely to arrive before your event.";
    } else {
      message +=
        " It may arrive in time, but we cannot confirm this.";
    }
  }

  result.textContent = message;
}

function handleAddToBag(event) {
  event.preventDefault();

  if (!currentProduct) return;

  const colour = getElement("product-colour").value;
  const size = getElement("product-size").value;
  const message = getElement("product-message");

  if (!colour || !size) {
    message.textContent =
      "Please choose a colour and UK size.";
    return;
  }

  message.textContent =
    `${currentProduct.name} in ${capitalise(colour)}, ${size}, added to the demonstration bag. No real order has been placed.`;
}

async function loadProduct() {
  const message = getElement("product-message");

  try {
    const response = await fetch("data/products.json");

    if (!response.ok) {
      throw new Error("Catalogue unavailable");
    }

    const products = await response.json();

    currentProduct = products.find(
      product => product.id === PRODUCT_ID
    );

    if (!currentProduct) {
      throw new Error("Product not found");
    }

    getElement("product-name").textContent =
      currentProduct.name;

    const price = `£${currentProduct.price_gbp}`;

    getElement("product-price").textContent = price;
    getElement("mobile-product-price").textContent = price;

    getElement("product-description").textContent =
      currentProduct.description;

    getElement("product-fabric").textContent =
      capitalise(currentProduct.fabric);

    getElement("product-fit").textContent =
      capitalise(currentProduct.fit);

    getElement("product-occasions").textContent =
      currentProduct.occasions
        .map(capitalise)
        .join(", ");

    fillSelect(
      "product-colour",
      currentProduct.colours
    );

    fillSelect(
      "product-size",
      currentProduct.sizes
    );

    updateDelivery();

  } catch (error) {
    getElement("delivery-summary").textContent =
      "Product information is currently unavailable.";

    message.textContent =
      "We couldn't load this product. Please refresh the page.";

    document.querySelector(
      ".product-add-button"
    ).disabled = true;
  }
}

getElement("product-region")
  .addEventListener("change", updateDelivery);

getElement("product-event-date")
  .addEventListener("change", updateDelivery);

getElement("product-form")
  .addEventListener("submit", handleAddToBag);

loadProduct();
