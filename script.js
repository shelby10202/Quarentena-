// 🔥 IMPORTS FIREBASE (MODULAR)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 SUA CONFIG (já coloquei)
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

// ABAS GLOBAL
window.showTab = function(tab){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById(tab).classList.add("active");

  if(tab==="dashboard"){
    setTimeout(()=>gerarGrafico(),100);
  }
};

// 🔥 CARREGAR DADOS
async function carregarDados(){
  const querySnapshot = await getDocs(collection(db, "pecas"));

  data = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  renderTable();
  updateDashboard();
}

// ADD
addBtn.onclick = async ()=>{
  await addDoc(collection(db, "pecas"), {
    prefixo:newPrefixo.value,
    protocolo:newProtocolo.value,
    setor:newSetor.value,
    engenharia:newEngenharia.value,
    status:newStatus.value,
    data:new Date().toLocaleDateString('pt-BR')
  });

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
        <td><button onclick="deleteItem('${item.id}')">X</button></td>
      </tr>
    `;
  });
}

// DELETE GLOBAL
window.deleteItem = async function(id){
  await deleteDoc(doc(db, "pecas", id));
  carregarDados();
};

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
    options:{
      maintainAspectRatio:false
    }
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
    options:{
      maintainAspectRatio:false
    }
  });
}

// INIT
carregarDados();