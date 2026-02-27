import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ======================
   DOM
====================== */
const fineForm = document.getElementById("fineForm");
const playerSearch = document.getElementById("playerSearch");
const playerResults = document.getElementById("playerResults");
const amountInput = document.getElementById("amount");
const reasonInput = document.getElementById("reason");

const totalsList = document.getElementById("totalsList");

const historySection = document.getElementById("historySection");
const historyTitle = document.getElementById("historyTitle");
const historyList = document.getElementById("historyList");
const closeHistory = document.getElementById("closeHistory");
const reasonResults = document.getElementById("reasonResults");

const teamPot = document.getElementById("teamPot");

const topThreeList = document.getElementById("topThreeList");

/* ======================
   FIRESTORE
====================== */
const playersRef = collection(db, "players");
const finesRef = collection(db, "fines");

/* ======================
   STATE
====================== */
let players = {};          // { playerId: name }
let fines = [];
let selectedPlayerId = null;
const finePresets = [
  { text: "Sen ankomst till match/träning", amount: 20 },
  { text: "Ej hört av sig till tränarna", amount: 20 },
  { text: "Ingen pikétröja till match (A/B)", amount: 30 },
  { text: "Glömt benskydd eller fotbollskor till match", amount: 30 },
  { text: "Gult kort för snack", amount: 40 },
  { text: "Rött kort för snack", amount: 40 },
  { text: "Däckat på lagfest", amount: 50 },
  { text: "Spya på lagfest", amount: 20 },
  { text: "Inte hjälpt till med inplockning av material", amount: 20 },
  { text: "Glömt att swisha för böter (+10 kr per missad)", amount: 10 },
  { text: "Bakfull på match", amount: 30 },
  { text: "Mobil under träning", amount: 20 },
  { text: "Mobil under samling", amount: 20 },
  { text: "Mobil under match", amount: 20 }
];

function sortByFirstLastName(aName, bName) {
  const [aFirst, ...aLast] = aName.toLowerCase().split(" ");
  const [bFirst, ...bLast] = bName.toLowerCase().split(" ");

  if (aFirst !== bFirst) {
    return aFirst.localeCompare(bFirst, "sv");
  }

  return aLast.join(" ").localeCompare(bLast.join(" "), "sv");
}

/* ======================
   INIT PLAYERS (REALTIME)
====================== */
onSnapshot(playersRef, (snapshot) => {
  players = {};
  snapshot.forEach((d) => {
    players[d.id] = d.data().name;
  });

  renderTotals();
});

/* ======================
   SEARCH + SELECT PLAYER (FINAL)
====================== */
playerSearch.addEventListener("input", (e) => {
  const search = e.target.value.trim().toLowerCase();
  playerResults.innerHTML = "";
  selectedPlayerId = null;

  if (!search) return;

  Object.entries(players)
    .filter(([_, name]) => name.toLowerCase().startsWith(search))
    .sort((a, b) => sortByFirstLastName(a[1], b[1]))
    .forEach(([id, name]) => {
      const li = document.createElement("li");
      li.textContent = name;
      li.style.cursor = "pointer";

      li.addEventListener("mousedown", () => {
        // 👇 MOUSEDOWN istället för click (viktigt!)
        selectedPlayerId = id;
        playerSearch.value = name;
      });

      li.addEventListener("mousedown", () => {
        // 👇 MOUSEDOWN istället för click (viktigt!)
        selectedPlayerId = id;
        playerSearch.value = name;
        playerResults.innerHTML = "";
      });

      playerResults.appendChild(li);
    });
});

