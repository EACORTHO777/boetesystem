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

const withdrawalForm = document.getElementById("withdrawalForm");
const withdrawalAmount = document.getElementById("withdrawalAmount");
const withdrawalReason = document.getElementById("withdrawalReason");
const withdrawalsList = document.getElementById("withdrawalsList");
const toggleWithdrawals = document.getElementById("toggleWithdrawals");
const withdrawalChevron = document.getElementById("withdrawalChevron");

/* ======================
   FIRESTORE
====================== */
const playersRef = collection(db, "players");
const finesRef = collection(db, "fines");
const withdrawalsRef = collection(db, "withdrawals");

/* ======================
   STATE
====================== */
let players = {};          // { playerId: name }
let fines = [];
let withdrawals = [];
let selectedPlayerId = null;
let openDropdownId = null;
let withdrawalsOpen = false;
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
  "Mattias Engan",
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
/* ======================
   TOTALS & DROPDOWN
====================== */
function renderTotals() {
  totalsList.innerHTML = "";

  // 🏦 Lagkassa = betalda böter minus uttag
  const totalPaid = fines
    .filter((f) => f.paid)
    .reduce((sum, f) => sum + f.amount, 0);

  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalPot = totalPaid - totalWithdrawn;

  teamPot.textContent = `${totalPot} kr`;
  teamPot.style.color = totalPot < 0 ? "#dc2626" : "#16a34a";

  const totals = {};

  // summera obetalda böter
  fines.forEach((f) => {
    if (!f.paid) {
      totals[f.playerId] = (totals[f.playerId] || 0) + f.amount;
    }
  });

  Object.entries(totals)
    .filter(([_, sum]) => sum > 0) // endast aktiva böter
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return sortByFirstLastName(players[a[0]], players[b[0]]);
    })
    .forEach(([playerId, sum]) => {

// Bygg historik-listan för dropdown (Nyaste högst upp)
      const playerFines = fines
        .filter(f => f.playerId === playerId)
        .sort((a, b) => {
          // Om tiden saknas (precis nyskapad bot), låtsas att den lades till exakt NU
          const timeA = a.createdAt?.seconds || Date.now() / 1000;
          const timeB = b.createdAt?.seconds || Date.now() / 1000;
          return timeB - timeA; 
        });

      let historyHtml = `<ul style="list-style:none; padding:0; margin:0;">`;
      playerFines.forEach(f => {
        
        // 🕒 Omvandla Firebase-tid till snygg svensk tid
        let dateString = "Laddar tid...";
        if (f.createdAt) {
          const dateObj = new Date(f.createdAt.seconds * 1000);
          dateString = dateObj.toLocaleString('sv-SE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        historyHtml += `
          <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0; border-top: none;">
            <label style="flex-grow: 1; cursor: pointer; display: flex; align-items: flex-start; font-size: 0.95rem;">
              <input type="checkbox" class="toggle-paid" data-id="${f.id}" ${f.paid ? "checked" : ""} style="margin: 4px 10px 0 0; width: 18px; height: 18px; cursor: pointer; flex-shrink: 0;" />
              
              <div style="display: flex; flex-direction: column; ${f.paid ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                <span>${f.amount} kr – ${f.reason}</span>
                <span style="font-size: 0.75rem; color: #64748b; margin-top: 3px;">
                  🗓️ ${dateString}
                </span>
              </div>
            </label>
            
            <button class="delete-btn" data-id="${f.id}" style="width: auto; padding: 6px 10px; background: #ef4444; color: white; border-radius: 8px; margin-left: 10px; font-size: 0.9rem; flex-shrink: 0;">
              🗑️
            </button>
          </li>
        `;
      });
      historyHtml += `</ul>`;
      
      // Kolla om denna spelare har sin dropdown öppen just nu
      const isOpen = openDropdownId === playerId;

      // Rita ut raden för spelaren + den gömda/öppna dropdownen
      totalsList.innerHTML += `
        <li style="display: flex; flex-direction: column; align-items: stretch; padding: 12px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <strong class="player-link" data-player="${playerId}" style="cursor: pointer; display: flex; align-items: center; gap: 6px; color: #2563eb; user-select: none; font-size: 1.05rem;">
              ${players[playerId]} <span style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">${isOpen ? "▴" : "▾"}</span>
            </strong>
            <span style="font-size: 1.05rem;">${sum} kr</span>
          </div>

          <div style="display: ${isOpen ? "block" : "none"}; margin-top: 12px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
            ${historyHtml}
          </div>
        </li>
      `;
    });

  if (!totalsList.innerHTML) {
    totalsList.innerHTML = `<li style="padding: 10px 0;"><em>Inga aktiva böter 🎉</em></li>`;
  }

  /* ======================
     TOP 3 – MEST BÖTER (TOTALT)
  ====================== */
  topThreeList.innerHTML = "";
  const totalsAll = {};
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
      <li style="padding: 10px 0; font-size: 1.05rem;">
        ${medal} <strong>${players[playerId]}</strong> – ${sum} kr
      </li>
    `;
  });

  if (!topThree.length) {
    topThreeList.innerHTML = `<li style="padding: 10px 0;"><em>Inga böter ännu</em></li>`;
  }
}

/* ======================
   KLICKA I LISTAN (ÖPPNA DROPDOWN, BETALA, RADERA)
====================== */
totalsList.addEventListener("click", async (e) => {
  // 1. Klicka på spelarnamn -> Öppna/stäng dropdown
  const playerLink = e.target.closest(".player-link");
  if (playerLink) {
    const playerId = playerLink.dataset.player;
    openDropdownId = openDropdownId === playerId ? null : playerId;
    renderTotals();
    return;
  }

  // 2. Klicka på papperskorgen -> Radera bot
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    const fineId = deleteBtn.dataset.id;
    if (confirm("Är du säker på att du vill radera denna bot helt?")) {
      await deleteDoc(doc(db, "fines", fineId));
    }
    return;
  }
});

// 3. Kryssa i betald-rutan
totalsList.addEventListener("change", async (e) => {
  if (e.target.classList.contains("toggle-paid")) {
    await updateDoc(doc(db, "fines", e.target.dataset.id), {
      paid: e.target.checked
    });
  }
});

/* ======================
   WITHDRAWALS (REALTIME)
====================== */
onSnapshot(withdrawalsRef, (snapshot) => {
  withdrawals = [];
  snapshot.forEach((d) => withdrawals.push({ id: d.id, ...d.data() }));
  renderTotals();
  renderWithdrawals();
});

/* ======================
   ADD WITHDRAWAL
====================== */
withdrawalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = Number(withdrawalAmount.value);
  const reason = withdrawalReason.value.trim();

  if (!amount || !reason) return;

  await addDoc(withdrawalsRef, {
    amount,
    reason,
    createdAt: serverTimestamp()
  });

  withdrawalAmount.value = "";
  withdrawalReason.value = "";
});

