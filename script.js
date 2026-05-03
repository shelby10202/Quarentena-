// 🔥 IMPORTS FIREBASE (MODULAR)
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
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAZ6gOO32DstTL9LPSgtYYa3Jptq_8QNrs",
  authDomain: "quarentena-39458.firebaseapp.com",
  projectId: "quarentena-39458",
  storageBucket: "quarentena-39458.firebasestorage.app",
  messagingSenderId: "200343768046",
  appId: "1:200343768046:web:86905492b62c2fa7049cff"
};

// INIT
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
signOut(auth);
const form = document.getElementById("loginForm");
const signupBtn = document.getElementById("signupBtn");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (err) {
    alert("Email ou senha inválidos");
  }
});
signupBtn.onclick = async () => {

  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    alert("Usuário criado!");
  } catch (err) {
    console.error(err);
    alert("Erro ao criar usuário");
  }
};
onAuthStateChanged(auth, async (user) => {

  const login = document.getElementById("login-screen");
  const loader = document.getElementById("loader-screen");

  if (user) {

    // 🔽 fade out login
    login.classList.add("hidden");

    setTimeout(async () => {

      login.style.display = "none";

      // 🔼 fade in loader
      loader.style.display = "flex";
      loader.classList.remove("hidden");

      const inicio = Date.now();

      await carregarDados();

      const tempo = Date.now() - inicio;
      const minimo = 2000;

      if (tempo < minimo) {
        await new Promise(r => setTimeout(r, minimo - tempo));
      }

      // 🔽 fade out loader
      loader.classList.add("hidden");

      setTimeout(() => {
        loader.style.display = "none";
      }, 400);

    }, 400);

  } else {
    login.style.display = "flex";
    login.classList.remove("hidden");
    loader.style.display = "none";
  }

});
// VARIÁVEIS
let data = [];
let chart;
let chartPizza;

// ELEMENTOS
const table_body = document.getElementById("table_body");
const addBtn = document.getElementById("addBtn");

// INPUTS
const newPrefixo = document.getElementById("newPrefixo");
const newProtocolo = document.getElementById("newProtocolo");
const newSetor = document.getElementById("newSetor");
const newEngenharia = document.getElementById("newEngenharia");
const newStatus = document.getElementById("newStatus");

// DASHBOARD
const count_espera = document.getElementById("count_espera");
const count_scrap = document.getElementById("count_scrap");
const count_entregue = document.getElementById("count_entregue");
const count_outros = document.getElementById("count_outros");

// REGEX (UMA VEZ SÓ)
const regexPrefixo = /^(PR|PS|PT)-[A-Z]{3}$|^(EB|FAB)-\d{4}$/;
const regexProtocolo = /^HBRQ-\d{3}$/;

// 🔥 CARREGAR DADOS
async function carregarDados(){
  const querySnapshot = await getDocs(collection(db, "pecas"));

  data = querySnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  renderTable();
  updateDashboard();
}

// ADD
addBtn.onclick = async () => {

  const prefixo = newPrefixo.value.trim().toUpperCase();
  const protocolo = newProtocolo.value.trim().toUpperCase();

  if (!prefixo || !protocolo || !newSetor.value || !newEngenharia.value || !newStatus.value){
    showAlert("Erro", "Preencha todos os campos", "error");
    return;
  }

  if (!regexPrefixo.test(prefixo)){
    showAlert("Erro", "Prefixo inválido", "error");
    return;
  }

  if (!regexProtocolo.test(protocolo)){
    showAlert("Erro", "Protocolo inválido", "error");
    return;
  }

  await addDoc(collection(db, "pecas"), {
    prefixo,
    protocolo,
    setor: newSetor.value,
    engenharia: newEngenharia.value,
    status: newStatus.value,
    data: new Date().toLocaleDateString('pt-BR')
  });

  showAlert("Sucesso", "Aeronave adicionada!");

  newPrefixo.value = "";
  newProtocolo.value = "";
  newSetor.value = "";
  newEngenharia.value = "";
  newStatus.value = "";

  carregarDados();
};

// EDITAR
window.editarItem = async function(id){

  const item = data.find(d => d.id === id);
  if(!item) return;

  const novoPrefixo = prompt("Editar Prefixo:", item.prefixo);
  if(!novoPrefixo) return;

  const novoStatus = prompt("Editar Status:", item.status);
  if(!novoStatus) return;

  await updateDoc(doc(db, "pecas", id), {
    prefixo: novoPrefixo,
    status: novoStatus
  });

  showAlert("Sucesso", "Aeronave atualizada");
  carregarDados();
};

// DELETE
window.deleteItem = async function(id){
  await deleteDoc(doc(db, "pecas", id));
  carregarDados();
};

// TABLE
function renderTable(){
  table_body.innerHTML="";

  data.forEach(item=>{
    table_body.innerHTML+=`
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

// DASHBOARD
function updateDashboard(){
  count_espera.innerText = data.filter(d=>d.engenharia==="espera").length;
  count_scrap.innerText = data.filter(d=>d.status==="scrap").length;
  count_entregue.innerText = data.filter(d=>d.status==="entregue").length;
  count_outros.innerText = data.filter(d=>!["scrap","entregue"].includes(d.status)).length;
}

// GRÁFICOS
function gerarGrafico(){

  if(chart) chart.destroy();
  if(chartPizza) chartPizza.destroy();

  chart = new Chart(document.getElementById("grafico"),{
    type:"line",
    data:{
      labels:["Jan","Fev","Mar"],
      datasets:[{
        data:[2,4,6],
        borderColor:"#00c853"
      }]
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
      datasets:[{
        data:Object.values(statusCount),
        backgroundColor:["green","red","orange","#007aff","#555"]
      }]
    },
    options:{ maintainAspectRatio:false }
  });
}

// LOADER + ABAS
window.showTab = function(tab){

  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  document.getElementById(tab)
    .classList.add("active");

  if(tab === "dashboard"){
    gerarGrafico();
  }
};

// VALIDAÇÃO BOTÃO
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

// UPPERCASE
newPrefixo.addEventListener("input", () => {
  newPrefixo.value = newPrefixo.value.toUpperCase();
});

newProtocolo.addEventListener("input", () => {
  newProtocolo.value = newProtocolo.value.toUpperCase();
});

// ALERT CLEAN
function showAlert(title, msg, type = "success") {

  const container = document.getElementById("alert-container");

  const alert = document.createElement("div");
  alert.className = `alert-clean ${type}`;

  alert.innerHTML = `
    <div>
      <div style="font-weight:600">${title}</div>
      <div style="font-size:11px;color:#aaa">${msg}</div>
    </div>
    <span class="alert-close">✕</span>
  `;

  container.appendChild(alert);

  // anima entrada
  setTimeout(() => alert.classList.add("show"), 10);

  // fechar manual
  alert.querySelector(".alert-close").onclick = () => removeAlert(alert);

  // auto remover
  setTimeout(() => removeAlert(alert), 3000);
}

function removeAlert(alert) {
  alert.classList.remove("show");
  alert.classList.add("hide");

  setTimeout(() => {
    alert.remove();
  }, 250);
}
  el.querySelector(".alert-close").onclick = () => fechar();

  function fechar(){
    el.classList.remove("show");
    el.classList.add("hide");
    setTimeout(() => el.remove(), 250);
  }

  setTimeout(fechar, 2500);


// INIT
carregarDados();