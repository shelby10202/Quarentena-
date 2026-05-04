// 🔥 IMPORTS FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAZ6gOO32DstTL9LPSgtYYa3Jptq_8QNrs",
  authDomain: "quarentena-39458.firebaseapp.com",
  projectId: "quarentena-39458",
  storageBucket: "quarentena-39458.firebasestorage.app",
  messagingSenderId: "200343768046",
  appId: "1:200343768046:web:86905492b62c2fa7049cff"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ================= ELEMENTOS =================
const loginEmail = document.getElementById("loginEmail");
const loginSenha = document.getElementById("loginSenha");
const form = document.getElementById("loginForm");
const signupBtn = document.getElementById("signupBtn");

const table_body = document.getElementById("table_body");
const addBtn = document.getElementById("addBtn");

const newPrefixo = document.getElementById("newPrefixo");
const newProtocolo = document.getElementById("newProtocolo");
const newSetor = document.getElementById("newSetor");
const newEngenharia = document.getElementById("newEngenharia");
const newStatus = document.getElementById("newStatus");

const count_espera = document.getElementById("count_espera");
const count_scrap = document.getElementById("count_scrap");
const count_entregue = document.getElementById("count_entregue");
const count_outros = document.getElementById("count_outros");

const userEmail = document.getElementById("userEmail");

let chart;
let chartPizza;

// ================= DADOS =================
let data = [];
let historicoGlobal = [];

// ================= LOGIN =================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await signInWithEmailAndPassword(
      auth,
      loginEmail.value,
      loginSenha.value
    );

  } catch (e) {
    console.error("ERRO LOGIN:", e);

    alert(e.message); // 🔥 MOSTRA O ERRO REAL
  }
});

signupBtn.onclick = async () => {
  try {
    await createUserWithEmailAndPassword(auth, loginEmail.value, loginSenha.value);
    alert("Usuário criado!");
  } catch (e) {
    alert(e.message);
  }
};

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {

  const login = document.getElementById("login-screen");
  const loader = document.getElementById("loader-screen");

  if (user) {
    login.style.display = "none";
    loader.style.display = "flex";

    if (userEmail) userEmail.textContent = user.email;

    await carregarDados();

    loader.style.display = "none";
  } else {
    login.style.display = "flex";
    loader.style.display = "none";

    if (userEmail) userEmail.textContent = "";
  }
});

// ================= CARREGAR =================
async function carregarDados(){
  try {
    const snap = await getDocs(collection(db, "pecas"));

    data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    await carregarHistorico();

    renderTable();
    updateDashboard();

  } catch (e) {
    console.error(e);
    alert("Erro ao carregar dados");
  }
}

// ================= HISTÓRICO =================
async function carregarHistorico(){
  try {
    const snap = await getDocs(collection(db, "historico"));
    historicoGlobal = snap.docs.map(d => d.data());
  } catch (e) {
    console.warn("Erro histórico:", e);
    historicoGlobal = [];
  }
}

function renderHistorico(){

  const timeline = document.getElementById("timeline");
  if (!timeline) return;

  const filtroPrefixo = (document.getElementById("filtroPrefixo")?.value || "").toLowerCase();
  const filtroUsuario = (document.getElementById("filtroUsuario")?.value || "").toLowerCase();

  timeline.innerHTML = "";

  historicoGlobal
    .filter(h => {
      const prefixo = (h.prefixo || "").toLowerCase();
      const usuario = (h.usuario || "").toLowerCase();

      return (
        (!filtroPrefixo || prefixo.includes(filtroPrefixo)) &&
        (!filtroUsuario || usuario.includes(filtroUsuario))
      );
    })
    .sort((a,b)=> new Date(b.data) - new Date(a.data))
    .forEach(h => {

      timeline.innerHTML += `
  <div class="timeline-item">

    <div class="timeline-dot"></div>

    <div class="timeline-content">

      <div class="timeline-title">
        <span>${h.prefixo}</span>
        <span class="timeline-arrow">→</span>
        <span class="badge">${h.acao}</span>
      </div>

      <div class="timeline-meta">
        ${h.data} • ${h.usuario}
      </div>

    </div>
  </div>
`;
    });
}

// 🔥 filtros funcionando
document.getElementById("filtroPrefixo")?.addEventListener("input", renderHistorico);
document.getElementById("filtroUsuario")?.addEventListener("input", renderHistorico);