/* ======================
   RENDER WITHDRAWALS LIST
====================== */
function renderWithdrawals() {
  withdrawalsList.innerHTML = "";

  if (!withdrawals.length) {
    withdrawalsList.innerHTML = `<li style="padding: 10px 0; color: #64748b; font-size: 0.95rem;"><em>Inga uttag ännu</em></li>`;
    return;
  }

  const sorted = [...withdrawals].sort((a, b) => {
    const tA = a.createdAt?.seconds || 0;
    const tB = b.createdAt?.seconds || 0;
    return tB - tA;
  });

  sorted.forEach((w) => {
    let dateString = "Laddar tid...";
    if (w.createdAt) {
      const d = new Date(w.createdAt.seconds * 1000);
      dateString = d.toLocaleString("sv-SE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    const li = document.createElement("li");
    li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #e2e8f0;";
    li.innerHTML = `
      <div style="display:flex; flex-direction:column; font-size:0.95rem;">
        <span style="font-weight:600; color:#dc2626;">−${w.amount} kr</span>
        <span style="margin-top:2px;">${w.reason}</span>
        <span style="font-size:0.75rem; color:#64748b; margin-top:3px;">🗓️ ${dateString}</span>
      </div>
      <button class="delete-withdrawal-btn" data-id="${w.id}" style="width:auto; padding:6px 10px; background:#ef4444; color:white; border-radius:8px; margin-left:10px; font-size:0.9rem; flex-shrink:0;">🗑️</button>
    `;
    withdrawalsList.appendChild(li);
  });
}

/* ======================
   TOGGLE WITHDRAWALS LIST
====================== */
toggleWithdrawals.addEventListener("click", () => {
  withdrawalsOpen = !withdrawalsOpen;
  withdrawalsList.style.display = withdrawalsOpen ? "block" : "none";
  withdrawalChevron.textContent = withdrawalsOpen ? "▴" : "▾";
});

/* ======================
   DELETE WITHDRAWAL
====================== */
withdrawalsList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-withdrawal-btn");
  if (btn) {
    if (confirm("Är du säker på att du vill radera detta uttag?")) {
      await deleteDoc(doc(db, "withdrawals", btn.dataset.id));
    }
  }
});
  