/* ======================
   REASON AUTOCOMPLETE (BÖTER)
====================== */
reasonInput.addEventListener("input", (e) => {
  const search = e.target.value.trim().toLowerCase();
  reasonResults.innerHTML = "";

  if (!search) return;

  finePresets
    .filter((item) => item.text.toLowerCase().includes(search))
    .forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.text} – ${item.amount} kr`;
      li.style.cursor = "pointer";

      li.addEventListener("mousedown", () => {
        reasonInput.value = item.text;
        amountInput.value = item.amount;
        reasonResults.innerHTML = "";
        amountInput.focus();
      });

      reasonResults.appendChild(li);
    });
});

/* ======================
   SEED TEAM
====================== */
const initialPlayers = [
  "Adam Marelius",
  "Ahmad Alastora",
  "Albin Strand",
  "André Zebastian Stävhammar",
  "Arvid Wilmert",
  "Axel Andersson",
  "Axel Henriksson",
  "Casper Lilja Kåberg",
  "Charlie Kling",
  "Daniel Rudestig",
  "Dante Hellström Engström",
  "Alexander Cancino",
  "Elias Persson",
  "Emil Franson",
  "Felix Dominique",
  "Fredrik Kling",
  "Hamza Rajoub",
  "Helge Henriksson",
  "Isak Utterström",
  "Jacob Ådén",
  "Jemil Kalo",
  "Johan Nauclér",
  "Jonathan Persson",
  "Jonny Helander",
  "Kim Kongo Borgebäck",
  "Kim Magnusson",
  "Ludvig Schouenke",
  "Max Johansson",
  "Musa Joma",
  "Ossian Leisjö",
  "Riad Sheikho",
  "Robin Herrstedt",
  "Robin Marelius",
  "Simon Augustson",
  "Thomas Blomdahl",
  "Thomas Karlsson Frösemo",
  "Tobias Ermin",
  "Tobias Magnusson",
  "Viktor Jonsson",
  "Wille Kling",
  "William Axelsson"
];

/* ======================
   FINES (REALTIME)
====================== */
onSnapshot(finesRef, (snapshot) => {
  fines = [];
  snapshot.forEach((d) => fines.push({ id: d.id, ...d.data() }));
  renderTotals();
});

/* ======================
   ADD FINE
====================== */
fineForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedPlayerId) {
    alert("Välj spelare");
    return;
  }

  await addDoc(finesRef, {
    playerId: selectedPlayerId,
    playerName: players[selectedPlayerId],
    amount: Number(amountInput.value),
    reason: reasonInput.value,
    paid: false,
    createdAt: serverTimestamp()
  });

  reasonResults.innerHTML = "";

  amountInput.value = "";
  reasonInput.value = "";
  amountInput.focus();
});

/* ======================
   TOTALS
====================== */
function renderTotals() {
  totalsList.innerHTML = "";

 // 🏦 TOTAL LAGKASSA (alla böter, betalda + obetalda)
// 🏦 Lagkassa = ENDAST betalda böter
const totalPot = fines
  .filter((f) => f.paid)
  .reduce((sum, f) => sum + f.amount, 0);

teamPot.textContent = `${totalPot} kr`;

  const totals = {};

  // summera obetalda böter
  fines.forEach((f) => {
    if (!f.paid) {
      totals[f.playerId] = (totals[f.playerId] || 0) + f.amount;
    }
  });

  Object.entries(totals)
    .filter(([_, sum]) => sum > 0) // 👈 endast aktiva böter
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // högst skuld först
      return sortByFirstLastName(players[a[0]], players[b[0]]);
    })
    .forEach(([playerId, sum]) => {
      totalsList.innerHTML += `
        <li>
          <strong class="player-link" data-player="${playerId}">
            ${players[playerId]}
          </strong>
          – ${sum} kr
        </li>
      `;
    });

  // Om ingen har böter
  if (!totalsList.innerHTML) {
    totalsList.innerHTML = `<li><em>Inga aktiva böter 🎉</em></li>`;
  }
  /* ======================
   TOP 3 – MEST BÖTER (TOTALT)
====================== */
topThreeList.innerHTML = "";

const totalsAll = {};

// summera ALLA böter (betalda + obetalda)
fines.forEach((f) => {
  if (!players[f.playerId]) return;
  totalsAll[f.playerId] = (totalsAll[f.playerId] || 0) + f.amount;
});

const topThree = Object.entries(totalsAll)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3);

topThree.forEach(([playerId, sum], index) => {
  const medal = ["🥇", "🥈", "🥉"][index];

  topThreeList.innerHTML += `
    <li>
      ${medal} <strong>${players[playerId]}</strong> – ${sum} kr
    </li>
  `;
});

if (!topThree.length) {
  topThreeList.innerHTML = `<li><em>Inga böter ännu</em></li>`;
}
}

/* ======================
   HISTORY
====================== */
totalsList.addEventListener("click", (e) => {
  if (!e.target.classList.contains("player-link")) return;

  const playerId = e.target.dataset.player;
  historyTitle.textContent = `📜 Historik – ${players[playerId]}`;
  historyList.innerHTML = "";

  fines
    .filter((f) => f.playerId === playerId)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .forEach((f) => {
historyList.innerHTML += `
  <li style="display: flex; justify-content: space-between; align-items: center;">
    <label style="flex-grow: 1; cursor: pointer;">
      <input
        type="checkbox"
        data-id="${f.id}"
        ${f.paid ? "checked" : ""}
      />
      <span class="${f.paid ? "paid" : ""}">
        ${f.amount} kr – ${f.reason}
      </span>
    </label>
    <button class="delete-btn" data-id="${f.id}" style="width: auto; padding: 6px 10px; background: #ef4444; color: white; border-radius: 8px; margin-left: 10px; font-size: 0.9rem;">
      🗑️
    </button>
  </li>
`;
    });

  historySection.style.display = "block";
});

/* ======================
   TOGGLE PAID
====================== */
historyList.addEventListener("change", async (e) => {
  if (e.target.type === "checkbox") {
    await updateDoc(doc(db, "fines", e.target.dataset.id), {
      paid: e.target.checked
    });
  }
});

/* ======================
   DELETE BOT
====================== */
historyList.addEventListener("click", async (e) => {
  if (e.target.closest(".delete-btn")) {
    const btn = e.target.closest(".delete-btn");
    const fineId = btn.dataset.id;
    
    const confirmDelete = confirm("Är du säker på att du vill radera denna bot helt?");
    
    if (confirmDelete) {
      await deleteDoc(doc(db, "fines", fineId));
    }
  }
});

closeHistory.addEventListener("click", () => {
  historySection.style.display = "none";
});

/* ======================
   ENTER = SUBMIT BOT
====================== */
[fineForm, amountInput, reasonInput].forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fineForm.requestSubmit();
    }
  });
});

console.log("🔥 Bötessystem – Safari-safe, komplett");