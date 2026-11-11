// URL base da sua API ASP.NET Core
const API_URL = "http://localhost:5004";

// --- CONTROLO DE ECRÃS ---
function mostrarRegisto() {
    document.getElementById("formLogin").style.display = "none";
    document.getElementById("formRegisto").style.display = "block";
}

function mostrarLogin() {
    document.getElementById("formRegisto").style.display = "none";
    document.getElementById("formLogin").style.display = "block";
}

// --- AUTENTICAÇÃO ---
async function criarUtilizador(event) {
    if (event) event.preventDefault(); // Impede o recarregamento da página

    const user = document.getElementById("novoUsername").value;
    const pass = document.getElementById("novaPassword").value;
    const conf = document.getElementById("confirmarPassword").value;
    const msgDiv = document.getElementById("mensagemRegisto");

    if (pass !== conf) {
        exibirMensagem(msgDiv, "As palavras-passe não coincidem.", true);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/registo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        const texto = await res.text();
        if (res.ok) {
            exibirMensagem(msgDiv, texto, false);
            setTimeout(() => { mostrarLogin(); }, 1500);
        } else {
            exibirMensagem(msgDiv, texto, true);
        }
    } catch (err) {
        exibirMensagem(msgDiv, "Erro ao ligar ao servidor.", true);
    }
}

async function fazerLogin(event) {
    if (event) event.preventDefault(); // Impede o recarregamento da página

    const user = document.getElementById("loginUsername").value;
    const pass = document.getElementById("loginPassword").value;
    const msgDiv = document.getElementById("mensagemLogin");

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById("formLogin").style.display = "none";
            document.getElementById("paginaPrincipal").style.display = "block";
            document.getElementById("utilizadorAtual").innerText = data.username;
            carregarClientes();
        } else {
            const textoErro = await res.text();
            exibirMensagem(msgDiv, textoErro, true);
        }
    } catch (err) {
        exibirMensagem(msgDiv, "Erro ao ligar ao servidor.", true);
    }
}

function fazerLogout(event) {
    if (event) event.preventDefault();
    document.getElementById("paginaPrincipal").style.display = "none";
    document.getElementById("formLogin").style.display = "block";
}

// --- CÁLCULO DE IVA ---
async function calcularIVA(event) {
    if (event) event.preventDefault(); // Impede o recarregamento da página

    const valor = document.getElementById("valorBase").value;
    const divRes = document.getElementById("resultadoIVA");

    try {
        const res = await fetch(`${API_URL}/api/calculo-iva?valorBase=${valor}`);
        const data = await res.json();
        if (res.ok) {
            divRes.innerText = `Base: ${data.base.toFixed(2)}€ | IVA (23%): ${data.iva.toFixed(2)}€ | Total: ${data.total.toFixed(2)}€`;
        } else {
            divRes.innerText = "Erro ao calcular IVA.";
        }
    } catch (err) {
        divRes.innerText = "Erro na comunicação com a API.";
    }
}

// --- GESTÃO DE CLIENTES ---
async function guardarCliente(event) {
    if (event) event.preventDefault(); // Impede o recarregamento da página

    const elNome = document.getElementById("nomeCliente");
    const elNif = document.getElementById("nifCliente");
    const divResultado = document.getElementById("resultadoGuardar");

    const nome = elNome ? elNome.value : "";
    const nif = elNif ? elNif.value : "";

    if (!nome || !nif || !divResultado) return;

    try {
        const res = await fetch(`${API_URL}/api/clientes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: nome, nif: nif })
        });

        const msg = await res.text();
        divResultado.innerText = msg;

        if (res.ok) {
            elNome.value = "";
            elNif.value = "";
            carregarClientes();
        }
    } catch (err) {
        divResultado.innerText = "Erro ao guardar cliente.";
    }
}

async function carregarClientes() {
    const tbody = document.getElementById("ListaClientes");
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/api/clientes`);
        const clientes = await res.json();

        let html = "";
        for (let i = 0; i < clientes.length; i++) {
            const item = clientes[i];
            html += `<tr>
                <td>${item.id}</td>
                <td>${item.nome}</td>
                <td>${item.nif}</td>
            </tr>`;
        }

        tbody.innerHTML = html;
    } catch (err) {
        tbody.innerHTML = "<tr><td colspan='3'>Erro ao carregar lista de clientes.</td></tr>";
    }
}

// Auxiliar para mensagens
function exibirMensagem(elemento, texto, isErro) {
    elemento.innerText = typeof texto === 'object' ? JSON.stringify(texto) : texto;
    elemento.className = `mensagem ${isErro ? 'erro' : 'sucesso'}`;
    elemento.style.display = "block";
}