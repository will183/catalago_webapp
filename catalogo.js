// Catálogo do cliente: lista os produtos ativos e controla o carrinho.

// Id da loja: use o mesmo valor que você já colocou aqui antes.
const LOJA_ID = '2290e0e9-db12-4498-8fc5-a8a397ac3ec7';

// Um carrinho por loja, para não misturar pedidos de lojas diferentes.
const CHAVE_CARRINHO = `carrinho_${LOJA_ID}`;
let carrinho = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) || '[]');

// ---------- LOJA ----------

async function carregarLoja() {
  const { data, error } = await db
    .from('lojas')
    .select('nome')
    .eq('id', LOJA_ID)
    .single();

  if (!error && data) {
    document.getElementById('nome-loja').textContent = data.nome;
  }
}

// ---------- PRODUTOS ----------

async function carregarProdutos() {
  const { data, error } = await db
    .from('produtos')
    .select('id, nome, descricao, preco, categoria')
    .eq('loja_id', LOJA_ID)
    .eq('ativo', true)
    .order('categoria')
    .order('nome');

  if (error) {
    console.error('Erro ao carregar produtos:', error);
    return;
  }
  renderizarProdutos(data);
}

function renderizarProdutos(produtos) {
  const area = document.getElementById('produtos');
  area.innerHTML = '';

  if (produtos.length === 0) {
    area.textContent = 'Nenhum produto disponível no momento.';
    return;
  }

  produtos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'produto';

    const titulo = document.createElement('h3');
    titulo.textContent = p.nome;

    const desc = document.createElement('p');
    desc.textContent = p.descricao || '';

    const preco = document.createElement('strong');
    preco.textContent = `R$ ${Number(p.preco).toFixed(2)} `;

    const botao = document.createElement('button');
    botao.textContent = 'Adicionar';
    botao.addEventListener('click', () => adicionarAoCarrinho(p));

    div.append(titulo, desc, preco, botao);
    area.appendChild(div);
  });
}

// ---------- CARRINHO ----------

function adicionarAoCarrinho(produto) {
  const item = carrinho.find(i => i.id === produto.id);
  if (item) {
    item.quantidade += 1;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      quantidade: 1
    });
  }
  atualizarCarrinho();
}

function alterarQuantidade(id, delta) {
  const item = carrinho.find(i => i.id === id);
  if (!item) return;

  item.quantidade += delta;
  if (item.quantidade <= 0) {
    carrinho = carrinho.filter(i => i.id !== id);
  }
  atualizarCarrinho();
}

function calcularTotal() {
  return carrinho.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
}

function atualizarCarrinho() {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
  renderizarCarrinho();
}

function renderizarCarrinho() {
  const lista = document.getElementById('itens-carrinho');
  lista.innerHTML = '';

  if (carrinho.length === 0) {
    const vazio = document.createElement('li');
    vazio.textContent = 'Carrinho vazio';
    lista.appendChild(vazio);
  }

  carrinho.forEach(i => {
    const li = document.createElement('li');

    const menos = document.createElement('button');
    menos.textContent = '−';
    menos.addEventListener('click', () => alterarQuantidade(i.id, -1));

    const qtd = document.createElement('span');
    qtd.textContent = ` ${i.quantidade} `;

    const mais = document.createElement('button');
    mais.textContent = '+';
    mais.addEventListener('click', () => alterarQuantidade(i.id, 1));

    const texto = document.createElement('span');
    texto.textContent = ` ${i.nome} — R$ ${(i.preco * i.quantidade).toFixed(2)}`;

    li.append(menos, qtd, mais, texto);
    lista.appendChild(li);
  });

  document.getElementById('total').textContent = `R$ ${calcularTotal().toFixed(2)}`;
  document.getElementById('btn-enviar').disabled = carrinho.length === 0;
}

// ---------- EVENTOS E INICIALIZAÇÃO ----------

// O envio do pedido entra na Etapa 5.


carregarLoja();
carregarProdutos();
renderizarCarrinho();