// ================= ADD =================
addBtn.onclick = async () => {
  try {

    if (!newPrefixo.value || !newProtocolo.value || !newSetor.value || !newEngenharia.value || !newStatus.value){
      alert("Preencha tudo");
      return;
    }

    const docRef = await addDoc(collection(db, "pecas"), {
      prefixo: newPrefixo.value.toUpperCase(),
      protocolo: newProtocolo.value.toUpperCase(),
      setor: newSetor.value,
      engenharia: newEngenharia.value,
      status: newStatus.value,
      data: new Date().toLocaleDateString('pt-BR')
    });

    await addDoc(collection(db, "historico"), {
      pecaId: docRef.id,
      prefixo: newPrefixo.value.toUpperCase(),
      acao: "criado",
      usuario: auth.currentUser?.email || "desconhecido",
      data: new Date().toLocaleString("pt-BR")
    });

    limparCampos();
    validarCampos();
    carregarDados();

  } catch (e) {
    console.error("Erro ao adicionar:", e);
    alert("Erro ao adicionar");
  }
};

// ================= EDIT =================
window.editarItem = async function(id){
  try {
    const item = data.find(d => d.id === id);
    if(!item) return;

    const novoStatus = prompt("Novo status:", item.status);
    if(!novoStatus) return;

    await updateDoc(doc(db, "pecas", id), { status: novoStatus });

    await addDoc(collection(db, "historico"), {
      pecaId: id,
      prefixo: item.prefixo,
      acao: "editado",
      usuario: auth.currentUser?.email || "desconhecido",
      data: new Date().toLocaleString("pt-BR")
    });

    carregarDados();

  } catch (e) {
    console.error(e);
    alert("Erro ao editar");
  }
};

// ================= DELETE =================
window.deleteItem = async function(id){
  try {
    const item = data.find(d => d.id === id);

    await deleteDoc(doc(db, "pecas", id));

    await addDoc(collection(db, "historico"), {
      pecaId: id,
      prefixo: item?.prefixo || "",
      acao: "excluido",
      usuario: auth.currentUser?.email || "desconhecido",
      data: new Date().toLocaleString("pt-BR")
    });

    carregarDados();

  } catch (e) {
    console.error(e);
    alert("Erro ao excluir");
  }
};

// ================= TABLE =================
function renderTable(){
  table_body.innerHTML = "";

  data.forEach(item=>{
    table_body.innerHTML += `
      <tr>
        <td>${item.prefixo}</td>
        <td>${item.protocolo}</td>
        <td>${item.setor}</td>
        <td>${item.engenharia}</td>
        <td>${item.status}</td>
        <td>${item.data}</td>
        <td>
          <button onclick="editarItem('${item.id}')">✏️</button>
          <button onclick="deleteItem('${item.id}')">🗑️</button>
        </td>
      </tr>
    `;
  });
}

// ================= DASHBOARD =================
function updateDashboard(){
  count_espera.innerText = data.filter(d=>d.engenharia==="espera").length;
  count_scrap.innerText = data.filter(d=>d.status==="Descaracterização").length;
  count_entregue.innerText = data.filter(d=>d.status==="entregue").length;
  count_outros.innerText = data.length;
}

// ================= GRÁFICOS =================
function gerarGrafico(){

  if(chart) chart.destroy();
  if(chartPizza) chartPizza.destroy();

  chart = new Chart(document.getElementById("grafico"),{
    type:"line",
    data:{
      labels:["Jan","Fev","Mar"],
      datasets:[{ data:[2,4,6] }]
    },
    options:{ maintainAspectRatio:false }
  });

  const statusCount = {};
  data.forEach(d=>{
    if(d.status){
      statusCount[d.status]=(statusCount[d.status]||0)+1;
    }
  });

  chartPizza = new Chart(document.getElementById("graficoPizza"),{
    type:"pie",
    data:{
      labels:Object.keys(statusCount),
      datasets:[{ data:Object.values(statusCount) }]
    },
    options:{ maintainAspectRatio:false }
  });
}

// ================= ABAS =================
window.showTab = function(tab){

  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  document.getElementById(tab).classList.add("active");

  if(tab === "dashboard") gerarGrafico();
  if(tab === "historico") renderHistorico();
};

// ================= VALIDAÇÃO =================
function validarCampos(){
  addBtn.disabled = !(
    newPrefixo.value.trim() &&
    newProtocolo.value.trim() &&
    newSetor.value &&
    newEngenharia.value &&
    newStatus.value
  );
}

[newPrefixo, newProtocolo, newSetor, newEngenharia, newStatus]
.forEach(input => input.addEventListener("input", validarCampos));

// ================= HELPERS =================
function limparCampos(){
  newPrefixo.value = "";
  newProtocolo.value = "";
  newSetor.value = "";
  newEngenharia.value = "";
  newStatus.value = "";
}