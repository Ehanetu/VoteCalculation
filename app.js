// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

function toInt(v){
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function calcRangeCount(from, to){
  from = toInt(from); to = toInt(to);
  if(from <= 0 || to <= 0) return 0;
  if(to < from) return 0;
  return (to - from + 1);
}

function renderAlert(type, msg){
  const div = document.createElement("div");
  div.className = `alert ${type}`;
  div.textContent = msg;
  return div;
}

// ---------- candidates dynamic table ----------
let candidates = [
  { name: "নাজমুল মোস্তফা আমিন", symbol: "ধানের শীষ", votes: 0 },
  { name: "শাহাজাহান চৌধুরী", symbol: "দাঁড়িপাল্লা", votes: 0 },
  { name: "ওমক মিয়া", symbol: "চাঁদমামা", votes: 0 }
];

function buildCandidatesTable(){
  const body = $("candidatesBody");
  body.innerHTML = "";

  candidates.forEach((c, idx) => {
    const tr = document.createElement("tr");

    const td1 = document.createElement("td");
    td1.textContent = String(idx+1);

    const td2 = document.createElement("td");
    const name = document.createElement("input");
    name.value = c.name;
    name.addEventListener("input", () => { candidates[idx].name = name.value; });
    td2.appendChild(name);

    const td3 = document.createElement("td");
    const sym = document.createElement("input");
    sym.value = c.symbol;
    sym.addEventListener("input", () => { candidates[idx].symbol = sym.value; });
    td3.appendChild(sym);

    const td4 = document.createElement("td");
    const votes = document.createElement("input");
    votes.type = "number";
    votes.min = "0";
    votes.value = c.votes;
    votes.addEventListener("input", () => {
      candidates[idx].votes = toInt(votes.value);
      recalcAll();
    });
    td4.appendChild(votes);

    const td5 = document.createElement("td");
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "মুছুন";
    del.addEventListener("click", () => {
      candidates.splice(idx, 1);
      buildCandidatesTable();
      recalcAll();
    });
    td5.appendChild(del);

    tr.append(td1, td2, td3, td4, td5);
    body.appendChild(tr);
  });
}
// ---------- unused ranges (multiple) ----------
let unusedRanges = [
  // default one empty row
  { from: 0, to: 0 }
];

function buildUnusedRanges(){
  const body = $("unusedRangesBody");
  body.innerHTML = "";

  unusedRanges.forEach((r, idx) => {
    const tr = document.createElement("tr");

    const td1 = document.createElement("td");
    td1.textContent = String(idx + 1);

    const td2 = document.createElement("td");
    const inpFrom = document.createElement("input");
    inpFrom.type = "number";
    inpFrom.min = "0";
    inpFrom.value = r.from;
    inpFrom.addEventListener("input", () => {
      unusedRanges[idx].from = toInt(inpFrom.value);
      recalcAll();
    });
    td2.appendChild(inpFrom);

    const td3 = document.createElement("td");
    const inpTo = document.createElement("input");
    inpTo.type = "number";
    inpTo.min = "0";
    inpTo.value = r.to;
    inpTo.addEventListener("input", () => {
      unusedRanges[idx].to = toInt(inpTo.value);
      recalcAll();
    });
    td3.appendChild(inpTo);

    const td4 = document.createElement("td");
    const count = calcRangeCount(r.from, r.to);
    td4.textContent = count.toLocaleString("bn-BD");

    const td5 = document.createElement("td");
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "মুছুন";
    del.addEventListener("click", () => {
      unusedRanges.splice(idx, 1);
      if(unusedRanges.length === 0) unusedRanges.push({from:0,to:0});
      buildUnusedRanges();
      recalcAll();
    });
    td5.appendChild(del);

    tr.append(td1, td2, td3, td4, td5);
    body.appendChild(tr);
  });
}

function totalUnusedFromRanges(){
  // Sum of all range counts
  let sum = 0;
  for(const r of unusedRanges){
    sum += calcRangeCount(r.from, r.to);
  }
  $("totalUnusedText").textContent = sum.toLocaleString("bn-BD");
  return sum;
}


// ---------- core logic ----------
function recalcForm16(){
  const totalValid = candidates.reduce((s,c)=> s + toInt(c.votes), 0);
  $("totalValid").textContent = totalValid.toLocaleString("bn-BD");

  const rejected = toInt($("rejectedVotes").value);
  const totalCast = totalValid + rejected;

  $("totalCast").textContent = totalCast.toLocaleString("bn-BD");

  // Form-17 auto follow: countedFromBox = totalCast
  // (User can still edit if needed, but default should follow Form-16)
  if(!$("countedFromBox").dataset.userEdited){
    $("countedFromBox").value = String(totalCast);
  }
  return { totalValid, rejected, totalCast };
}

function recalcForm17(){
  // Section 1 total received
  const received = calcRangeCount($("serialFrom").value, $("serialTo").value);
  $("totalReceived").textContent = received.toLocaleString("bn-BD");

  // Section 2 total used
  const counted = toInt($("countedFromBox").value);
  const tender = toInt($("tenderBallots").value);
  const challenged = toInt($("challengedBallots").value);
  const lost = toInt($("lostBallots").value);
  const spoiled = toInt($("spoiledBallots").value);

  const used = counted + tender + challenged + lost + spoiled;
  $("totalUsed").textContent = used.toLocaleString("bn-BD");

  // Section 3 unused: if user gives serial range, compute; else keep manual totalUnused
  // Section 3 unused: sum of multiple ranges
const unused = totalUnusedFromRanges();

  // Match check
  const sum = used + unused;
  const diff = sum - received;

  $("diffValue").textContent = diff.toLocaleString("bn-BD");

  const matchEl = $("matchStatus");
  const alerts = $("alerts");
  alerts.innerHTML = "";

  if(received === 0){
    matchEl.textContent = "সিরিয়াল দিন";
    alerts.appendChild(renderAlert("warn","ধারা–১: ব্যালট সিরিয়াল (হইতে-পর্যন্ত) ঠিকভাবে দিন।"));
  } else if(diff === 0){
    matchEl.textContent = "✅ মিলেছে";
    matchEl.style.color = "var(--ok)";
    alerts.appendChild(renderAlert("ok","ধারা–৪ মিল ঠিক আছে: ব্যবহৃত + অব্যবহৃত = মোট প্রাপ্ত ব্যালট।"));
  } else {
    matchEl.textContent = "❌ মিলেনি";
    matchEl.style.color = "var(--bad)";
    alerts.appendChild(renderAlert("bad",`মিলেনি: (ব্যবহৃত + অব্যবহৃত) এবং মোট প্রাপ্ত ব্যালটের পার্থক্য = ${diff}.`));
  }

  // Cross-check: Form-16 cast vs countedFromBox
  const f16Cast = toInt($("totalCast").textContent.replace(/[^\d]/g,''));
  // If bn-BD digits appear, above replace may fail; safer derive from recalcForm16 return in recalcAll
  return { received, used, unused, sum, diff };
}

function recalcAll(){
  const f16 = recalcForm16();
  // always keep countedFromBox following unless user edited
  // now do form17 and cross-check with form16Cast
  recalcForm17();

  // Additional check message
  const alerts = $("alerts");
  const counted = toInt($("countedFromBox").value);
  if(counted !== f16.totalCast){
    alerts.appendChild(renderAlert(
      "warn",
      `ফরম–১৬ মোট প্রদত্ত ভোট (${f16.totalCast}) এবং ফরম–১৭ ব্যালট বাক্স হতে গণনাকৃত (${counted}) এক নয়। প্রয়োজন হলে মিলিয়ে ঠিক করুন।`
    ));
  } else {
    alerts.appendChild(renderAlert(
      "ok",
      `ফরম–১৬ মোট প্রদত্ত ভোট (${f16.totalCast}) = ফরম–১৭ ব্যালট বাক্স হতে গণনাকৃত (${counted}) ✅`
    ));
  }

  // Warn if lost ballots exist
  const lost = toInt($("lostBallots").value);
  if(lost > 0){
    alerts.appendChild(renderAlert(
      "warn",
      `হারিয়ে যাওয়া ব্যালট ${lost} আছে—এটা সাধারণত রিপোর্ট/ব্যাখ্যা দরকার হয়।`
    ));
  }
}

// ---------- events ----------
$("addCandidateBtn").addEventListener("click", () => {
  candidates.push({ name:"", symbol:"", votes:0 });
  buildCandidatesTable();
  recalcAll();
});
$("addUnusedRangeBtn").addEventListener("click", () => {
  unusedRanges.push({ from: 0, to: 0 });
  buildUnusedRanges();
  recalcAll();
});

$("clearUnusedRangesBtn").addEventListener("click", () => {
  unusedRanges = [{ from: 0, to: 0 }];
  buildUnusedRanges();
  recalcAll();
});


$("resetBtn").addEventListener("click", () => {
  candidates = [
    { name: "নাজমুল মোস্তফা আমিন", symbol: "ধানের শীষ", votes: 0 },
    { name: "শাহাজাহান চৌধুরী", symbol: "দাঁড়িপাল্লা", votes: 0 },
    { name: "ওমক মিয়া", symbol: "চাঁদমামা", votes: 0 }
  ];
  $("rejectedVotes").value = "0";
  $("serialFrom").value = "0";
  $("serialTo").value = "0";
  $("countedFromBox").value = "0";
  $("countedFromBox").dataset.userEdited = "";
  $("tenderBallots").value = "0";
  $("challengedBallots").value = "0";
  $("lostBallots").value = "0";
  $("spoiledBallots").value = "0";
    unusedRanges = [{ from: 0, to: 0 }];
  buildUnusedRanges();
  buildCandidatesTable();
  recalcAll();
});

// mark countedFromBox as user-edited if manually changed
$("countedFromBox").addEventListener("input", () => {
  $("countedFromBox").dataset.userEdited = "1";
  recalcAll();
});

[
  "rejectedVotes","serialFrom","serialTo","tenderBallots","challengedBallots",
  "lostBallots","spoiledBallots"
].forEach(id => {
  $(id).addEventListener("input", recalcAll);
});

// init
buildCandidatesTable();
buildUnusedRanges();
recalcAll();
