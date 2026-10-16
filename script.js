const listDiv = document.getElementById("listings");
const featuredDiv = document.getElementById("featured");

// Use dynamic API origin so it works both locally and in production (Render)
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5001"
  : "";

let allProperties = [];
window.allProperties = allProperties;

const imgIndexMap = {};

/* ---------------- LOAD FROM DB ---------------- */

async function loadAllProperties() {
  try {
    const res = await fetch(`${API_BASE}/properties`);
    const data = await res.json();

    allProperties = data;
    window.allProperties = data;

    showProperties(allProperties);
    showFeatured();

  } catch (err) {
    console.error("Failed to load properties", err);
  }
}

/* ---------------- SHOW LIST ---------------- */

function showProperties(list) {
  listDiv.innerHTML = "";

  list.forEach(p => {
    // Default image fallback if array is empty
    const firstImg = (p.images && p.images.length > 0) ? p.images[0] : "/images/placeholder.jpg";

    listDiv.innerHTML += `
     <div class="card">

      ${p.featured ? `<div class="ribbon">⭐ Featured</div>` : ""}

      <div class="img-box">
        <span class="tag ${p.purpose}">${p.purpose.toUpperCase()}</span>
        <span class="price-badge">${p.priceText}</span>

        <img id="img-${p._id}" src="${API_BASE}${firstImg}" alt="${p.bhk} Property">

        ${p.images && p.images.length > 1 ? `
          <div class="nav prev" onclick="slide(event, '${p._id}', -1)">❮</div>
          <div class="nav next" onclick="slide(event, '${p._id}', 1)">❯</div>
        ` : ""}
      </div>

      <div class="card-body" onclick="openDetails('${p._id}')">
        <h3>${p.bhk} - ${p.area}</h3>
        <p>${p.details ? p.details.substring(0, 60) + '...' : ''}</p>
      </div>

      <button onclick="contact(event, '${p._id}')">WhatsApp</button>
    </div>
    `;
  });
}

/* ---------------- FEATURED ---------------- */

function showFeatured() {
  const top = allProperties.filter(p => p.featured);

  featuredDiv.innerHTML = "";

  top.forEach(p => {
    const firstImg = (p.images && p.images.length > 0) ? p.images[0] : "/images/placeholder.jpg";

    featuredDiv.innerHTML += `
      <div class="card" onclick="openDetails('${p._id}')">
        <img src="${API_BASE}${firstImg}" alt="${p.bhk} Property">
        <h3>${p.bhk} - ${p.area}</h3>
        <p>${p.priceText}</p>
      </div>
    `;
  });
}

/* ---------------- FILTER ---------------- */

function applyFilter() {
  const bhk = document.getElementById("bhk").value;
  const purpose = document.getElementById("purpose").value;
  const area = document.getElementById("area").value;
  const budget = document.getElementById("budget").value;

  let filtered = allProperties.filter(p =>
    (bhk === "all" || p.bhk === bhk) &&
    (purpose === "all" || p.purpose === purpose) &&
    (area === "all" || p.area === area) &&
    (budget === "all" || p.price <= Number(budget))
  );

  showProperties(filtered);
}

/* ---------------- NAVIGATION ---------------- */

function openDetails(id) {
  window.location.href = "property.html?id=" + id;
}

/* ---------------- CONTACT ---------------- */

/* ---------------- CONTACT (PROPERTY-SPECIFIC) ---------------- */

function contact(e, id) {
  e.stopPropagation(); // Prevents opening property details page

  // Find the specific property from allProperties array
  const p = window.allProperties.find(x => x._id === id);

  let msgText = "Hey Arman Homes, I'm interested in your property. Details please.";

  if (p) {
    // Construct a specific message with property BHK, Area, Location, and Price
    msgText = `Hey Arman Homes, I'm interested in this property:\n\n` +
              `🏠 *Property:* ${p.bhk} - ${p.area}\n` +
              `💰 *Price:* ${p.priceText}\n` +
              `📌 *Type:* ${p.purpose.toUpperCase()}\n\n` +
              `Please share more details.`;
  }

  const msg = encodeURIComponent(msgText);
  window.open("https://wa.me/919717246466?text=" + msg, "_blank");
}

/* ---------------- MANUAL IMAGE SLIDER ---------------- */

function slide(e, id, dir) {
  if (e) e.stopPropagation(); // Prevents opening property details when clicking next/prev arrows

  const p = window.allProperties.find(x => x._id === id);
  if (!p || !p.images || p.images.length === 0) return;

  if (imgIndexMap[id] === undefined) imgIndexMap[id] = 0;

  imgIndexMap[id] = (imgIndexMap[id] + dir + p.images.length) % p.images.length;

  const imgEl = document.getElementById("img-" + id);
  if (imgEl) {
    imgEl.src = API_BASE + p.images[imgIndexMap[id]];
  }
}

/* ---------------- INIT ---------------- */

loadAllProperties();