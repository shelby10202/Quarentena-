// 🔥 FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 CONFIG
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

// 🔥 VARIÁVEIS
let data = [];
let chart;
let chartPizza;

// LOADER
window.onload = () => {
  const loader = document.getElementById("loader-container");
  setTimeout(()=>{
    loader.classList.add("hide");
    setTimeout(()=>loader.style.display="none",400);
  },1000);
};

// ABAS
window.showTab = function(tab){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById(tab).classList.add("active");

  if(tab==="dashboard") gerarGrafico();
};

// 🔥 CARREGAR DO FIREBASE
async function carregarDados(){
  const snapshot = await getDocs(collection(db,"pecas"));

  data = snapshot.docs.map(doc=>({
    id: doc.id,
    ...doc.data()
  }));

  renderTable();
  updateDashboard();
}

// ADD
addBtn.onclick = async ()=>{

  const prefixo=newPrefixo.value.toUpperCase();
  const protocolo=newProtocolo.value.toUpperCase();

  const r1=/^(PR|PS|PT)-[A-Z]{3}$|^(FAB|EB)-[0-9]{4}$/;
  const r2=/^HBRQ-[0-9]{3}$/;

  if(!r1.test(prefixo)||!r2.test(protocolo)){
    alert("Formato inválido");
    return;
  }

  await addDoc(collection(db,"pecas"),{
    prefixo,
    protocolo,
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

  data.forEach((item)=>{
    table_body.innerHTML+=`
    <tr>
      <td>${item.prefixo}</td>
      <td>${item.protocolo}</td>
      <td><span class="tag ${item.setor}">${item.setor}</span></td>
      <td><span class="tag ${item.engenharia}">${item.engenharia}</span></td>
      <td><span class="tag ${item.status}">${item.status}</span></td>
      <td>${item.data}</td>
      <td><button class="delete-btn" onclick="deleteItem('${item.id}')">Excluir</button></td>
    </tr>`;
  });
}

// DELETE
window.deleteItem = async function(id){
  await deleteDoc(doc(db,"pecas",id));
  carregarDados();
};

// DASHBOARD
function updateDashboard(){
  count_espera.innerText =
    data.filter(d=>d.engenharia==="espera").length;

  count_scrap.innerText =
    data.filter(d=>d.status==="scrap").length;

  count_entregue.innerText =
    data.filter(d=>d.status==="entregue").length;

  count_outros.innerText =
    data.filter(d=>!["scrap","entregue"].includes(d.status)).length;
}

// GRÁFICOS
function gerarGrafico(){

  if(chart) chart.destroy();
  if(chartPizza) chartPizza.destroy();

  chart = new Chart(grafico,{
    type:"line",
    data:{
      labels:["Jan","Fev","Mar"],
      datasets:[{
        label:"Peças",
        data:[2,4,6],
        borderColor:"#00c853",
        tension:0.3
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });

  const statusCount = {};

  data.forEach(d=>{
    if(d.status){
      statusCount[d.status] = (statusCount[d.status] || 0) + 1;
    }
  });

  chartPizza = new Chart(graficoPizza,{
    type:"pie",
    data:{
      labels:Object.keys(statusCount),
      datasets:[{
        data:Object.values(statusCount),
        backgroundColor:[
          "green","red","orange","#007aff","#555"
        ]
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });
}

// INIT
carregarDados();
